/**
 * DİL KATMANI.
 *
 * Şu an yalnızca ARAYÜZ DURUMU tutuyor: kopya henüz çevrilmedi, rota bazlı
 * i18n (/tr, /ru) da açılmadı. Bu modülün işi o faz gelene kadar dil
 * seçiminin tek doğruluk kaynağı olmak ve para birimiyle olan eşleşmeyi
 * tarif etmek.
 *
 * ⚠️ BİLİNÇLİ OLARAK YAPILMAYAN ŞEY: `document.documentElement.lang`
 * değiştirilmiyor. Metin hâlâ İngilizceyken `lang="ru"` yazmak ekran
 * okuyucuya İngilizce cümleleri Rusça telaffuz kurallarıyla okutur ve
 * Google'a yanlış dil sinyali verir — yani sessiz bir erişilebilirlik
 * hatası. `lang` ancak kopya gerçekten çevrildiğinde değişmeli.
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
  /** BCP 47 etiketi — çeviri fazında `lang` ve hreflang için hazır duruyor. */
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
