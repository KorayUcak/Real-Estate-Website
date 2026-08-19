#!/usr/bin/env node
/**
 * data/properties.json  ->  data/villas.json
 *
 * Maps the flat migration output onto the rich `Villa` type in lib/types.ts.
 *
 * The CSV export carries roughly a third of the fields `Villa` requires. This
 * script derives what can be derived honestly from the source copy and leaves
 * the rest explicitly blank rather than inventing it. Anything invented about
 * a priced listing — title deed status, citizenship eligibility, year built —
 * is a misdescription risk under UK consumer protection rules, so those
 * default to empty/false and are counted in the summary for manual review.
 *
 * Image paths are resolved against the filesystem, not against properties.json,
 * so this is correct whether or not convert-images.js has already run.
 *
 * Usage:
 *   node scripts/adapt-villas.js
 *   node scripts/adapt-villas.js --csv ~/Desktop/Properties-Export-….csv   # recover real publish dates
 *   node scripts/adapt-villas.js --featured 6
 *   node scripts/adapt-villas.js --dry-run
 */

const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const sharp = require("sharp");

const args = process.argv.slice(2);
const has = (n) => args.includes(`--${n}`);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i !== -1 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : d;
};

const IN_PATH = flag("in", "data/properties.json");
const OUT_PATH = flag("out", "data/villas.json");
const PUBLIC_DIR = flag("public", "public");
const CSV_PATH = flag("csv", null);
const FEATURED_COUNT = Number(flag("featured", 6));
const DRY_RUN = has("dry-run");

/* ------------------------------------------------------------------- AREAS */

/**
 * The slugs below must stay in sync with `serviceAreas` in lib/site.ts —
 * the properties page builds its Location filter from that list, so a villa
 * with a slug outside it is reachable only under "All areas".
 *
 * Centroids let real coordinates decide the area, which beats keyword matching:
 * these descriptions name four or five towns each ("10 minutes to Ölüdeniz,
 * 20 to Fethiye…"), so word-frequency alone picks the wrong one constantly.
 */
const SERVICE_AREAS = [
  { slug: "fethiye-centre", area: "Fethiye Merkez", lat: 36.6213, lng: 29.1164, keywords: ["fethiye centre", "fethiye center", "fethiye town", "city apartment", "fethiye merkez", "akarca", "babataşı", "patlangıç", "patlangic", "fethiye promenade", "promenade of fethiye", "fethiye bay", "fethiye city", "heart of fethiye"] },
  { slug: "oludeniz",       area: "Ölüdeniz",        lat: 36.5501, lng: 29.1173, keywords: ["ölüdeniz", "oludeniz", "blue lagoon", "belcekiz", "belçekiz"] },
  { slug: "hisaronu",       area: "Hisarönü",        lat: 36.5747, lng: 29.1225, keywords: ["hisarönü", "hisaronu"] },
  { slug: "ovacik",         area: "Ovacık",          lat: 36.5836, lng: 29.1447, keywords: ["ovacık", "ovacik"] },
  { slug: "calis",          area: "Çalış",           lat: 36.6486, lng: 29.0921, keywords: ["çalış", "calis", "kargı", "kargi", "koca calis", "koca çalış", "günlükbaşı", "gunlukbasi"] },
  { slug: "uzumlu",         area: "Üzümlü",          lat: 36.7179, lng: 29.2677, keywords: ["üzümlü", "uzumlu", "yeşilüzümlü", "yesiluzumlu"] },
  { slug: "tasyaka",        area: "Taşyaka",         lat: 36.6265, lng: 29.108,  keywords: ["taşyaka", "tasyaka"] },
  { slug: "gocek",          area: "Göcek",           lat: 36.7522, lng: 28.9403, keywords: ["göcek", "gocek"] },
  { slug: "yaniklar",   area: "Yanıklar",       lat: 36.6953, lng: 29.0581, keywords: ["yanıklar", "yaniklar", "oasis"] },
  { slug: "dalaman",    area: "Dalaman",        lat: 36.7573, lng: 28.813,  keywords: ["dalaman", "sarıgerme", "sarigerme"] },
  { slug: "kalkan",     area: "Kalkan",         lat: 36.2656, lng: 29.3981, keywords: ["kalkan", "kalamar"] },
  { slug: "seydikemer", area: "Seydikemer",     lat: 36.6422, lng: 29.3814, keywords: ["seydikemer"] },
  { slug: "bekciler",   area: "Bekçiler",       lat: 36.8992, lng: 29.7073, keywords: ["bekciler", "bekçiler", "beçlicer"] },
];

