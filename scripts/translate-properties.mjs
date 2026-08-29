/**
 * İLAN METİNLERİNİ DOLDUR — `data/villas.json` içindeki boş `tr`/`ru` alanları.
 *
 * `lib/localized.ts` bu betiği yıllar önce tarif etmişti: "Boş bir çeviri,
 * kayıp bir veri değil BEKLEYEN BİR İŞtir — ileride DeepL kuyruğu tam olarak
 * bu boşlukları tarayacak (`missingLocales`)." Bu, o kuyruk.
 *
 * ⚠️ YALNIZCA BOŞ ALANLAR DOLDURULUR. Dolu bir çeviri — yönetici panelinden
 * elle yazılmış olabilir — ASLA ezilmez. "Boş" tanımı `lib/localized.ts`
 * içindeki `isEmpty` ile birebir aynı: null, undefined, "" ve [""].
 *
 * ⚠️ YEDEK ALINMIYOR, BİLİNÇLİ OLARAK. `migrate-villas-i18n.mjs` zaman
 * damgalı bir kopya bırakıyordu; o yedekler 548 KB'lık türev dosyalar olarak
 * birikip depoya girmek üzereydi ve `.gitignore`a alındılar. Bu betiğin geri
 * alma yolu git: `data/villas.json` sürüm takibinde ve çalıştırmadan önce
 * çalışma ağacının temiz olması isteniyor (bkz. aşağıdaki kontrol).
 *
 * Kullanım:
 *   node scripts/translate-properties.mjs --dry-run
 *   node scripts/translate-properties.mjs --lang tr
 *   node scripts/translate-properties.mjs --lang both --limit 5
 */

import { readFile, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import path from "node:path";

import {
  assertQuota,
  fetchUsage,
  loadCache,
  loadEnvLocal,
  parseArgs,
  requireApiKey,
  saveCache,
  translateTexts,
} from "./lib/deepl.mjs";

const ROOT = process.cwd();
const TARGET = path.join(ROOT, "data", "villas.json");

/**
 * ÇEVRİLEBİLİR ALANLAR — yedi alan, ikisi iç içe.
 *
 * İlk sürümde burada yalnızca üç alan vardı; `headline`, `features` ve
 * `seo.*` şemada düz değerdi ve çevirinin yazılacağı bir `tr` alanı yoktu.
 * Şema göçü (`scripts/migrate-villas-i18n.mjs` ikinci dalga) onları da
 * `Localized<T>` yaptı, bu liste de genişledi.
 *
 * ⚠️ `seo.keywords` BİLİNÇLİ OLARAK YOK — çevrilmiyor (bkz. lib/types.ts).
 */
const TRANSLATABLE = [
  "title",
  "description",
  "whyThisOne",
  "headline",
  "features",
  "seo.title",
  "seo.description",
];

/** `lib/localized.ts` `isEmpty` ile birebir aynı kural. */
function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) {
    return (
      value.length === 0 ||
      value.every((item) => typeof item === "string" && item.trim().length === 0)
    );
  }
  return false;
}

/** "seo.title" gibi iç içe yolları çözer; ara düğüm yoksa undefined. */
function resolve(villa, path) {
  return path.split(".").reduce((node, key) => node?.[key], villa);
}

/** Alan üç dilli biçimde mi? (`{ en: ... }`) */
function isLocalized(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.hasOwn(value, "en")
  );
}

/**
 * ÇALIŞMA AĞACI TEMİZ Mİ? — geri alma yolunun var olduğunu garanti eder.
 *
 * Bu betik 57 kaydın tek kaynağını yerinde değiştiriyor. Kirli bir ağaçta
 * çalıştırılırsa, sonuç beğenilmediğinde `git checkout -- data/villas.json`
 * yalnızca betiğin yazdığını değil, kullanıcının el emeğini de siler.
 */
function assertCleanWorktree(force) {
  let dirty = "";
  try {
    dirty = execSync("git status --porcelain -- data/villas.json", {
      encoding: "utf8",
      cwd: ROOT,
    }).trim();
  } catch {
    return; /* Git yoksa (tarball kopyası) engelleme. */
  }

  if (!dirty) return;

  if (force) {
    console.warn("⚠️  data/villas.json'da kaydedilmemiş değişiklik var — --force ile devam.");
    return;
  }

  throw new Error(
    "data/villas.json'da kaydedilmemiş değişiklik var.\n" +
      "  Önce commit'leyin ya da geri alın; böylece bu betiğin yazdığı\n" +
      "  şeyi `git diff` ile tek başına görebilirsiniz. (--force ile geçilir.)",
  );
}

/* ------------------------------------------------------------------ AKIŞ */

const args = parseArgs(process.argv.slice(2));
const dryRun = Boolean(args["dry-run"]);
const force = Boolean(args.force);
const limit = args.limit ? Number(args.limit) : Infinity;

const langArg = String(args.lang ?? "both").toLowerCase();
const LANGS = langArg === "both" ? ["tr", "ru"] : [langArg];

