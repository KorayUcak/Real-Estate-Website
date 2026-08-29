/**
 * GÖÇ: düz metin ilan alanları → üç dilli kayıt.
 *
 *   title:       "Villa Mavi"    → { en: "Villa Mavi", tr: null, ru: null }
 *   description: ["p1", "p2"]    → { en: ["p1","p2"],  tr: null, ru: null }
 *   whyThisOne:  ["a", "b"]      → { en: ["a","b"],    tr: null, ru: null }
 *
 * ⚠️ FİKİRDEN BAĞIMSIZ OLARAK TEKRAR ÇALIŞTIRILABİLİR (idempotent).
 * Zaten dönüştürülmüş bir alan (`{ en: ... }` biçiminde) OLDUĞU GİBİ
 * bırakılıyor. İkinci kez çalıştırmak `{ en: { en: ... } }` üretmez —
 * bir göç betiğinin sessizce veri bozmasının en klasik yolu budur.
 *
 * ⚠️ ÖNCE YEDEK. Çalışmadan önce zaman damgalı bir kopya yazılıyor; dosya
 * 57 ilanın tek kaynağı ve geri alma yolu olmadan yazmak kabul edilemez.
 *
 * Kullanım:  node scripts/migrate-villas-i18n.mjs [--dry]
 */

import { readFile, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const TARGET = path.join(ROOT, "data", "villas.json");
const DRY = process.argv.includes("--dry");

/** Alan zaten üç dilli mi? */
function isLocalized(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.hasOwn(value, "en")
  );
}

/**
 * `tr`/`ru` NULL olarak yazılıyor, alan hiç yazılmamış olarak DEĞİL.
 *
 * İkisi JSON'da farklı şeyler söylüyor: eksik alan "bu şema bilinmiyor",
 * `null` ise "bu çeviri henüz yapılmadı". İleride DeepL kuyruğu ikincisini
 * arayacak; alanları hiç yazmamak, kuyruğun tarayacağı bir iz bırakmazdı.
 */
function toLocalized(value) {
  return { en: value, tr: null, ru: null };
}

const stats = { records: 0, converted: 0, alreadyDone: 0, skippedMissing: 0 };

/**
 * İÇ İÇE YOL DESTEĞİ — "seo.title" gibi alanlar için.
 *
 * İlk sürümde yalnızca üst düzey alanlar taşınıyordu. İkinci dalgada
 * `seo.title` ve `seo.description` da üç dilli hâle geldi ve bunlar bir
 * alt nesnenin içinde duruyor; `villa["seo.title"]` diye bir alan yok.
 */
function migrateField(villa, path) {
  const trail = path.split(".");
  const leaf = trail.pop();

  let node = villa;
  for (const step of trail) {
    if (node?.[step] === undefined) {
      stats.skippedMissing += 1;
      return;
    }
    node = node[step];
  }

  const value = node[leaf];

  if (value === undefined) {
    // `whyThisOne` opsiyonel — taşımayan kayıt taşımamaya devam etsin.
    stats.skippedMissing += 1;
    return;
  }
  if (isLocalized(value)) {
    stats.alreadyDone += 1;
    return;
  }

  node[leaf] = toLocalized(value);
  stats.converted += 1;
}

const raw = await readFile(TARGET, "utf8");
const villas = JSON.parse(raw);

if (!Array.isArray(villas)) {
  console.error(`[migrate] ${TARGET} bir dizi değil — iptal edildi.`);
  process.exit(1);
}

for (const villa of villas) {
  stats.records += 1;
  migrateField(villa, "title");
  migrateField(villa, "description");
  migrateField(villa, "whyThisOne");
  /* İkinci dalga — bkz. lib/types.ts'teki `features` notu. */
  migrateField(villa, "headline");
  migrateField(villa, "features");
  migrateField(villa, "seo.title");
  migrateField(villa, "seo.description");
}

if (DRY) {
  console.log("[migrate] KURU ÇALIŞMA — dosyaya yazılmadı.");
  console.log(stats);
  process.exit(0);
}

const backup = TARGET.replace(
  /\.json$/,
  `.pre-i18n-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
);
await copyFile(TARGET, backup);

/* Dosya biçimi korunuyor: 2 boşluk girinti + sondaki yeni satır. */
await writeFile(TARGET, JSON.stringify(villas, null, 2) + "\n", "utf8");

console.log(`[migrate] yedek → ${path.basename(backup)}`);
console.log(`[migrate] ${stats.records} kayıt · ${stats.converted} alan dönüştürüldü · ${stats.alreadyDone} zaten dönüşmüş · ${stats.skippedMissing} alan yok`);