/**
 * Still NOT in lib/site.ts serviceAreas. Kept separate
 * so the summary can tell you exactly which listings will be invisible to the
 * Location filter until you add the area to lib/site.ts.
 */
const OUTSIDE_AREAS = [
  { slug: "koycegiz",   area: "Köyceğiz",   lat: 36.9705, lng: 28.6889, keywords: ["köyceğiz", "koycegiz"] },
];

/**
 * Manual pins, applied before any heuristic.
 *
 * Koca Çalış sits on the Çalış/Yanıklar boundary: its centroid distance says
 * Yanıklar, the agent's own copy says Çalış. Nobody wins that argument with
 * arithmetic, so the two known cases are pinned by WordPress id. Add to this
 * map rather than loosening the distance rule — the rule is right 36 times
 * out of 57 and every relaxation costs accuracy elsewhere.
 */
const AREA_OVERRIDES = {
  20725: "calis", // "Calis villas" — titled Çalış, sits in Koca Çalış
  24543: "calis", // "Rozavilla"    — copy states Koca Çalış throughout
};

const ALL_AREAS = [...SERVICE_AREAS, ...OUTSIDE_AREAS];
const SERVICE_SLUGS = new Set(SERVICE_AREAS.map((a) => a.slug));

/** Great-circle distance in km. */
function haversine(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Resolve the area in confidence order:
 *   1. real coordinates -> nearest centroid within 12 km   (most reliable)
 *   2. keyword in the title                                (agent named it)
 *   3. keyword in the opening paragraph                    (usually the location line)
 *   4. most-mentioned keyword anywhere                     (last resort)
 */
function resolveArea(property) {
  const pinned = AREA_OVERRIDES[property.id];
  if (pinned) {
    const area = ALL_AREAS.find((a) => a.slug === pinned);
    if (area) return { ...area, confidence: "manual-override" };
  }

  const title = (property.title || "").toLowerCase();
  const description = (property.description || "").toLowerCase();
  const opening = description.slice(0, 400);

  const loc = property.location;
  if (loc && !loc.isPlaceholder && Number.isFinite(loc.lat)) {
    const ranked = ALL_AREAS
      .map((area) => ({ area, km: haversine(loc, area) }))
      .sort((a, b) => a.km - b.km);

    const nearest = ranked[0];
    const nearestService = ranked.find((r) => SERVICE_SLUGS.has(r.area.slug));

    if (nearest && nearest.km <= 12) {
      /*
        Centroids are approximate and the outlying villages overlap the resorts
        — Koca Çalış sits between Çalış and Yanıklar. When a service area is
        within 1.6x the nearest match it wins, because a listing filed outside
        serviceAreas disappears from the Location filter entirely.
      */
      if (
        nearestService &&
        nearestService.km <= 12 &&
        nearestService.km <= nearest.km * 1.6
      ) {
        return { ...nearestService.area, confidence: "coordinates" };
      }
      return { ...nearest.area, confidence: "coordinates" };
    }
  }

  const hit = (haystack) =>
    ALL_AREAS.find((area) => area.keywords.some((k) => haystack.includes(k)));

  const byTitle = hit(title);
  if (byTitle) return { ...byTitle, confidence: "title" };

  const byOpening = hit(opening);
  if (byOpening) return { ...byOpening, confidence: "opening-paragraph" };

  let top = null;
  for (const area of ALL_AREAS) {
    const count = area.keywords.reduce(
      (sum, k) => sum + (description.split(k).length - 1),
      0,
    );
    if (count > 0 && (!top || count > top.count)) top = { area, count };
  }
  if (top) return { ...top.area, confidence: "frequency" };

  /* Every listing in this portfolio is in the Fethiye district; if the copy
     names the town and nothing more specific, the town centre is the honest
     default. Flagged as low confidence so it shows up in the summary. */
  if (description.includes("fethiye")) {
    return { ...SERVICE_AREAS[0], confidence: "town-fallback" };
  }

  return null;
}

/* --------------------------------------------------------------- DERIVERS */

const TR_MAP = { ç: "c", ğ: "g", ı: "i", İ: "i", ş: "s", ö: "o", ü: "u", Ç: "c", Ğ: "g", Ş: "s", Ö: "o", Ü: "u" };

/** Turkish-aware, ASCII-only slug. `İ`/`ı` do not survive toLowerCase alone. */
function slugify(input) {
  return String(input || "")
    .replace(/[çğıİşöüÇĞŞÖÜ]/g, (c) => TR_MAP[c] ?? c)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Unique slug, suffixing the WordPress id only when two titles collide. */
function uniqueSlug(title, id, taken) {
  const base = slugify(title) || `property-${id}`;
  if (!taken.has(base)) {
    taken.add(base);
    return base;
  }
  const withId = `${base}-${id}`;
  taken.add(withId);
  return withId;
}

/** "Villa Kedi" + Çalış -> C2C-CAL-20054 */
function reference(areaSlug, id) {
  const code = (areaSlug || "xxx").replace(/-/g, "").slice(0, 3).toUpperCase();
  return `C2C-${code}-${id}`;
}

const PROPERTY_TYPES = [
  { test: /\b(plot|land|arsa)\b/i, label: "Land" },
  { test: /\b(apartment|apart|duplex flat|penthouse)\b/i, label: "Apartment" },
  { test: /\b(town ?house|semi[- ]detached)\b/i, label: "Townhouse" },
  { test: /\bvilla\b/i, label: "Detached villa" },
];

function propertyType(property) {
  const haystack = `${property.title} ${property.excerpt}`;
  for (const candidate of PROPERTY_TYPES) {
    if (candidate.test.test(haystack)) return candidate.label;
  }
  return /\bapartment\b/i.test(property.description) ? "Apartment" : "Detached villa";
}

/** triplex / duplex / "three floors" -> 3 | 2 | 3. 0 when unstated. */
function floors(text) {
  if (/\btriplex\b|\bthree[- ]floor|\b3 floors?\b|\bover three levels\b/i.test(text)) return 3;
  if (/\bduplex\b|\btwo[- ]stor|\btwo[- ]floor|\b2 floors?\b/i.test(text)) return 2;
  if (/\bbungalow\b|\bone level\b|\bsingle stor/i.test(text)) return 1;
  return 0;
}

/** "on a 450mÂ² plot", "525ms plot", "plot of 625ms" -> 450 | 525 | 625 */
function plotSize(text) {
  const patterns = [
    /(\d{2,5})\s*(?:m2|mÂ²|m²|ms|mtr|metre|meters?)\s*(?:private\s+)?plot/i,
    /plot\s*(?:size\s*)?(?:of\s*)?(?:approx(?:imately)?\s*)?(\d{2,5})\s*(?:m2|mÂ²|m²|ms)?/i,
    /(\d{2,5})\s*(?:m2|mÂ²|m²|ms)\s*of\s*(?:the\s*)?(?:plot|land)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const n = Number.parseInt(match[1], 10);
      if (n >= 50 && n <= 20_000) return n;
    }
  }
  return 0;
}

/** A 4-digit year that is plausible for a build date. */

/** "5 minutes walk to the beach" -> 0.4 km (80 m/min). Returns 0 when unstated. */

/** Feature badges, matched against the agent's own wording. */
const FEATURE_RULES = [
  [/private\s+(?:swimming\s+)?pool/i, "Private pool"],
  [/(?:communal|shared|large communal)\s+(?:swimming\s+)?pool/i, "Communal pool"],
  [/infinity[- ]edge|infinity pool/i, "Infinity pool"],
  [/sea view|views? (?:over|across) the (?:sea|bay)|panoramic sea/i, "Sea view"],
  [/mountain views?/i, "Mountain view"],
  [/fully furnished|comes furnished|turn ?key/i, "Furnished"],
  [/air ?con(?:ditioning)?/i, "Air conditioning"],
  [/under ?floor heating/i, "Underfloor heating"],
  [/central heating/i, "Central heating"],
  [/en[- ]?suite/i, "En-suite bathrooms"],
  [/roof terrace/i, "Roof terrace"],
  [/private garden|landscaped garden/i, "Private garden"],
  [/\bbbq\b|barbecue/i, "Outdoor BBQ"],
  [/(?:private )?parking|car ?port|garage/i, "Parking"],
  [/mosquito nets?/i, "Mosquito nets"],
  [/double glaz/i, "Double glazing"],
  [/solar (?:energy|panel|water)/i, "Solar hot water"],
  [/\bsauna\b/i, "Sauna"],
  [/\bjacuzzi\b/i, "Jacuzzi"],
  [/\blift\b|elevator/i, "Lift"],
  [/\bgym\b/i, "Gym"],
  [/tennis court/i, "Tennis court"],
  [/fire ?place|wood burner|log burner/i, "Fireplace"],
  [/walking distance to the beach|minutes'? walk to the beach/i, "Walk to beach"],
];

function features(text) {
  const found = [];
  for (const [pattern, label] of FEATURE_RULES) {
    if (pattern.test(text) && !found.includes(label)) found.push(label);
  }
  return found.slice(0, 12);
}

/** First real sentence of the body copy, trimmed to a card-friendly length. */
function headline(property) {
  const paragraphs = property.description
    .split("\n")
    .map((p) => p.trim())
    .filter((p) => p.length > 40);

  // Skip the H1 echo of the title and any "price reduced!" shouting.
  const body = paragraphs.find(
    (p) =>
      !/^(?:great|amazing|fantastic|huge|new)?\s*(?:price\s*)?reduc|^reduced|^sold\b/i.test(p) &&
      slugify(p).slice(0, 30) !== slugify(property.title).slice(0, 30),
  );

  const source = body || paragraphs[0] || property.excerpt || property.title;
  const sentence = source.split(/(?<=[.!?])\s/)[0].trim();
  return sentence.length > 190 ? `${sentence.slice(0, 187).trimEnd()}…` : sentence;
}

/** Up to three short selling points, drawn from facts we actually hold. */
function highlights(villa, text) {
  const out = [];
  if (villa.location.area) {
    out.push(`${villa.propertyType} in ${villa.location.area}, ${villa.location.district}`);
  }
  if (villa.bedrooms && villa.bathrooms) {
    out.push(`${villa.bedrooms} bedrooms, ${villa.bathrooms} bathrooms${villa.buildSizeSqm ? ` — ${villa.buildSizeSqm} m² internal` : ""}`);
  }
  const pool = /private\s+(?:swimming\s+)?pool/i.test(text)
    ? "Private swimming pool"
    : /communal|shared/i.test(text)
      ? "Communal swimming pool"
      : null;
  if (pool) out.push(pool);
  else if (villa.features[0]) out.push(villa.features[0]);
  return out.slice(0, 3);
}

/**
 * Descriptive, non-repetitive alt text. Google Images and screen readers both
 * penalise 40 identical "Property photo" strings, so the room type is pulled
 * from the position in the gallery: WordPress galleries are ordered exterior
 * first, and the cover image is always index 0.
 */
function altFor(villa, index, total) {
  const where = villa.location.area
    ? `${villa.location.area}, ${villa.location.district}`
    : villa.location.district;

  if (index === 0) {
    return `${villa.title} — ${villa.propertyType.toLowerCase()} for sale in ${where}`;
  }
  return `${villa.title} in ${where} — photo ${index + 1} of ${total}`;
}

function seoFor(villa) {
  const where = villa.location.area || villa.location.district;
  const price = villa.price.gbp
    ? ` £${villa.price.gbp.toLocaleString("en-GB")}`
    : "";
  const title = `${villa.propertyType} for Sale in ${where} | ${villa.bedrooms} Bed${villa.bedrooms === 1 ? "" : "s"}`;

  return {
    title: title.length > 60 ? `${title.slice(0, 57)}…` : title,
    description:
      `${villa.bedrooms}-bedroom ${villa.propertyType.toLowerCase()} for sale in ${where}, Fethiye.` +
      `${villa.features.includes("Private pool") ? " Private pool." : ""}` +
      `${price ? `${price}.` : ""} Arrange a viewing with Coast 2 Coast Properties Turkey.`,
    keywords: [
      `${where} property for sale`,
      `${villa.propertyType.toLowerCase()} for sale ${where}`,
      `${villa.bedrooms} bedroom ${villa.propertyType.toLowerCase()} Turkey`,
      "Fethiye property for sale",
      "buy property Turkey",
    ],
  };
}

/* ------------------------------------------------------------------ IMAGES */

/**
 * Resolve each JSON image path against the filesystem and read its real
 * dimensions. `Villa.images` requires width/height, and shipping wrong numbers
 * to next/image reintroduces the layout shift the type exists to prevent.
 *
 * A .bmp entry is re-pointed at the .webp produced by convert-images.js. The
 * check is against disk, so this works whether or not that script has run yet.
 */
async function resolveImages(property, publicDir) {
  const resolved = [];

  for (const src of property.images) {
    const candidates = /\.bmp$/i.test(src)
      ? [src.replace(/\.bmp$/i, ".webp"), src]
      : [src, src.replace(/\.[^.]+$/, ".webp")];

    let chosen = null;
    for (const candidate of candidates) {
      const abs = path.join(publicDir, candidate.replace(/^\//, ""));
      if (fs.existsSync(abs)) {
        chosen = { src: candidate, abs };
        break;
      }
    }
    if (!chosen) continue;

    try {
      const meta = await sharp(chosen.abs).metadata();
      if (!meta.width || !meta.height) continue;
      resolved.push({ src: chosen.src, width: meta.width, height: meta.height });
    } catch {
      // Unreadable file: drop it rather than emit an image the UI cannot size.
    }
  }

  return resolved;
}

/* ------------------------------------------------- OPTIONAL DATE RECOVERY */

/**
 * The CSV has no publish date, but WordPress upload URLs embed one
 * (/wp-content/uploads/2023/07/…). The earliest folder across a listing's
 * gallery is a good proxy for when it went live — far better than stamping
 * every villa with today's date and destroying the sitemap's lastmod signal.
 */
async function publishDatesFromCsv(csvPath) {
  const { parse } = require("csv-parse/sync");
  const rows = parse(await fsp.readFile(path.resolve(csvPath.replace(/^~/, process.env.HOME ?? "~"))), {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    relax_column_count: true,
  });

  const dates = new Map();
  for (const row of rows) {
    const stamps = [...String(row.URL ?? "").matchAll(/\/uploads\/(\d{4})\/(\d{2})\//g)]
      .map(([, y, m]) => `${y}-${m}-01`)
      .sort();
    if (stamps.length) {
      dates.set(String(row.id).trim(), { first: stamps[0], last: stamps[stamps.length - 1] });
    }
  }
  return dates;
}

/* -------------------------------------------------------------------- MAIN */

async function main() {
  const inFile = path.resolve(process.cwd(), IN_PATH);
  if (!fs.existsSync(inFile)) {
    console.error(`[✗] ${IN_PATH} not found. Run scripts/migrate.js first.`);
    process.exit(1);
  }

  const properties = JSON.parse(await fsp.readFile(inFile, "utf8"));
  const publicDir = path.resolve(process.cwd(), PUBLIC_DIR);
  const dates = CSV_PATH ? await publishDatesFromCsv(CSV_PATH) : new Map();
  const today = new Date().toISOString().slice(0, 10);

  const taken = new Set();
  const villas = [];
  const report = {
    byConfidence: {},
    unresolvedArea: [],
    outsideServiceAreas: [],
    placeholderCoords: [],
    missingPrice: [],
    missingSize: [],
    noImages: [],
    rewrittenBmp: 0,
    droppedImages: 0,
  };

  for (const property of properties) {
    const text = `${property.title}\n${property.description}`;
    const area = resolveArea(property);

    report.byConfidence[area?.confidence ?? "unresolved"] =
      (report.byConfidence[area?.confidence ?? "unresolved"] ?? 0) + 1;
    if (!area) report.unresolvedArea.push(`${property.id} ${property.title}`);
    else if (!SERVICE_SLUGS.has(area.slug)) {
      report.outsideServiceAreas.push(`${property.id} ${property.title} → ${area.area}`);
    }

    const images = await resolveImages(property, publicDir);
    report.rewrittenBmp += property.images.filter((s) => /\.bmp$/i.test(s)).length;
    report.droppedImages += property.images.length - images.length;
    if (images.length === 0) report.noImages.push(`${property.id} ${property.title}`);

    const areaSlug = area?.slug ?? "";
    const villa = {
      id: property.id,
      slug: uniqueSlug(property.title, property.id, taken),
      reference: reference(areaSlug, property.id),
      title: property.title,
      headline: headline(property),
      status: "for-sale",
      featured: false, // assigned after the loop, once prices are known
      propertyType: propertyType(property),
      location: {
        areaSlug,
        area: area?.area ?? "",
        district: "Fethiye",
        city: "Fethiye",
        region: "Muğla",
        country: "Türkiye",
        coordinates: {
          lat: property.location?.lat ?? 0,
          lng: property.location?.lng ?? 0,
        },
        /**
         * True when the source row carried the Houzez default pin (Miami, FL).
         * The detail page must hide the map entirely when this is set.
         */
        isPlaceholder: Boolean(property.location?.isPlaceholder ?? true),
      },
      price: { gbp: property.price ?? 0, currency: "GBP" },
      bedrooms: property.bedrooms ?? 0,
      bathrooms: property.bathrooms ?? 0,
      buildSizeSqm: property.size ?? 0,
      plotSizeSqm: plotSize(text),
      floors: floors(text),
      /** NOT in the export. Left blank deliberately — see file header. */
      deedStatus: "",
      citizenshipEligible: false,
      features: features(text),
      highlights: [],
      description: property.description
        .split("\n")
        .map((p) => p.trim())
        .filter(Boolean),
      images: [],
      seo: { title: "", description: "", keywords: [] },
      publishedAt: dates.get(property.id)?.first ?? today,
      updatedAt: dates.get(property.id)?.last ?? today,
    };

    villa.highlights = highlights(villa, text);
    villa.images = images.map((image, index) => ({
      src: image.src,
      alt: altFor(villa, index, images.length),
      width: image.width,
      height: image.height,
    }));
    villa.seo = seoFor(villa);

    if (property.location?.isPlaceholder) {
      report.placeholderCoords.push(`${property.id} ${property.title}`);
    }
    if (!property.price) report.missingPrice.push(`${property.id} ${property.title}`);
    if (!property.size) report.missingSize.push(`${property.id} ${property.title}`);

    villas.push(villa);
    console.log(
      `[✓] ${property.id} ${villa.slug}` +
        `  area=${areaSlug || "UNRESOLVED"}(${area?.confidence ?? "-"})` +
        `  imgs=${villa.images.length}`,
    );
  }

  /**
   * `getFeaturedVillas()` filters on `featured` and sorts by price, so with no
   * flags set the homepage grid renders empty. The best-photographed listings
   * are chosen because that grid is image-led — a £1M villa with two blurry
   * photos sells nothing.
   */
  [...villas]
    .sort((a, b) => b.images.length - a.images.length || b.price.gbp - a.price.gbp)
    .slice(0, FEATURED_COUNT)
    .forEach((villa) => {
      villa.featured = true;
    });

  if (!DRY_RUN) {
    const outFile = path.resolve(process.cwd(), OUT_PATH);
    await fsp.mkdir(path.dirname(outFile), { recursive: true });
    await fsp.writeFile(outFile, `${JSON.stringify(villas, null, 2)}\n`);
  }

  const list = (items, max = 6) =>
    items.slice(0, max).map((i) => `      · ${i}`).join("\n") +
    (items.length > max ? `\n      · …and ${items.length - max} more` : "");

  console.log("\n════════════════════════════════════════════");
  console.log(`Villas written      : ${villas.length}${DRY_RUN ? " (DRY RUN — nothing saved)" : ` -> ${OUT_PATH}`}`);
  console.log(`Images attached     : ${villas.reduce((n, v) => n + v.images.length, 0)}`);
  console.log(`Featured flagged    : ${villas.filter((v) => v.featured).length}`);
  console.log(`.bmp -> .webp paths : ${report.rewrittenBmp}`);
  console.log(`Images dropped      : ${report.droppedImages} (not found on disk)`);
  console.log(`\nArea resolution     : ${JSON.stringify(report.byConfidence)}`);
  if (report.unresolvedArea.length) {
    console.log(`\n[!] NO AREA RESOLVED (${report.unresolvedArea.length}) — areaSlug is empty:\n${list(report.unresolvedArea)}`);
  }
  if (report.outsideServiceAreas.length) {
    console.log(`\n[!] OUTSIDE serviceAreas in lib/site.ts (${report.outsideServiceAreas.length}) — invisible to the Location filter until added:\n${list(report.outsideServiceAreas, 10)}`);
  }
  if (report.placeholderCoords.length) {
    console.log(`\n[!] PLACEHOLDER COORDS (${report.placeholderCoords.length}) — location.isPlaceholder = true, hide the map:\n${list(report.placeholderCoords)}`);
  }
  if (report.missingPrice.length) {
    console.log(`\n[!] NO PRICE (${report.missingPrice.length}) — render "POA":\n${list(report.missingPrice)}`);
  }
  if (report.missingSize.length) {
    console.log(`\n[!] NO SIZE (${report.missingSize.length}) — buildSizeSqm = 0:\n${list(report.missingSize)}`);
  }
  if (report.noImages.length) {
    console.log(`\n[!] NO IMAGES (${report.noImages.length}):\n${list(report.noImages)}`);
  }
  console.log(`\n[!] NOT DERIVABLE FROM THE EXPORT — blank on all ${villas.length} listings:`);
  console.log(`      deedStatus ("")            fill before go-live; it is the #1 buyer question`);
  console.log(`      citizenshipEligible (false) a legal claim — verify each against the current threshold`);
  console.log("════════════════════════════════════════════\n");
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
