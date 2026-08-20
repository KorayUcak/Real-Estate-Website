/**
 * DİL KATMANI.
 *
 * Bu modül dil seçiminin tek doğruluk kaynağı ve para birimiyle olan
 * eşleşmenin tarifi. Seçimin ÇEVİRİYE dönüştüğü yer `lib/i18n/` —
 * sözlükler ve arama oradadır; buradaki `tag` alanı ikisi arasındaki bağ.
 *
 * DURUM: arayüz (gezinme, formlar, footer, iletişim sayfası) üç dilde;
 * sayfaların uzun metinleri henüz İngilizce. Rota bazlı i18n (/tr, /ru)
 * açılmadı — gerekçesi ve bedeli lib/i18n/index.ts başında yazıyor.
 *
 * ⚠️ `document.documentElement.lang` HÂLÂ DEĞİŞTİRİLMİYOR, ama artık farklı
 * bir sebeple. Eskiden hiçbir şey çevrilmediği içindi; şimdi çeviri KISMÎ
 * olduğu için: belge kökünü "tr" yapmak, altındaki İngilizce paragrafları
 * da Türkçe ilan etmek olurdu. Bunun yerine `lang`, dilin gerçekten
 * değiştiği düğümlerde duruyor (başlık, footer, form) — bkz.
 * components/translation.tsx `TranslatedRegion`. Sayfa metinleri de
 * çevrildiği gün işaret köke taşınır ve o sarmalayıcılar kalkar.
 */

import type { CurrencyCode } from "@/lib/currency";

export const LANGUAGES = ["EN", "TR", "RU"] as const;
export type LanguageCode = (typeof LANGUAGES)[number];

export type LanguageMeta = {
  code: LanguageCode;
  /** Açılır listede görünen ad — DİLİN KENDİSİNDE yazılır. Bir Rus
   *  kullanıcı "Russian" değil "Русский" arar; bu, dil seçicilerinde
   *  yerleşik ve tartışmasız olan tek kural. */
  label: string;
  /** BCP 47 etiketi — çevrilmiş bölgelerin `lang` niteliği bunu basar. */
  tag: string;
  /**
   * Dil seçilince ONUN yerine geçen para birimi. Eşleştirme, kullanıcıya
   * "senin paranı biliyorum" demenin en ucuz yolu; ama BAĞLAYICI DEĞİL —
   * bkz. locale-provider, kullanıcı bunu her zaman ezebilir.
   */
  currency: CurrencyCode;
};

export const LANGUAGE_META: Record<LanguageCode, LanguageMeta> = {
  EN: { code: "EN", label: "English", tag: "en", currency: "GBP" },
  TR: { code: "TR", label: "Türkçe", tag: "tr", currency: "TRY" },
  RU: { code: "RU", label: "Русский", tag: "ru", currency: "RUB" },
};

export const DEFAULT_LANGUAGE: LanguageCode = "EN";
export const DEFAULT_CURRENCY: CurrencyCode =
  LANGUAGE_META[DEFAULT_LANGUAGE].currency;

export function isLanguage(value: unknown): value is LanguageCode {
  return LANGUAGES.includes(value as LanguageCode);
}

/**
 * DİL + PARA BİRİMİ ÇİFTLERİ — başlıktaki TEK seçicinin kaynağı.
 *
 * Başlık eskiden iki ayrı açılır menü taşıyordu (dil, para birimi) ve
 * 3 × 4 = 12 kombinasyon üretiyordu. Bunların çoğu anlamsızdı: "Русский +
 * GBP" kimsenin bilinçli seçtiği bir şey değil, yanlışlıkla düşülen bir
 * durumdu. Liste, gerçekten hedeflenen dört kitleye indirildi — İngiliz
 * alıcı, avro bölgesindeki İngilizce konuşan alıcı (HİBRİT seçenek: dil EN
 * kalır, para birimi EUR olur), Türk alıcı, Rus alıcı.
 *
 * Sıra kasıtlı: taban para birimi (GBP) başta, ardından hacme göre.
 */
export type LocalizationOption = {
  /** Menü anahtarı — durum iki alanda saklandığı için yalnızca React key'i. */
  id: string;
  language: LanguageCode;
  currency: CurrencyCode;
};

export const LOCALIZATION_OPTIONS: readonly LocalizationOption[] = [
  { id: "EN-GBP", language: "EN", currency: "GBP" },
  { id: "EN-EUR", language: "EN", currency: "EUR" },
  { id: "TR-TRY", language: "TR", currency: "TRY" },
  { id: "RU-RUB", language: "RU", currency: "RUB" },
];