if (!LANGS.every((lang) => ["tr", "ru"].includes(lang))) {
  console.error(`Bilinmeyen dil: ${langArg} (beklenen: tr, ru, both)`);
  process.exit(1);
}

await loadEnvLocal();

const villas = JSON.parse(await readFile(TARGET, "utf8"));
const scope = villas.slice(0, limit);

console.log(`\n📄 ${TARGET}`);
console.log(`   ${villas.length} ilan, işlenecek: ${scope.length}\n`);

/*
  ŞEMA RAPORU — istenen ama karşılanamayan alanlar sessizce atlanmıyor.
  Kullanıcı "features çevrilsin" dedi; çevrilmediyse bunu ekranda görmeli.
*/
const plainCounts = Object.fromEntries(TRANSLATABLE.map((field) => [field, 0]));
for (const villa of villas) {
  for (const field of TRANSLATABLE) {
    const value = resolve(villa, field);
    /* `whyThisOne` opsiyonel: hiç yoksa "göç edilmemiş" sayılmaz. */
    if (value !== undefined && !isLocalized(value)) plainCounts[field]++;
  }
}

const blocked = TRANSLATABLE.filter((field) => plainCounts[field] > 0);
if (blocked.length > 0) {
  console.log("⚠️  HENÜZ GÖÇ ETMEMİŞ ALANLAR — atlanıyor:");
  for (const field of blocked) {
    console.log(`      ${field.padEnd(16)} ${plainCounts[field]}/${villas.length} kayıtta düz değer`);
  }
  console.log("      Önce çalıştırın:  node scripts/migrate-villas-i18n.mjs\n");
}

/* --- Hangi metinler eksik? Diller arası tek tarama. --- */
const jobs = []; /* { villa, field, lang, sources:string[] } */

for (const villa of scope) {
  for (const field of TRANSLATABLE) {
    const node = resolve(villa, field);
    if (!isLocalized(node) || isEmpty(node.en)) continue;

    for (const lang of LANGS) {
      if (!isEmpty(node[lang])) continue; /* Elle yazılmış çeviri korunur. */

      const sources = Array.isArray(node.en) ? node.en : [node.en];
      jobs.push({ node, field, lang, sources, isArray: Array.isArray(node.en) });
    }
  }
}

if (jobs.length === 0) {
  console.log("✅ Doldurulacak boş alan yok.\n");
  process.exit(0);
}

const byLang = {};
for (const lang of LANGS) {
  byLang[lang] = jobs.filter((job) => job.lang === lang).flatMap((job) => job.sources);
}

const cache = await loadCache();
const apiKey = dryRun ? null : requireApiKey();

if (!dryRun) assertCleanWorktree(force);

/* --- Maliyet önizlemesi (önbellek düşülmüş hâliyle) --- */
let needed = 0;
const preview = {};

for (const lang of LANGS) {
  const target = lang.toUpperCase();
  const { pendingCount, chars } = await translateTexts(byLang[lang], target, {
    apiKey,
    cache,
    dryRun: true,
  });
  preview[lang] = { pendingCount, chars };
  needed += chars;
}

console.log("📊 Yapılacak iş:");
for (const lang of LANGS) {
  console.log(
    `   ${lang.toUpperCase()}: ${preview[lang].pendingCount} yeni metin, ` +
      `${preview[lang].chars.toLocaleString("tr-TR")} karakter`,
  );
}
console.log(`   TOPLAM: ${needed.toLocaleString("tr-TR")} karakter\n`);

if (dryRun) {
  console.log("🔍 --dry-run: API çağrısı yapılmadı, dosya değişmedi.\n");
  process.exit(0);
}

const usage = await fetchUsage(apiKey);
assertQuota({ needed, remaining: usage.remaining, force });
console.log();

/* --- Çeviri --- */
for (const lang of LANGS) {
  const target = lang.toUpperCase();
  console.log(`🌐 ${target} çevriliyor…`);

  const { result } = await translateTexts(byLang[lang], target, {
    apiKey,
    cache,
    dryRun: false,
  });

  let filled = 0;
  for (const job of jobs.filter((item) => item.lang === lang)) {
    const translated = job.sources.map((source) => result.get(source) ?? source);
    /* Kaynak dizi miydi? Çıktı da dizi olmalı — şekil korunuyor. */
    job.node[lang] = job.isArray ? translated : translated[0];
    filled++;
  }

  console.log(`   ${filled} alan dolduruldu.\n`);
  await saveCache(cache); /* Her dilden sonra kaydet: yarıda kalırsa kayıp olmasın. */
}

/* --- Yazma: biçim ve anahtar sırası korunur --- */
await writeFile(TARGET, JSON.stringify(villas, null, 2) + "\n", "utf8");
await saveCache(cache);

console.log(`💾 ${TARGET} güncellendi.`);
console.log("   Kontrol:  git diff --stat data/villas.json\n");
