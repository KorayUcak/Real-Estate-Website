#!/usr/bin/env node
/**
 * Convert legacy gallery images to WebP and delete the heavy originals.
 *
 * Two modes:
 *   (default)  .bmp only — the 14 uncompressed bitmaps the WordPress export
 *              carried, which next/image cannot optimise at all.
 *   --all      every raster image (.bmp .jpg .jpeg .png) -> .webp
 *
 * WHY BMP IS NOT JUST `sharp(file).webp()`:
 * sharp cannot read BMP. It is not in libvips' built-in loader set and the
 * prebuilt binaries ship without the ImageMagick delegate, so `sharp(bmp)`
 * throws "Input file contains unsupported image format". macOS `sips` also
 * refuses these particular files even though `file` reports them as valid
 * 24-bit Windows bitmaps. So BMP pixels are decoded in pure JS with `bmp-js`
 * and handed to sharp as a raw buffer — which also keeps this working on
 * Linux/CI, where a `sips` fallback would not exist.
 *
 * Usage:
 *   node scripts/convert-images.js --all
 *   node scripts/convert-images.js --all --dry-run
 *   node scripts/convert-images.js --all --quality 80 --max-width 2560
 *   node scripts/convert-images.js --all --keep        # do not delete originals
 */

const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const bmp = require("bmp-js");
const sharp = require("sharp");

const args = process.argv.slice(2);
const has = (n) => args.includes(`--${n}`);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i !== -1 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : d;
};

const ROOT = path.resolve(process.cwd(), flag("dir", "public/images/properties"));
const QUALITY = Number(flag("quality", 80));
/**
 * Cap on the stored master. These files top out at 2560px because WordPress
 * already resized them, so this is a no-op today — it is here so a future
 * import of straight-from-phone 4000px photos cannot quietly bloat the repo.
 * `--max-width 0` disables resizing entirely.
 */
const MAX_WIDTH = Number(flag("max-width", 2560));
const CONCURRENCY = Math.max(1, Number(flag("concurrency", 8)));
const ALL = has("all");
const DRY_RUN = has("dry-run");
const KEEP = has("keep");
const FORCE = has("force");

const EXTENSIONS = ALL
  ? /\.(bmp|jpe?g|png)$/i
  : /\.bmp$/i;

const mb = (bytes) => (bytes / 1048576).toFixed(1);

async function walk(dir, found = []) {
  let entries;
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, found);
    else if (EXTENSIONS.test(entry.name)) found.push(full);
  }
  return found;
}

/**
 * bmp-js returns 4 bytes per pixel in ABGR order; sharp's raw input wants
 * contiguous RGB. Alpha is dropped — these are 24-bit photographs, so it is
 * always 0xFF and would only inflate the buffer.
 */
function bmpToRaw(buffer) {
  const decoded = bmp.decode(buffer);
  const { data, width, height } = decoded;
  const rgb = Buffer.allocUnsafe(width * height * 3);
  for (let i = 0, j = 0; i < data.length; i += 4) {
    rgb[j++] = data[i + 3];
    rgb[j++] = data[i + 2];
    rgb[j++] = data[i + 1];
  }
  return { rgb, width, height };
}

/** Fixed-size worker pool. */
async function pool(items, limit, worker) {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      await worker(items[index], index);
    }
  });
  await Promise.all(runners);
}

async function convert(file, stats) {
  const target = file.replace(/\.(bmp|jpe?g|png)$/i, ".webp");
  const sourceSize = fs.statSync(file).size;

  if (!FORCE && fs.existsSync(target) && target !== file) {
    stats.skipped++;
    return;
  }

  let pipeline;
  if (/\.bmp$/i.test(file)) {
    const { rgb, width, height } = bmpToRaw(await fsp.readFile(file));
    pipeline = sharp(rgb, { raw: { width, height, channels: 3 } });
  } else {
    // `.rotate()` with no argument applies the EXIF orientation tag before
    // stripping metadata. Without it, any phone photo carrying orientation
    // would be written sideways — silently, and only visible in the browser.
    pipeline = sharp(file).rotate();
  }

  if (MAX_WIDTH > 0) {
    pipeline = pipeline.resize({
      width: MAX_WIDTH,
      withoutEnlargement: true,
      fit: "inside",
    });
  }

  await pipeline.webp({ quality: QUALITY, effort: 5 }).toFile(target);
  const outSize = fs.statSync(target).size;

  /**
   * Re-encoding does not always win — a small, already-optimised JPEG can come
   * out larger as WebP. Keep whichever file is smaller rather than blindly
   * trading quality for bytes.
   */
  if (outSize >= sourceSize && target !== file) {
    await fsp.unlink(target);
    stats.keptOriginal++;
    stats.before += sourceSize;
    stats.after += sourceSize;
    return;
  }

  stats.before += sourceSize;
  stats.after += outSize;
  stats.converted++;

  if (!KEEP && target !== file) await fsp.unlink(file);

  // Guard on lastLogged: several workers can cross the same multiple of 100
  // in the same tick, which printed the identical line three times.
  if (stats.converted % 100 === 0 && stats.converted !== stats.lastLogged) {
    stats.lastLogged = stats.converted;
    console.log(`    …${stats.converted} converted (${mb(stats.before - stats.after)} MB saved so far)`);
  }
}

