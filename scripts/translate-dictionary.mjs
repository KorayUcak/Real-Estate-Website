/**
 * SÖZLÜK YENİDEN ÇEVİRİSİ — `en.json` kaynak, `tr.json` / `ru.json` çıktı.
 *
 * `translate-properties.mjs`ten farkı: orada BOŞ alanlar dolduruluyor,
 * burada MEVCUT çeviriler bilinçli olarak EZİLİYOR. Sebep, elde duran
 * Türkçe/Rusça metnin doğal okunmaması.
 *
 * ⚠️ ŞEKİL `en.json`DAN ÜRETİLİYOR, hedef dosyadan değil. `lib/i18n/index.ts`
 * içinde `Dictionary = typeof en` yazıyor: üç sözlüğün anahtar ağacı BİREBİR
 * aynı olmak zorunda, yoksa eksik anahtar kontrolü derleme hatası üretir.
 * Çıktı `en.json` gezilerek kurulduğu için şekil yapısal olarak garanti —
 * hedef dosyada fazladan/eksik anahtar kalması imkânsız.
 *
 * ⚠️ ÇOĞUL BLOKLARI VARSAYILAN OLARAK KORUNUYOR — bu betikteki en önemli
 * karar. Ayrıntı aşağıda `isPluralBlock` notunda.
 *
 * Kullanım:
 *   node scripts/translate-dictionary.mjs --dry-run
 *   node scripts/translate-dictionary.mjs --lang tr
 *   node scripts/translate-dictionary.mjs --lang both
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
const DICT_DIR = path.join(ROOT, "lib", "i18n", "dictionaries");
const SOURCE = path.join(DICT_DIR, "en.json");

const PLURAL_KEYS = ["one", "few", "many", "other"];

/**
 * ⚠️ ÇOĞUL BLOĞU — MAKİNE ÇEVİRİSİNİN SESSİZCE BOZDUĞU YER.
 *
 * `lib/i18n/index.ts` çoğulu `Intl.PluralRules` ile seçiyor ve sözlükte
 * dört kategori de tanımlı olmak zorunda. İngilizcede bu dördü İKİ farklı
 * metinden ibaret:
 *
 *   one: "{count} listing"      few/many/other: "{count} listings"
 *
 * Rusça'da ise üçü de FARKLI çekim ister ve mevcut ru.json bunu doğru
 * yapıyor:
 *
 *   one: "{count} объект"   few: "{count} объекта"   many: "{count} объектов"
 *
 * DeepL her dizeyi bağlamsız çevirir. `few`, `many` ve `other` alanlarının
 * hepsine aynı İngilizce girdi ("{count} listings") gideceği için ÜÇÜ DE
 * AYNI Rusça çıktıyı alır — yani doğru çekimli üç biçim, tek bir yanlış
 * biçime çökerdi. Bu, ekranda "5 объекта" gibi bozuk bir dilbilgisi demek.
 *
 * Bu yüzden çoğul blokları varsayılan olarak KORUNUYOR: mevcut hedef
 * dosyadaki değer olduğu gibi taşınıyor. `--force-plurals` bunu kapatır,
 * ama o zaman çıktının elle düzeltilmesi gerekir.
 */
function isPluralBlock(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((key) => PLURAL_KEYS.includes(key));
}

/* ------------------------------------------------------------------ AKIŞ */

const args = parseArgs(process.argv.slice(2));
const dryRun = Boolean(args["dry-run"]);
const force = Boolean(args.force);
const forcePlurals = Boolean(args["force-plurals"]);

const langArg = String(args.lang ?? "both").toLowerCase();
const LANGS = langArg === "both" ? ["tr", "ru"] : [langArg];

if (!LANGS.every((lang) => ["tr", "ru"].includes(lang))) {
  console.error(`Bilinmeyen dil: ${langArg} (beklenen: tr, ru, both)`);
  process.exit(1);
}

await loadEnvLocal();

const english = JSON.parse(await readFile(SOURCE, "utf8"));

/**
 * ÇALIŞMA AĞACI KONTROLÜ — betik iki dosyayı tamamen yeniden yazıyor.
 * Kirli bir ağaçta `git checkout` ile geri dönmek kullanıcının kendi
 * düzenlemelerini de silerdi.
 */
