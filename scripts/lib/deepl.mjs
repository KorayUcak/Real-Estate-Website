/**
 * DeepL ORTAK KATMANI — iki çeviri betiğinin paylaştığı taban.
 *
 * `translate-properties.mjs` ve `translate-dictionary.mjs` aynı dört sorunu
 * çözmek zorunda: anahtarı yüklemek, yer tutucuları korumak, kotayı
 * tüketmemek ve 429'da pes etmemek. Bunları iki dosyaya kopyalamak, birinde
 * düzeltilen bir hatanın diğerinde yaşamaya devam etmesi demekti.
 *
 * ⚠️ KOTA BU DOSYANIN VAR OLMA SEBEBİ. Sözlük ve ilan metinleri iki dile
 * çevrildiğinde ~465.000 karakter ediyor (tekilleştirme sonrası ölçüldü).
 *
 * DeepL'in belgelediği ücretsiz kota ayda 500.000 karakter — yani bu iş tek
 * bir çalıştırmada kotanın neredeyse tamamını yerdi. Bu hesapta `/v2/usage`
 * 1.000.000 döndürüyor (ölçüldü), ama betikler BELGELENEN sınıra göre
 * tasarlandı: limit hesaba göre değişebilir ve kota ortasında biten bir
 * çalıştırma `villas.json`u yarım çevrilmiş bırakır.
 *
 * Buradaki önbellek, kota ön kontrolü ve `--dry-run` bunun için var: gerçek
 * limit ne olursa olsun, ikinci çalıştırma sıfır karakter harcamalı.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const ROOT = process.cwd();
const ENV_FILE = path.join(ROOT, ".env.local");
const CACHE_FILE = path.join(ROOT, "scripts", ".deepl-cache.json");

/** Free anahtarları `:fx` ile biter ve YALNIZCA api-free alan adına gider. */
const API_BASE = "https://api-free.deepl.com/v2";

/** Tek istekte en fazla kaç metin — DeepL'in belgelediği sınır 50. */
const MAX_TEXTS_PER_REQUEST = 50;
/** İstek gövdesi için güvenli üst sınır (belgelenen sınır 128 KiB). */
const MAX_BYTES_PER_REQUEST = 100_000;

/* ------------------------------------------------------------------ ENV */

/**
 * `.env.local` OKUYUCUSU — `dotenv` BAĞIMLILIĞI OLMADAN.
 *
 * Neden paket kurulmadı: bu depo Node 22 kullanıyor ve Node 20.6'dan beri
 * `node --env-file=.env.local` yerleşik olarak aynı işi yapıyor. Yalnızca
 * `KEY=value` ayrıştırmak için `node_modules`a bir paket daha eklemek,
 * çalışma zamanı bağımlılığı olmayan iki betiğe kalıcı bir bakım yükü
 * getirirdi.
 *
 * Bu okuyucu her iki yolu da açık bırakıyor: `--env-file` ile çalıştırılırsa
 * değişken zaten `process.env`de olur ve buradaki okuma onu EZMEZ.
 */