async function main() {
  const files = await walk(ROOT);
  const relRoot = path.relative(process.cwd(), ROOT);

  if (files.length === 0) {
    console.log(`No matching images under ${relRoot} — nothing to do.`);
    return;
  }

  const totalBefore = files.reduce((sum, f) => sum + fs.statSync(f).size, 0);

  console.log(`\nMode        : ${ALL ? "--all (bmp, jpg, jpeg, png)" : "bmp only"}`);
  console.log(`Directory   : ${relRoot}`);
  console.log(`Files       : ${files.length}  (${mb(totalBefore)} MB)`);
  console.log(`Quality     : ${QUALITY}   Max width: ${MAX_WIDTH || "unlimited"}   Parallel: ${CONCURRENCY}`);
  console.log(`Originals   : ${KEEP ? "kept" : "deleted after conversion"}\n`);

  if (DRY_RUN) {
    const byExt = {};
    for (const f of files) {
      const ext = path.extname(f).toLowerCase();
      byExt[ext] = byExt[ext] ?? { n: 0, bytes: 0 };
      byExt[ext].n++;
      byExt[ext].bytes += fs.statSync(f).size;
    }
    console.log("DRY RUN — nothing written or deleted.\n");
    for (const [ext, v] of Object.entries(byExt).sort((a, b) => b[1].bytes - a[1].bytes)) {
      console.log(`  ${ext.padEnd(6)} ${String(v.n).padStart(5)} files   ${mb(v.bytes).padStart(8)} MB`);
    }
    console.log(`\n  TOTAL  ${String(files.length).padStart(5)} files   ${mb(totalBefore).padStart(8)} MB`);
    return;
  }

  const stats = { converted: 0, skipped: 0, keptOriginal: 0, failed: 0, before: 0, after: 0, lastLogged: 0 };
  const failures = [];

  const started = Date.now();
  await pool(files, CONCURRENCY, async (file) => {
    try {
      await convert(file, stats);
    } catch (error) {
      stats.failed++;
      failures.push(`${path.relative(process.cwd(), file)} — ${error.message}`);
    }
  });
  const seconds = ((Date.now() - started) / 1000).toFixed(1);

  const saved = stats.before - stats.after;
  const remaining = (await walk(path.resolve(process.cwd(), flag("dir", "public/images/properties"))))
    .length;

  console.log("\n────────────────────────────────────────────");
  console.log(`Converted        : ${stats.converted}`);
  console.log(`Skipped (exists) : ${stats.skipped}`);
  console.log(`Kept as original : ${stats.keptOriginal}  (WebP came out larger)`);
  console.log(`Failed           : ${stats.failed}`);
  console.log(`Before           : ${mb(stats.before)} MB`);
  console.log(`After            : ${mb(stats.after)} MB`);
  console.log(`SAVED            : ${mb(saved)} MB  (${((saved / (stats.before || 1)) * 100).toFixed(1)}%)`);
  console.log(`Elapsed          : ${seconds}s`);
  console.log(`Legacy files left: ${remaining}`);
  console.log("────────────────────────────────────────────");

  if (failures.length) {
    console.log("\nFailures:");
    failures.slice(0, 20).forEach((f) => console.log(`  [✗] ${f}`));
    if (failures.length > 20) console.log(`  …and ${failures.length - 20} more`);
  }

  console.log("\nNext: node scripts/adapt-villas.js   (re-points the JSON at the .webp files)\n");
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
