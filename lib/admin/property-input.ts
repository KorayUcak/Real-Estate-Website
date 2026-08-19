import "server-only";

import { safeSlugSegment } from "@/lib/admin/json-store";
import type { Villa, VillaImage, VillaStatus } from "@/lib/types";

/**
 * İLAN FORMUNUN SUNUCU TARAFI SÖZLEŞMESİ.
 *
 * POST (yeni) ve PATCH (düzenle) uç noktalarının İKİSİ de buradan geçer:
 * doğrulama iki yerde kopyalanırsa er ya da geç yalnız birinde düzeltilen
 * bir kural doğar ve düzenleme, oluşturmanın reddettiği veriyi kabul eder.
 *
 * Temel kural: istemciden gelen hiçbir alana güvenilmez. Formu atlayıp
 * doğrudan `fetch` atan biri her alana her şeyi yazabilir.
 */

export const PROPERTY_TYPES = [
  "Detached villa",
  "Apartment",
  "Townhouse",
  "Land",
] as const;

export const PROPERTY_STATUSES: VillaStatus[] = [
  "for-sale",
  "reserved",
  "sold",
  "off-market",
];

export type PropertyInput = {
  title: string;
  headline: string;
  propertyType: string;
  areaSlug: string;
  status: VillaStatus;
  featured: boolean;
  priceGbp: number;
  bedrooms: number;
  bathrooms: number;
  buildSizeSqm: number;
  plotSizeSqm: number;
  slug: string;
  description: string[];
  features: string[];
  images: VillaImage[];
  seoTitle: string;
  seoDescription: string;
  /** Dahili ilan kodu. Boş bırakılırsa bölge + id'den türetilir. */
  reference: string;
  /** Tapu durumu — serbest metin değil, beyaz listeden (bkz. DEED_STATUSES). */
  deedStatus: string;
  /**
   * Koordinatlar. `null` = "yönetici girmedi" — 0 ile karıştırılmamalı,
   * çünkü 0,0 geçerli bir koordinattır (Gine Körfezi) ve onu "boş" saymak
   * gerçek bir değeri sessizce atmak olurdu.
   */
  latitude: number | null;
  longitude: number | null;
};

/**
 * Tapu durumu seçenekleri. Serbest metin yerine liste: bu alan ilan
 * sayfasında ve Product schema'sında `additionalProperty` olarak
 * yayınlanıyor, dolayısıyla "Freehold" / "freehold" / "Free hold"
 * varyantları veriyi kirletir ve filtrelenemez hâle getirir.
 */
export const DEED_STATUSES = [
  "",
  "Freehold (TAPU)",
  "Leasehold",
  "Condominium (Kat Mülkiyeti)",
  "Construction servitude (Kat İrtifakı)",
  "Shared title (Hisseli)",
] as const;

export type FieldErrors = Partial<Record<keyof PropertyInput, string>>;

function asString(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * Sayısal alanlar. Negatif bir fiyat ya da NaN bir oda sayısı JSON'a
 * girerse sıralama, filtreleme ve schema.org çıktısı hep birden bozulur.
 * `0` geçerli bir değer: "bilinmiyor" anlamında kullanılıyor (bkz.
 * villaSummaryLine, sıfır olan ölçüleri satırdan düşürüyor).
 */
function asNonNegativeInt(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
}

/**
 * Koordinat ayrıştırma.
 *
 * Boş dize `null` döner ("girilmedi"), geçersiz/aralık dışı değer de `null`.
 * Aralık kontrolü şart: enlem ±90, boylam ±180 dışında bir değer Google
 * Maps embed'inde sessizce dünyanın başka bir yerini gösterir ya da hiç
 * yüklenmez — ikisi de ilan sayfasında yanlış beyan demek.
 */
function asCoordinate(value: unknown, limit: number): number | null {
  if (value === null || value === undefined || value === "") return null;

  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || Math.abs(parsed) > limit) return null;

  return parsed;
}

function asStringArray(value: unknown, max: number, maxLen = 400): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, maxLen))
    .filter(Boolean)
    .slice(0, max);
}