export async function loadEnvLocal() {
  let raw;
  try {
    raw = await readFile(ENV_FILE, "utf8");
  } catch {
    return; /* Dosya yoksa sorun değil: değişken ortamdan gelmiş olabilir. */
  }

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    /* Gerçek ortam değişkeni her zaman kazanır. */
    if (process.env[key] !== undefined) continue;

    let value = rawValue.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

/** Anahtar yoksa çalışmaya BAŞLAMADAN dur — yarım iş bırakmasın. */
export function requireApiKey() {
  const key = process.env.DEEPL_API_KEY?.trim();

  if (!key) {
    throw new Error(
      "DEEPL_API_KEY tanımlı değil.\n" +
        `  .env.local içine ekleyin:  DEEPL_API_KEY=xxxxxxxx:fx\n` +
        `  (aranan dosya: ${ENV_FILE})`,
    );
  }

  /*
    Ücretsiz anahtarlar ":fx" ile biter ve api-free alan adını ister; Pro
    anahtarı buraya yazılırsa DeepL 403 döner ve hata mesajı "yanlış
    anahtar" der, "yanlış alan adı" demez. Baştan söylemek daha ucuz.
  */
  if (!key.endsWith(":fx")) {
    console.warn(
      "⚠️  Anahtar ':fx' ile bitmiyor — bu bir Pro anahtarı olabilir.\n" +
        "    Bu betikler api-free.deepl.com adresine gider; Pro anahtarı 403 döndürür.",
    );
  }

  return key;
}

/* ------------------------------------------------- YER TUTUCU KORUMASI */

/**
 * `{count}` gibi değişkenleri DeepL'in ÇEVİRMESİNİ engelleyen sarmalama.
 *
 * Kalıp `lib/i18n/index.ts` içindeki `interpolate` ile BİREBİR aynı:
 * `/\{(\w+)\}/g`. İki yerde iki farklı kalıp olsaydı, buradan sağ çıkan
 * bir yer tutucu orada doldurulmayıp ekranda "{cont}" olarak görünürdü.
 *
 * ⚠️ NEDEN `ignore_tags` TEK BAŞINA YETMİYOR: DeepL'in `ignore_tags`
 * parametresi XML ETİKETLERİ üzerinde çalışır, süslü parantez üzerinde
 * değil. Yani önce yer tutucuyu bir etikete çevirmek gerekiyor:
 *
 *   "{count} listing"  →  "<ph>{count}</ph> listing"
 *
 * `tag_handling: "xml"` + `ignore_tags: ["ph"]` ikilisi bu etiketin İÇİNİ
 * dokunulmadan geçiriyor, ama etiketi cümle içinde SERBESTÇE TAŞIYABİLİYOR —
 * Türkçe ve Rusça'da sözcük sırası değiştiği için bu şart. Kendi başına
 * "çevirme" demek yetmez; "çevirme ama yerini değiştirebilirsin" demek gerek.
 */
const PLACEHOLDER = /\{\w+\}/g;

/**
 * ⚠️ SIRA ÖNEMLİ: önce XML kaçışı, sonra etiket sarma.
 *
 * `tag_handling: "xml"` girdiyi XML olarak ayrıştırıyor; içindeki çıplak
 * bir `&` ("Meet Ronnie & Nilay" — sözlükte altı yerde geçiyor) girdiyi
 * bozuk XML yapar ve DeepL 400 döner. Kaçış ÖNCE yapılıyor ki sarmaladığımız
 * `<ph>` etiketleri kaçıştan etkilenmesin.
 */
export function protect(text) {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped.replace(PLACEHOLDER, (match) => `<ph>${match}</ph>`);
}

/**
 * `protect`in tersi: etiketleri söküp XML varlıklarını geri çevirir.
 *
 * ⚠️ `&amp;` EN SONA BIRAKILIYOR. Önce çözülseydi "&amp;lt;" dizisi önce
 * "&lt;" olur, sonra ikinci kural onu "<" yapardı — yani kaynakta düz metin
 * olan bir şey çeviride etikete dönüşürdü.
 */
export function restore(text) {
  return text
    .replace(/<\/?ph>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/* -------------------------------------------------------------- ÖNBELLEK */

/**
 * DİSK ÖNBELLEĞİ — kotanın tek gerçek sigortası.
 *
 * Anahtar: hedef dil + kaynak metnin SHA-1'i. Aynı cümle iki ilanda da
 * geçiyorsa (taşınan veride "Sea view" 40'tan fazla kayıtta var) DeepL'e
 * bir kez gidiyor.
 *
 * Dosya `.gitignore`da: 500 KB'lık bir türev çıktı, sürüm geçmişine ait
 * değil ve makineler arası taşınması gerekmiyor.
 */
export async function loadCache() {
  try {
    return JSON.parse(await readFile(CACHE_FILE, "utf8"));
  } catch {
    return {};
  }
}

export async function saveCache(cache) {
  await mkdir(path.dirname(CACHE_FILE), { recursive: true });
  await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2) + "\n", "utf8");
}

export function cacheKey(targetLang, text) {
  return `${targetLang}:${createHash("sha1").update(text).digest("hex")}`;
}

/* ------------------------------------------------------------- KOTA */

/** Hesabın kalan karakter hakkı — HARCAMADAN ÖNCE sorulur. */
export async function fetchUsage(apiKey) {
  const response = await fetch(`${API_BASE}/usage`, {
    headers: { Authorization: `DeepL-Auth-Key ${apiKey}` },
  });

  if (!response.ok) {
    throw new Error(
      `Kota sorgusu başarısız (HTTP ${response.status}). ` +
        (response.status === 403
          ? "Anahtar geçersiz ya da Pro anahtarı ücretsiz uç noktaya gönderiliyor."
          : await response.text()),
    );
  }

  const { character_count: used, character_limit: limit } = await response.json();
  return { used, limit, remaining: limit - used };
}

/* --------------------------------------------------------- ÇEVİRİ */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * TEK PARTİ — yeniden deneme mantığı burada.
 *
 * 429 (hız sınırı) ve 5xx geçici; üstel geriye çekilme + jitter ile
 * yeniden deneniyor. 456 (kota bitti) ve 403 (anahtar) KALICI: yeniden
 * denemek yalnızca zaman kaybı olur, o yüzden anında fırlatılıyor.
 */
async function translateBatch(texts, targetLang, apiKey, attempt = 0) {
  const response = await fetch(`${API_BASE}/translate`, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: texts,
      source_lang: "EN",
      target_lang: targetLang,
      /* Yer tutucu koruması bu ikilinin üstüne kurulu — bkz. `protect`. */
      tag_handling: "xml",
      ignore_tags: ["ph"],
      /*
        DeepL varsayılan olarak baştaki/sondaki boşluğu ve cümle sonu
        noktalamasını "düzeltiyor". Arayüz metinlerinde bu istenmiyor:
        "Save" → "Kaydet." gibi bir nokta, düğme etiketinde yanlış.
      */
      preserve_formatting: true,
    }),
  });

  if (response.ok) {
    const data = await response.json();
    return data.translations.map((item) => item.text);
  }

  /* --- Kalıcı hatalar: yeniden denemenin faydası yok --- */
  if (response.status === 403) {
    throw new Error(
      "DeepL 403: anahtar geçersiz veya yetkisiz.\n" +
        "  Ücretsiz anahtar (':fx') api-free.deepl.com ister; Pro anahtarı buraya gönderilemez.",
    );
  }

  if (response.status === 456) {
    throw new Error(
      "DeepL 456: aylık karakter kotası doldu.\n" +
        "  Kota bir sonraki fatura döneminde sıfırlanır. `--dry-run` ile\n" +
        "  ne kadar gerektiğini kotayı harcamadan görebilirsiniz.",
    );
  }

  if (response.status === 400) {
    throw new Error(`DeepL 400 (geçersiz istek): ${await response.text()}`);
  }

  /* --- Geçici hatalar: 429 ve 5xx --- */
  const retryable = response.status === 429 || response.status >= 500;
  const MAX_ATTEMPTS = 6;

  if (retryable && attempt < MAX_ATTEMPTS) {
    /*
      Üstel geriye çekilme + jitter. Jitter olmasaydı paralel parçalar
      aynı anda uyanıp aynı duvara tekrar çarpardı.
    */
    const backoff = Math.min(2 ** attempt * 1000, 30_000);
    const wait = backoff + Math.random() * 500;

    console.warn(
      `   ↻ HTTP ${response.status} — ${Math.round(wait)}ms sonra yeniden ` +
        `(${attempt + 1}/${MAX_ATTEMPTS})`,
    );
    await sleep(wait);
    return translateBatch(texts, targetLang, apiKey, attempt + 1);
  }

  throw new Error(
    `DeepL ${response.status} — ${MAX_ATTEMPTS} denemeden sonra pes edildi: ` +
      (await response.text()),
  );
}

