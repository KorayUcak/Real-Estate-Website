#!/usr/bin/env node
/**
 * WordPress (Houzez) CSV -> Next.js JSON migration.
 *
 * Reads the Houzez property export, keeps only published listings, downloads
 * every gallery image into the Next.js public folder, and writes a clean
 * data/properties.json with local image paths.
 *
 * Usage:
 *   node scripts/migrate.js --csv ~/Desktop/Properties-Export-2026-August-11-1602.csv
 *
 * Flags:
 *   --csv <path>         Source CSV                (required)
 *   --out <path>         JSON output               (default data/properties.json)
 *   --public <path>      Next.js public dir        (default public)
 *   --limit <n>          Only process n properties (dry-run friendly)
 *   --max-images <n>     Cap images per property   (default 30, 0 = all)
 *   --concurrency <n>    Parallel downloads        (default 6)
 *   --force              Re-download files that already exist on disk
 */

const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const { parse } = require("csv-parse/sync");

/* ------------------------------------------------------------------ CONFIG */

const args = process.argv.slice(2);
const flag = (name, fallback = null) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] && !args[i + 1].startsWith("--")
    ? args[i + 1]
    : fallback;
};
const has = (name) => args.includes(`--${name}`);

const CSV_PATH = flag("csv");
const OUT_PATH = flag("out", "data/properties.json");
const PUBLIC_DIR = flag("public", "public");
const LIMIT = Number(flag("limit", 0)) || Infinity;
const MAX_IMAGES = Number(flag("max-images", 30));
const CONCURRENCY = Math.max(1, Number(flag("concurrency", 6)));
const FORCE = has("force");

/** Only these rows become live listings. Everything else is history. */
const PUBLISHED_STATUS = "publish";

/**
 * Houzez ships a default map pin when the agent never set one. It resolves to
 * Miami, Florida — nowhere near Fethiye — so coordinates matching it are
 * flagged rather than trusted.
 */
const PLACEHOLDER_COORDS = "25.68654,-80.431345";

const DOWNLOAD_TIMEOUT_MS = 30_000;
const RETRIES = 2;

/* ------------------------------------------------------------------- UTILS */

const log = {
  ok: (m) => console.log(`[✓] ${m}`),
  skip: (m) => console.log(`[–] ${m}`),
  warn: (m) => console.warn(`[!] ${m}`),
  err: (m) => console.error(`[✗] ${m}`),
  info: (m) => console.log(`    ${m}`),
};

/** Named + numeric HTML entities, including the emoji the exporter escaped. */
const NAMED_ENTITIES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  ndash: "–", mdash: "—", hellip: "…", rsquo: "’",
  lsquo: "‘", ldquo: "“", rdquo: "”", pound: "£",
  euro: "€", deg: "°", middot: "·", bull: "•",
  frac12: "½", sup2: "²", copy: "©", reg: "®",
};

function decodeEntities(input) {
  return input
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      safeCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec) => safeCodePoint(Number.parseInt(dec, 10)))
    .replace(/&([a-z][a-z0-9]*);/gi, (m, name) => {
      const key = name.toLowerCase();
      return Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, key)
        ? NAMED_ENTITIES[key]
        : m;
    });
}

function safeCodePoint(code) {
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return "";
  try {
    return String.fromCodePoint(code);
  } catch {
    return "";
  }
}

/**
 * WordPress content -> readable plain text.
 *
 * The export is not clean HTML. Beyond normal markup it carries:
 *   - WP shortcodes:      [vc_row] ... [/vc_row]
 *   - HTML comments:      <!--TgQPHd||[]-->  (Gutenberg + paste artefacts)
 *   - Google Docs paste:  <div data-copy-service-computed-style="..."> nests
 *   - Emoji as entities:  &#x2705; &#x1f3e1;
 * Order matters: strip comments and shortcodes before tags, decode last, so a
 * decoded "&lt;script&gt;" can never re-introduce a live tag.
 */
