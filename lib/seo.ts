import type { Metadata } from "next";
import {
  DEFAULT_ROUTE_LOCALE,
  LANGUAGE_META,
  languageFromRoute,
  localizedPath,
  ROUTE_LOCALES,
  type RouteLocale,
} from "@/lib/locale";
import { siteConfig } from "@/lib/site";

/**
 * Her sayfada 40 satır metadata tekrarlamak yerine tek bir üretici.
 * Tutarlılık burada SEO'nun kendisidir: canonical, og:url ve twitter alanları
 * aynı `path` değerinden türediği için birbirinden sapması mümkün değil.
 *
 * `title` marka adı OLMADAN verilir — kök layout'taki
 * "%s | Coast 2 Coast Properties Turkey" şablonu markayı zaten ekler.
 * OG/Twitter başlıkları ise şablondan geçmez, o yüzden markayı elle ekliyoruz.
 */

export type SeoImage = {
  url: string;
  alt: string;
  width?: number;
  height?: number;
};

type SeoInput = {
  /** Markasız sayfa başlığı. SERP'te kırpılmaması için ~60 karakteri aşmayın. */
  title: string;
  /** 150–160 karakter arası ideal; bir fayda + bir eylem çağrısı içersin. */
  description: string;
  /** Kök göreli yol: "/properties", "/properties/villa-x". Sonda / yok. */
  path: string;
  keywords?: string[];
  images?: SeoImage[];
  type?: "website" | "article";
  /** article tipinde yayın/güncelleme tarihleri (ISO). */
  publishedTime?: string;
  modifiedTime?: string;
  /** Teşekkür/başarı sayfaları gibi indekslenmemesi gereken rotalar için. */
  noIndex?: boolean;
  /**
   * Sayfanın dili. Verilmezse İngilizce varsayılır.
   *
   * Sayfalar bunu `lang()` (next/root-params) ile okuyup geçiriyor;
   * canonical, hreflang ve og:locale üçü birden buradan türüyor.
   */
  locale?: RouteLocale;
};

/**
 * HREFLANG KÜMESİ — her sayfa için üç dil + x-default.
 *
 * Google'ın kuralı KARŞILIKLILIK: /tr/properties Türkçe sürümü olarak
 * kendini de listelemeli, yoksa küme geçersiz sayılır ve tamamı yok
 * sayılır. Bu yüzden liste her dilde AYNI — sayfanın hangi dilde olduğuna
 * bakılmaksızın üçü de yazılır.
 *
 * `x-default`: hangi dil de uymuyorsa oraya gitsin. Kök (İngilizce)
 * doğru hedef — site birincil olarak Birleşik Krallık pazarına bakıyor.
 */
/** og:locale Facebook biçimi — hreflang etiketinden AYRI bir sözleşme. */
const OG_LOCALES: Record<RouteLocale, string> = {
  en: "en_GB",
  tr: "tr_TR",
  ru: "ru_RU",
};

function alternateLanguages(path: string): Record<string, string> {
  const languages: Record<string, string> = {};

  for (const locale of ROUTE_LOCALES) {
    const tag = LANGUAGE_META[languageFromRoute(locale)].tag;
    languages[tag] = localizedPath(path, locale);
  }

  /* İngilizce girdisi bölgeli etiketle de veriliyor: site en-GB yazıyor
     ve Birleşik Krallık'taki arayana bu daha kesin bir eşleşme. */
  languages["en-GB"] = localizedPath(path, DEFAULT_ROUTE_LOCALE);
  languages["x-default"] = localizedPath(path, DEFAULT_ROUTE_LOCALE);

  return languages;
}

/**
 * Sayfaya özel görsel yoksa devreye giren marka görseli.
 *
 * Gerekli, çünkü: `app/opengraph-image.tsx` dosya konvansiyonu YALNIZCA kök
 * rotaya (/) uygulanır, alt sayfalara miras kalmaz. Üstelik bir alt sayfa
 * kendi `openGraph` nesnesini tanımladığında bu alan üst segmentinkiyle
 * derin birleştirilmez, tamamen değiştirilir. Bu iki davranış birleşince
 * görsel belirtmeyen her sayfa og:image'siz kalır ve WhatsApp/X paylaşımları
 * çıplak link görünür. Aşağıdaki varsayılan tam olarak bunu engeller.
 */
const DEFAULT_OG_IMAGE: SeoImage = {
  url: "/opengraph-image",
  alt: `${siteConfig.name} — luxury villas for sale in Fethiye, Ölüdeniz and Göcek`,
  width: 1200,
  height: 630,
};

export function pageMetadata({
  title,
  description,
  path,
  keywords,
  images,
  type = "website",
  publishedTime,
  modifiedTime,
  noIndex = false,
  locale = DEFAULT_ROUTE_LOCALE,
}: SeoInput): Metadata {
  /* Kanonik, sayfanın KENDİ dilindeki adresi — İngilizce'ye işaret ETMEZ.
     Aksi hâlde Türkçe sayfa "asıl sürüm İngilizce" demiş olur ve dizinden
     kendi kendini düşürür. */
  const canonical = localizedPath(path, locale);
  const socialTitle = `${title} | ${siteConfig.name}`;

  /**
   * Göreli yollar kullanıyoruz: kök layout'taki `metadataBase` bunları
   * mutlak URL'e çevirir. Böylece alan adı değiştiğinde tek bir sabit yeter.
   */
  const openGraphImages = (images?.length ? images : [DEFAULT_OG_IMAGE]).map(
    (image) => ({
      url: image.url,
      alt: image.alt,
      ...(image.width ? { width: image.width } : {}),
      ...(image.height ? { height: image.height } : {}),
    }),
  );

  return {
    title,
    description,
    ...(keywords?.length ? { keywords } : {}),

    alternates: {
      canonical,
      languages: alternateLanguages(path),
    },

    openGraph: {
      type,
      url: canonical,
      siteName: siteConfig.name,
      /* og:locale alt çizgili biçim ister (en_GB, tr_TR) — BCP 47 değil. */
      locale: OG_LOCALES[locale],
      title: socialTitle,
      description,
      images: openGraphImages,
      ...(type === "article" && publishedTime ? { publishedTime } : {}),
      ...(type === "article" && modifiedTime ? { modifiedTime } : {}),
    },

    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: openGraphImages,
    },

    /**
     * Varsayılan robots kök layout'ta zaten "index, follow".
     * Burada yalnızca istisnayı yazıyoruz — gereksiz tekrar, ileride
     * kök ayar değiştiğinde sessizce çelişen bir kaynak yaratırdı.
     */
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

/** Breadcrumb UI'ı ile BreadcrumbList schema'sını aynı diziden besleriz. */
export type Crumb = { name: string; path: string };

export const HOME_CRUMB: Crumb = { name: "Home", path: "/" };