/**
 * Benzersiz metinleri çevirir; sonucu `Map<kaynak, çeviri>` olarak döndürür.
 *
 * ⚠️ ÇAĞIRAN TARAF TEKİLLEŞTİRME YAPMAK ZORUNDA DEĞİL: burada zaten
 * `Set`ten geçiyor. Aynı ilan cümlesi 40 kayıtta geçse bile bir kez gidiyor.
 */
export async function translateTexts(sources, targetLang, { apiKey, cache, dryRun }) {
  const result = new Map();
  const pending = [];

  for (const text of new Set(sources)) {
    if (!text || !text.trim()) continue;

    const key = cacheKey(targetLang, text);
    if (cache[key] !== undefined) {
      result.set(text, cache[key]);
      continue;
    }
    pending.push(text);
  }

  const chars = pending.reduce((sum, text) => sum + text.length, 0);

  if (dryRun) {
    return { result, pendingCount: pending.length, chars, cached: result.size };
  }

  /* --- Partilere böl: hem adet hem bayt sınırına göre --- */
  const batches = [];
  let batch = [];
  let bytes = 0;

  for (const text of pending) {
    const protectedText = protect(text);
    const size = Buffer.byteLength(protectedText, "utf8");

    if (
      batch.length >= MAX_TEXTS_PER_REQUEST ||
      (batch.length > 0 && bytes + size > MAX_BYTES_PER_REQUEST)
    ) {
      batches.push(batch);
      batch = [];
      bytes = 0;
    }

    batch.push(text);
    bytes += size;
  }
  if (batch.length > 0) batches.push(batch);

  for (const [index, group] of batches.entries()) {
    process.stdout.write(
      `   parti ${index + 1}/${batches.length} (${group.length} metin)…\r`,
    );

    const translated = await translateBatch(
      group.map(protect),
      targetLang,
      apiKey,
    );

    group.forEach((source, i) => {
      const value = restore(translated[i]);
      result.set(source, value);
      cache[cacheKey(targetLang, source)] = value;
    });

    /* Ücretsiz katmanda nazik davran: partiler arasında kısa bir aralık. */
    if (index < batches.length - 1) await sleep(250);
  }

  if (batches.length > 0) process.stdout.write("\n");

  return { result, pendingCount: pending.length, chars, cached: result.size - pending.length };
}

