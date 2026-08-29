import type { LanguageCode } from "@/lib/locale";

/**
 * DİNAMİK İÇERİK YERELLEŞTİRMESİ — ilan metinleri için.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * NEDEN VAR: Arayüz kabuğu (`lib/i18n`) üç dile çevrilmişti ama İLAN
 * içeriği çevrilmiyordu. /tr/properties sayfası Türkçe menü, Türkçe filtre
 * ve İngilizce ilan başlıkları gösteriyordu — yani sayfanın çevrildiğini
 * sanan kullanıcı, asıl okumak istediği metni çeviremiyordu.
 *
 * `lib/i18n` İLE FARKI: orada anahtarlar derleme zamanında bilinir ve
 * eksik anahtar BUILD HATASIDIR (bkz. `Dictionary` tipi). Burada içerik
 * çalışma zamanında yöneticinin girdiği veridir; eksik çeviri normal ve
 * BEKLENEN durumdur. Bu yüzden iki katman ayrı: biri katılık, diğeri
 * hoşgörü ister.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * ⚠️ İNGİLİZCE ZORUNLU, DİĞERLERİ DEĞİL — tipin tamamı bu kararın üstüne
 * kurulu. `en` alanı `T`, `tr`/`ru` ise `T | null | undefined`. Böylece:
 *
 *   · Yedek her zaman VARDIR; sayfa hiçbir dilde boş kalamaz.
 *   · Boş bir çeviri, kayıp bir veri değil BEKLEYEN BİR İŞtir — ileride
 *     DeepL kuyruğu tam olarak bu boşlukları tarayacak (`missingLocales`).
 */

/** JSON'daki dil anahtarları. `LanguageCode` ("EN") küçük harfli karşılığı. */
export type LocaleKey = "en" | "tr" | "ru";

export type Localized<T> = {
  /** ZORUNLU — her kaydın yedeği. */
  en: T;
  /** Opsiyonel: DeepL (ya da yönetici) dolduruncaya kadar boş kalır. */
  tr?: T | null;
  ru?: T | null;
};

const LOCALE_KEY: Record<LanguageCode, LocaleKey> = {
  EN: "en",
  TR: "tr",
  RU: "ru",
};

/** Çevrilebilir alanların taşıyabileceği içerik türleri. */
export type LocalizableValue = string | string[];

/**
 * "Boş" = yok, null, boş dize ya da tamamı boş dizelerden oluşan liste.
 *
 * ⚠️ `!value` YETMEZ. Yönetici bir çeviriyi silmek için alanı temizlediğinde
 * ortaya `""` ya da `[""]` çıkıyor — ikisi de "değer var" gibi görünür ama
 * ekranda boşluktur. Yedeğe düşme kararı bu yüzden içeriğe bakıyor.
 */
function isEmpty(value: unknown): boolean {
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

/**
 * Aktif dildeki değeri döndürür; yoksa İNGİLİZCEYE düşer.
 *
 * ⚠️ SESSİZ YEDEK BİLİNÇLİ. Eksik çeviri bir hata değil, henüz yapılmamış
 * bir iş; kullanıcıya "çeviri yok" demek yerine anlayacağı bir metin
 * göstermek doğru davranış. Eksikliği görmesi gereken taraf yönetici ve
 * o bilgi `missingLocales` üzerinden panele taşınıyor.
 */
export function getLocalizedField<T extends LocalizableValue>(
  field: Localized<T>,
  language: LanguageCode,
): T;
export function getLocalizedField<T extends LocalizableValue>(
  field: Localized<T> | null | undefined,
  language: LanguageCode,
): T | undefined;
export function getLocalizedField<T extends LocalizableValue>(
  field: Localized<T> | null | undefined,
  language: LanguageCode,
): T | undefined {
  if (!field) return undefined;

  const key = LOCALE_KEY[language] ?? "en";
  if (key === "en") return field.en;

  const value = field[key];
  return isEmpty(value) ? field.en : (value as T);
}

/** Tek bir dil için çeviri eksik mi? (İngilizce her zaman "var" sayılır.) */
export function isTranslationMissing<T extends LocalizableValue>(
  field: Localized<T> | null | undefined,
  language: LanguageCode,
): boolean {
  if (!field) return false;
  const key = LOCALE_KEY[language] ?? "en";
  if (key === "en") return isEmpty(field.en);
  return isEmpty(field[key]);
}

/**
 * ÇEVİRİ KUYRUĞUNUN GİRDİSİ — hangi diller boş?
 *
 * İleride DeepL entegrasyonu bu fonksiyonu çağırıp yalnızca dönen dilleri
 * çevirecek. Şu an panelde "TR/RU eksik" rozetini besliyor: yönetici hangi
 * kaydın çevrilmediğini listeye bakarak görebiliyor.
 */
export function missingLocales<T extends LocalizableValue>(
  field: Localized<T> | null | undefined,
): LocaleKey[] {
  if (!field) return [];
  return (["tr", "ru"] as const).filter((key) => isEmpty(field[key]));
}

/** İngilizceden yeni bir kayıt kurar — çeviriler boş başlar. */
export function localizedFromEnglish<T extends LocalizableValue>(
  en: T,
): Localized<T> {
  return { en, tr: null, ru: null };
}

/**
 * ⚠️ SAVUNMA KATMANI — göç etmemiş bir kaydı okunabilir kılar.
 *
 * `data/villas.json` `scripts/migrate-villas-i18n.mjs` ile dönüştürüldü,
 * ama dosya elle de düzenlenebiliyor (ve bir yedekten geri yüklenebiliyor).
 * Eski biçimde bir kayıt (`title: "Villa Mavi"`) tipe uymadığı hâlde
 * çalışma zamanında gelirse, `getLocalizedField` onda `.en` arayıp
 * `undefined` bulur ve ekranda SESSİZCE boşluk kalır.
 *
 * Bu fonksiyon o durumu kapatıyor: düz bir değer görürse onu İngilizce
 * kabul edip sarmalıyor. Okuma sınırında bir kez çalışır (lib/villas.ts).
 */
export function coerceLocalized<T extends LocalizableValue>(
  value: unknown,
): Localized<T> {
  if (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "en" in (value as Record<string, unknown>)
  ) {
    return value as Localized<T>;
  }

  return localizedFromEnglish((value ?? "") as T);
}