/**
 * Görsel kayıtları. Bunlar upload uç noktasından dönüyor ama form onları
 * istemcide tutup geri gönderiyor — yani yine DOĞRULANMALARI gerekiyor.
 *
 * `src` kontrolü kritik: rastgele bir dize kabul edilseydi yönetici
 * arayüzü üzerinden sayfaya harici (ya da `javascript:`) bir kaynak
 * enjekte edilebilirdi. Yalnızca kendi görsel kökümüzden gelen yollar
 * geçerli sayılıyor.
 */
function asImages(value: unknown): VillaImage[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object",
    )
    .map((item) => ({
      src: asString(item.src, 300),
      alt: asString(item.alt, 200),
      width: asNonNegativeInt(item.width),
      height: asNonNegativeInt(item.height),
    }))
    .filter(
      (image) =>
        image.src.startsWith("/images/properties/") &&
        !image.src.includes("..") &&
        image.width > 0 &&
        image.height > 0,
    )
    .slice(0, 60);
}

export function parsePropertyInput(body: unknown): {
  input: PropertyInput;
  errors: FieldErrors;
} {
  const raw = (body ?? {}) as Record<string, unknown>;

  const title = asString(raw.title, 160);
  const priceGbp = asNonNegativeInt(raw.priceGbp);
  const areaSlug = safeSlugSegment(asString(raw.areaSlug, 80));

  const propertyTypeRaw = asString(raw.propertyType, 80);
  const statusRaw = asString(raw.status, 20) as VillaStatus;

  const input: PropertyInput = {
    title,
    headline: asString(raw.headline, 220),
    /* Beyaz liste: listede yoksa varsayılana düş, serbest metin kabul etme —
       aksi hâlde /properties filtresi zamanla çöp değerlerle dolar. */
    propertyType: (PROPERTY_TYPES as readonly string[]).includes(propertyTypeRaw)
      ? propertyTypeRaw
      : PROPERTY_TYPES[0],
    areaSlug,
    status: PROPERTY_STATUSES.includes(statusRaw) ? statusRaw : "for-sale",
    featured: raw.featured === true,
    priceGbp,
    bedrooms: asNonNegativeInt(raw.bedrooms),
    bathrooms: asNonNegativeInt(raw.bathrooms),
    buildSizeSqm: asNonNegativeInt(raw.buildSizeSqm),
    plotSizeSqm: asNonNegativeInt(raw.plotSizeSqm),
    slug: safeSlugSegment(asString(raw.slug, 120) || title),
    description: asStringArray(raw.description, 60, 4000),
    features: asStringArray(raw.features, 40, 80),
    images: asImages(raw.images),
    seoTitle: asString(raw.seoTitle, 70),
    seoDescription: asString(raw.seoDescription, 180),
    reference: asString(raw.reference, 40),
    deedStatus: (DEED_STATUSES as readonly string[]).includes(
      asString(raw.deedStatus, 60),
    )
      ? asString(raw.deedStatus, 60)
      : "",
    latitude: asCoordinate(raw.latitude, 90),
    longitude: asCoordinate(raw.longitude, 180),
  };

  const errors: FieldErrors = {};
  if (!input.title) errors.title = "Title is required.";
  if (input.priceGbp <= 0) errors.priceGbp = "Price must be greater than zero.";
  if (!input.areaSlug) errors.areaSlug = "Area is required.";
  if (!input.slug) errors.slug = "Slug could not be derived from the title.";

  /*
    Koordinatlar İKİSİ BİRDEN verilmeli. Yalnız birini kaydetmek, haritayı
    ekvatorun ya da Greenwich'in üstünde bir noktaya çakar — sessizce yanlış
    bir konum göstermektense hiç göstermemek doğru.

    Ham girdiye bakıyoruz, ayrıştırılmış değere değil: "abc" gibi geçersiz
    bir değer de `null` döner ve yönetici bunu "boş bıraktım" sanmamalı.
  */
  const latRaw = asString(raw.latitude, 40) || (raw.latitude ?? "");
  const lngRaw = asString(raw.longitude, 40) || (raw.longitude ?? "");
  const latFilled = String(latRaw).trim() !== "";
  const lngFilled = String(lngRaw).trim() !== "";

  if (latFilled && input.latitude === null) {
    errors.latitude = "Latitude must be a number between -90 and 90.";
  }
  if (lngFilled && input.longitude === null) {
    errors.longitude = "Longitude must be a number between -180 and 180.";
  }
  if (latFilled !== lngFilled) {
    const missing = latFilled ? "longitude" : "latitude";
    errors[missing as "latitude" | "longitude"] =
      "Enter both latitude and longitude, or leave both blank.";
  }

  return { input, errors };
}