function assertCleanWorktree() {
  const targets = LANGS.map((lang) => `lib/i18n/dictionaries/${lang}.json`);
  let dirty = "";
  try {
    dirty = execSync(`git status --porcelain -- ${targets.join(" ")}`, {
      encoding: "utf8",
      cwd: ROOT,
    }).trim();
  } catch {
    return;
  }

  if (!dirty) return;

  if (force) {
    console.warn("⚠️  Sözlüklerde kaydedilmemiş değişiklik var — --force ile devam.");
    return;
  }

  throw new Error(
    `Kaydedilmemiş değişiklik var:\n${dirty}\n` +
      "  Önce commit'leyin ya da geri alın. (--force ile geçilir.)",
  );
}

/**
 * `en.json`u gezip her yaprağı toplar.
 *
 * `onLeaf(value, path, container)` her dize için çağrılıyor; diziler
 * eleman eleman iniyor. Çoğul blokları AĞACIN İÇİNE İNİLMEDEN atlanıyor.
 */
function walk(node, onLeaf, onPlural, trail = []) {
  for (const [key, value] of Object.entries(node)) {
    const trailNext = [...trail, key];

    if (typeof value === "string") {
      onLeaf(value, trailNext);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === "string") onLeaf(item, [...trailNext, index]);
      });
    } else if (isPluralBlock(value) && !forcePlurals) {
      onPlural(value, trailNext);
    } else if (value && typeof value === "object") {
      walk(value, onLeaf, onPlural, trailNext);
    }
  }
}

/* --- Toplanacak metinler ve korunacak çoğullar --- */
const sources = [];
const pluralPaths = [];

walk(
  english,
  (value) => sources.push(value),
  (_value, trail) => pluralPaths.push(trail.join(".")),
);

console.log(`\n📚 ${SOURCE}`);
console.log(`   ${sources.length} çevrilecek dize`);
if (pluralPaths.length > 0) {
  console.log(`   ${pluralPaths.length} çoğul bloğu KORUNUYOR: ${pluralPaths.join(", ")}`);
  console.log("      (gerekçe: betiğin başındaki `isPluralBlock` notu)");
}
console.log();

const cache = await loadCache();
const apiKey = dryRun ? null : requireApiKey();
if (!dryRun) assertCleanWorktree();

/* --- Maliyet önizlemesi --- */
let needed = 0;
const preview = {};

for (const lang of LANGS) {
  const { pendingCount, chars } = await translateTexts(sources, lang.toUpperCase(), {
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
    `   ${lang.toUpperCase()}: ${preview[lang].pendingCount} yeni dize, ` +
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

/* --- Dil dil çevir ve yaz --- */
for (const lang of LANGS) {
  const target = lang.toUpperCase();
  const targetFile = path.join(DICT_DIR, `${lang}.json`);

  console.log(`🌐 ${target} çevriliyor…`);
  const { result } = await translateTexts(sources, target, {
    apiKey,
    cache,
    dryRun: false,
  });
  await saveCache(cache);

  /* Korunacak çoğullar için mevcut dosya okunuyor. */
  const existing = JSON.parse(await readFile(targetFile, "utf8"));
  const pick = (trail) => trail.reduce((node, key) => node?.[key], existing);

  /*
    ÇIKTI `en.json` ŞEKLİNDE KURULUYOR — hedef dosya yalnızca çoğullar için
    okunuyor. Böylece anahtar ağacı kaynakla birebir aynı kalıyor.
  */
  function build(node, trail = []) {
    const out = Array.isArray(node) ? [] : {};

    for (const [key, value] of Object.entries(node)) {
      const trailNext = [...trail, key];

      if (typeof value === "string") {
        out[key] = result.get(value) ?? value;
      } else if (Array.isArray(value)) {
        out[key] = value.map((item) =>
          typeof item === "string" ? (result.get(item) ?? item) : item,
        );
      } else if (isPluralBlock(value) && !forcePlurals) {
        /* Mevcut çeviri korunuyor; hiç yoksa İngilizceye düşülüyor. */
        const kept = pick(trailNext);
        out[key] = kept && typeof kept === "object" ? kept : value;
      } else if (value && typeof value === "object") {
        out[key] = build(value, trailNext);
      } else {
        out[key] = value;
      }
    }

    return out;
  }

  const translated = build(english);
  await writeFile(targetFile, JSON.stringify(translated, null, 2) + "\n", "utf8");
  console.log(`   💾 ${targetFile}\n`);
}

console.log("Kontrol:");
console.log("   npx tsc --noEmit          # anahtar ağacı hâlâ en.json ile aynı mı");
console.log("   git diff --stat lib/i18n/dictionaries/\n");