function htmlToText(html) {
  if (!html) return "";

  let text = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/\[\/?[a-z][^\]]*\]/gi, " ")
    .replace(/<\/(p|div|li|h[1-6]|tr|blockquote)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, " ");

  text = decodeEntities(text);

  return text
    .replace(/ /g, " ")
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** First sentence(s) up to ~limit chars — handy for cards and meta tags. */
function excerpt(text, limit = 180) {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= limit) return flat;
  const cut = flat.slice(0, limit);
  const stop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "));
  return (stop > 80 ? cut.slice(0, stop + 1) : `${cut.trimEnd()}…`).trim();
}

/**
 * Price strings in this export are inconsistent: "575000", "£390000",
 * "£136.000", "0". The dot in "136.000" is a thousands separator, not a
 * decimal point, so it is only stripped when it groups exactly three digits.
 * Returns null for missing/zero so the UI can show "POA" instead of "£0".
 */
function parsePrice(raw) {
  if (!raw) return null;
  let s = String(raw).replace(/[£$€\s ]/g, "");
  s = s.replace(/[.,](?=\d{3}\b)/g, "");
  const n = Number.parseInt(s.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** "180ms", "90ms approx", "279m approx", "245", "" -> 180 | 90 | 279 | 245 | null */
function parseSize(raw) {
  if (!raw) return null;
  const m = String(raw).match(/\d+(?:[.,]\d+)?/);
  if (!m) return null;
  const n = Number.parseFloat(m[0].replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function parseCount(raw) {
  const n = Number.parseInt(String(raw ?? "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

/** "36.6448,29.1258,14" -> { lat, lng, zoom, isPlaceholder } */
function parseLocation(raw) {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  const [lat, lng, zoom] = value.split(",").map((p) => Number.parseFloat(p));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    lat,
    lng,
    zoom: Number.isFinite(zoom) ? zoom : null,
    isPlaceholder: value.startsWith(PLACEHOLDER_COORDS),
  };
}

/** Turkish-aware slug: "Villa Lagün — Ölüdeniz" -> "villa-lagun-oludeniz". */
const TR_MAP = { ç: "c", ğ: "g", ı: "i", İ: "i", ş: "s", ö: "o", ü: "u", Ç: "c", Ğ: "g", Ş: "s", Ö: "o", Ü: "u" };
function slugify(title, id) {
  const base = String(title || "")
    .replace(/[çğıİşöüÇĞŞÖÜ]/g, (c) => TR_MAP[c] ?? c)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base ? `${base}-${id}` : `property-${id}`;
}

/* ---------------------------------------------------------------- DOWNLOAD */

/** Keep the real extension; default to .jpg when the URL has none. */
function extensionFor(url) {
  const ext = path.extname(new URL(url).pathname).toLowerCase();
  return /^\.(jpe?g|png|webp|avif|gif|bmp|heic)$/.test(ext) ? ext : ".jpg";
}

/**
 * Download one image. Returns the public path on success, null on any
 * failure — a dead URL must never abort the migration, and after 4 years of
 * WordPress uploads some of them will be dead.
 */
async function downloadImage(url, destFile) {
  if (!FORCE && fs.existsSync(destFile) && fs.statSync(destFile).size > 0) {
    return "cached";
  }

  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        redirect: "follow",
        headers: { "User-Agent": "c2c-migrate/1.0" },
      });
      if (!res.ok) {
        // 4xx will not fix itself on retry; 5xx might.
        if (res.status < 500) return null;
        throw new Error(`HTTP ${res.status}`);
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length === 0) return null;
      await fsp.writeFile(destFile, buf);
      return "downloaded";
    } catch (error) {
      if (attempt === RETRIES) {
        log.warn(`   image failed (${error.message}): ${url.slice(-60)}`);
        return null;
      }
      await new Promise((r) => setTimeout(r, 500 * attempt));
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

/** Run async tasks with a fixed worker pool, preserving result order. */
async function pool(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

/* -------------------------------------------------------------------- MAIN */

async function main() {
  if (!CSV_PATH) {
    log.err("Missing --csv <path>. See the header of this file for usage.");
    process.exit(1);
  }
  const csvFile = path.resolve(CSV_PATH.replace(/^~/, process.env.HOME ?? "~"));
  if (!fs.existsSync(csvFile)) {
    log.err(`CSV not found: ${csvFile}`);
    process.exit(1);
  }

  // `bom: true` matters: this export starts with U+FEFF, which would otherwise
  // become part of the first column name and break every `row.id` lookup.
  const rows = parse(await fsp.readFile(csvFile), {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: false,
  });

  const published = rows.filter(
    (r) => String(r.Status ?? "").trim() === PUBLISHED_STATUS,
  );
  const skipped = rows.length - published.length;

  console.log(`\nParsed ${rows.length} rows — ${published.length} published, ${skipped} skipped.`);
  console.log(`Images capped at ${MAX_IMAGES || "all"} per property, ${CONCURRENCY} parallel downloads.\n`);

  const targets = published.slice(0, LIMIT === Infinity ? undefined : LIMIT);
  const properties = [];
  const stats = { downloaded: 0, cached: 0, failed: 0, placeholders: 0 };

  for (const [index, row] of targets.entries()) {
    const id = String(row.id ?? "").trim();
    const title = String(row.Title ?? "").trim();
    const position = `${index + 1}/${targets.length}`;

    if (!id) {
      log.warn(`${position} row without an id — skipped`);
      continue;
    }

    const description = htmlToText(row.Content);
    const urls = String(row.URL ?? "")
      .split("|")
      .map((u) => u.trim())
      .filter((u) => /^https?:\/\//i.test(u));

    // Same file uploaded twice keeps the same URL; dedupe before numbering so
    // the on-disk sequence has no gaps.
    const unique = [...new Set(urls)];
    const selected = MAX_IMAGES > 0 ? unique.slice(0, MAX_IMAGES) : unique;

    const dirRel = path.join("images", "properties", `property-${id}`);
    // `resolve`, not `join`: an absolute --public must replace the cwd, not be
    // appended to it (which silently created ./private/tmp/... on the way here).
    const dirAbs = path.join(path.resolve(process.cwd(), PUBLIC_DIR), dirRel);
    await fsp.mkdir(dirAbs, { recursive: true });

    const downloaded = await pool(selected, CONCURRENCY, async (url, i) => {
      const file = `${i + 1}${extensionFor(url)}`;
      const outcome = await downloadImage(url, path.join(dirAbs, file));
      if (outcome === null) {
        stats.failed++;
        return null;
      }
      stats[outcome === "cached" ? "cached" : "downloaded"]++;
      return `/${dirRel.split(path.sep).join("/")}/${file}`;
    });

    const images = downloaded.filter(Boolean);
    const location = parseLocation(row.fave_property_location);
    if (location?.isPlaceholder) stats.placeholders++;

    properties.push({
      id,
      slug: slugify(title, id),
      title,
      description,
      excerpt: excerpt(description),
      price: parsePrice(row.fave_property_price),
      currency: "GBP",
      size: parseSize(row.fave_property_size),
      sizeUnit: "m2",
      bedrooms: parseCount(row.fave_property_bedrooms),
      bathrooms: parseCount(row.fave_property_bathrooms),
      location,
      images,
      /** Kept for traceability back to the WordPress source. */
      source: {
        status: row.Status,
        rawPrice: row.fave_property_price ?? "",
        rawSize: row.fave_property_size ?? "",
        totalImagesInExport: unique.length,
      },
    });

    log.ok(
      `${position} Processed Property ${id} — ${title || "(untitled)"} ` +
        `(${images.length}/${selected.length} images)`,
    );
  }

  const outFile = path.resolve(process.cwd(), OUT_PATH);
  await fsp.mkdir(path.dirname(outFile), { recursive: true });
  await fsp.writeFile(outFile, `${JSON.stringify(properties, null, 2)}\n`);

  console.log("\n────────────────────────────────────────────");
  console.log(`Properties written : ${properties.length}  ->  ${OUT_PATH}`);
  console.log(`Images downloaded  : ${stats.downloaded}`);
  console.log(`Images cached      : ${stats.cached}`);
  console.log(`Images failed      : ${stats.failed}`);
  console.log(`Missing prices     : ${properties.filter((p) => p.price === null).length}`);
  console.log(`Missing sizes      : ${properties.filter((p) => p.size === null).length}`);
  console.log(`Placeholder coords : ${stats.placeholders}  (Houzez default pin — not real locations)`);
  console.log("────────────────────────────────────────────\n");
}

main().catch((error) => {
  log.err(error.stack || error.message);
  process.exit(1);
});