/** `updatedAt` her kayıtta tazelenir — panelde "son düzenlenen" buna dayanıyor. */
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Doğrulanmış girdiyi mevcut kayda uygular.
 *
 * `base` verilmezse yeni kayıt üretilir. Düzenlemede `base` geçilir ve
 * FORMDA OLMAYAN alanlar (floors, citizenshipEligible, highlights, keywords,
 * publishedAt…) korunur — form onları göstermediği için `undefined`
 * gelirler ve körü körüne yazsaydık her düzenleme veriyi budardı.
 */
export function applyInput(
  input: PropertyInput,
  base?: Villa,
  finalSlug = input.slug,
): Villa {
  const id = base?.id ?? String(Date.now());

  /* İkisi birden dolu olmadan koordinat "verilmiş" sayılmaz — bkz. doğrulama. */
  const hasCoordinates = input.latitude !== null && input.longitude !== null;

  return {
    ...(base ?? {}),
    id,
    slug: finalSlug,
    /* Yönetici elle bir kod yazdıysa o kazanır; yoksa mevcut kod korunur,
       o da yoksa bölge + id'den türetilir. */
    reference:
      input.reference ||
      base?.reference ||
      `C2C-${input.areaSlug.slice(0, 3).toUpperCase()}-${id.slice(-5)}`,
    title: input.title,
    headline: input.headline,
    status: input.status,
    featured: input.featured,
    propertyType: input.propertyType,
    location: {
      ...(base?.location ?? {
        area: "",
        district: "Fethiye",
        city: "Fethiye",
        region: "Muğla",
        country: "Türkiye",
      }),
      areaSlug: input.areaSlug,
      /*
        KOORDİNAT VE PLACEHOLDER BAYRAĞI — birlikte belirleniyor.

        `isPlaceholder`, `safeMapCoordinates`ın okuduğu bayrak: true ise
        harita ilanın pinini DEĞİL bölge merkezini çiziyor. WordPress
        taşımasında 21 ilan Houzez'in varsayılan pini (Miami, Florida) ile
        geldiği için bu koruma var.

        Yönetici gerçek koordinat girdiği anda bayrak düşer ve pin gerçek
        konumu gösterir. Alanlar boşaltılırsa bayrak geri kalkar — yani
        eski (muhtemelen yanlış) koordinat yeniden "gerçek" sayılmaz.
      */
      ...(hasCoordinates
        ? {
            coordinates: { lat: input.latitude!, lng: input.longitude! },
            isPlaceholder: false,
          }
        : {
            coordinates: base?.location.coordinates ?? { lat: 0, lng: 0 },
            isPlaceholder: true,
          }),
    },
    price: { gbp: input.priceGbp, currency: "GBP" },
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    buildSizeSqm: input.buildSizeSqm,
    plotSizeSqm: input.plotSizeSqm,
    floors: base?.floors ?? 0,
    deedStatus: input.deedStatus,
    citizenshipEligible: base?.citizenshipEligible ?? false,
    features: input.features,
    highlights: base?.highlights ?? [],
    description: input.description,
    images: input.images,
    seo: {
      title: input.seoTitle,
      description: input.seoDescription,
      keywords: base?.seo?.keywords ?? [],
    },
    publishedAt: base?.publishedAt ?? today(),
    updatedAt: today(),
  };
}