/**
 * Kayıtlı durumu listedeki bir seçeneğe oturtur.
 *
 * ⚠️ NEDEN GEREKLİ: iki menüli sürümden kalma localStorage değerleri hâlâ
 * sahada — birisi "TR + GBP" seçmiş olabilir; bu çift artık listede yok.
 * Tam eşleşme yoksa DİLE göre düşülür (dil kimliğin daha görünür yarısı),
 * o da tutmazsa ilk seçeneğe. Böylece tetikleyicide asla boş etiket ya da
 * hiçbir satırın işaretli olmadığı bir panel görünmez.
 */
export function matchLocalization(
  language: LanguageCode,
  currency: CurrencyCode,
): LocalizationOption {
  return (
    LOCALIZATION_OPTIONS.find(
      (option) => option.language === language && option.currency === currency,
    ) ??
    LOCALIZATION_OPTIONS.find((option) => option.language === language) ??
    LOCALIZATION_OPTIONS[0]
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ROTA YERELLEŞTİRMESİ — /tr, /ru ve öneksiz İngilizce.
   ═══════════════════════════════════════════════════════════════════════

   NEDEN İNGİLİZCE ÖNEKSİZ. Üç seçenek vardı:

     /en /tr /ru   → hepsi önekli. En basit kurulum ama birincil pazarın
                     (Birleşik Krallık) adresini bir segment derinleştirir
                     ve sitemap, canonical, OG url, schema `@id` alanlarının
                     TAMAMINI değiştirirdi.
     /  /tr /ru    → seçilen. İngilizce kök dizinde kalır; Türkçe ve Rusça
                     önek alır. `x-default` doğal olarak köke işaret eder.
     alan adı bazlı → .co.uk/.com.tr ayrı alan adları. Ayrı sertifika, ayrı
                     Search Console mülkü, ayrı otorite. Bu ölçekte gereksiz.

   Öneksiz varsayılan, `proxy.ts` içinde bir REWRITE ile çalışıyor:
   `/properties` isteği içeride `/en/properties`e yazılır, adres çubuğunda
   `/properties` kalır. Dosya sisteminde her rota `app/[lang]/` altında
   tektir — İngilizce için ayrı bir kopya YOK.
*/

/** URL segmenti olarak kullanılan küçük harfli kodlar. */
export const ROUTE_LOCALES = ["en", "tr", "ru"] as const;
export type RouteLocale = (typeof ROUTE_LOCALES)[number];

/** Kökte oturan dil — URL'de önek almaz. */
export const DEFAULT_ROUTE_LOCALE: RouteLocale = "en";

export function isRouteLocale(value: unknown): value is RouteLocale {
  return ROUTE_LOCALES.includes(value as RouteLocale);
}

const LANGUAGE_BY_ROUTE: Record<RouteLocale, LanguageCode> = {
  en: "EN",
  tr: "TR",
  ru: "RU",
};

const ROUTE_BY_LANGUAGE: Record<LanguageCode, RouteLocale> = {
  EN: "en",
  TR: "tr",
  RU: "ru",
};

export function languageFromRoute(locale: RouteLocale): LanguageCode {
  return LANGUAGE_BY_ROUTE[locale];
}

export function routeFromLanguage(language: LanguageCode): RouteLocale {
  return ROUTE_BY_LANGUAGE[language];
}

/**
 * Kök göreli bir yolu hedef dilin adresine çevirir.
 *
 * `path` DAİMA öneksiz (kanonik) biçimde verilir: "/", "/properties",
 * "/properties/villa-x". Dönen değer İngilizce için aynı yol, diğer
 * dillerde önekli hâli.
 *
 * Tek yerde durması şart: bu dönüşüm gezinme bağlantılarında, dil
 * seçicisinde, hreflang etiketlerinde, sitemap'te ve canonical'da ayrı ayrı
 * geçiyor. Beş yere elle yazılmış bir "/" birleştirme mantığı, er ya da geç
 * "//tr/properties" üreten bir yerde ayrışır.
 */
export function localizedPath(path: string, locale: RouteLocale): string {
  const clean = path === "/" ? "" : path.replace(/\/$/, "");

  if (locale === DEFAULT_ROUTE_LOCALE) return clean || "/";

  return `/${locale}${clean}`;
}

/**
 * Bir URL yolundan dil önekini SÖKER — kanonik (öneksiz) yolu döndürür.
 *
 * Dil seçicisi bunu kullanıyor: kullanıcı /tr/properties sayfasındayken
 * Rusça'ya geçtiğinde /ru/properties'e gitmeli, /ru/tr/properties'e değil.
 */
export function stripLocale(pathname: string): string {
  const match = pathname.match(/^\/([a-z]{2})(?=\/|$)/);

  if (match && isRouteLocale(match[1]) && match[1] !== DEFAULT_ROUTE_LOCALE) {
    return pathname.slice(match[0].length) || "/";
  }

  return pathname || "/";
}