/** `--flag=value` / `--flag value` / `--flag` üçlüsünü okuyan mini ayrıştırıcı. */
export function parseArgs(argv) {
  const args = { _: [] };

  for (let i = 0; i < argv.length; i++) {
    const item = argv[i];
    if (!item.startsWith("--")) {
      args._.push(item);
      continue;
    }

    const [name, inline] = item.slice(2).split("=");
    if (inline !== undefined) {
      args[name] = inline;
    } else if (argv[i + 1] && !argv[i + 1].startsWith("--")) {
      args[name] = argv[++i];
    } else {
      args[name] = true;
    }
  }

  return args;
}

/**
 * Kotanın yetip yetmediğini ÇEVİRMEDEN ÖNCE söyler.
 *
 * `--force` ile geçilebilir; ama varsayılan davranış durmak, çünkü kota
 * ortasında biten bir çalıştırma `villas.json`u YARIM çevrilmiş bırakır.
 */
export function assertQuota({ needed, remaining, force }) {
  console.log(
    `   kota: ${remaining.toLocaleString("tr-TR")} karakter kaldı, ` +
      `${needed.toLocaleString("tr-TR")} gerekiyor`,
  );

  if (needed <= remaining) return;

  const message =
    `Kota yetmiyor: ${needed.toLocaleString("tr-TR")} gerekli, ` +
    `${remaining.toLocaleString("tr-TR")} kaldı.`;

  if (!force) {
    throw new Error(
      `${message}\n` +
        "  --limit ile daha az kayıt çevirebilir ya da --force ile yine de\n" +
        "  başlayabilirsiniz (kota bitince yarıda kalır).",
    );
  }

  console.warn(`⚠️  ${message} --force verildi, yine de deneniyor.`);
}
