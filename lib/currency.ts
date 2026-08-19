/**
 * PARA BİRİMİ KATMANI.
 *
 * Fiyatlar kaynakta (data/villas.json) DAİMA GBP tutulur. Buradaki her şey
 * yalnızca görüntüleme katmanıdır: kaynak tutar hiç değişmez, seçilen para
 * birimi onu bir kur ile çarpıp biçimlendirir. Bu ayrım önemli — `Price`
 * bileşeni makine tarafından okunan `<data value>` alanında hep GBP basar,
 * böylece ekrandaki değer ile Product schema'sı çelişmez.
 */

export const CURRENCIES = ["GBP", "EUR", "TRY", "RUB"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

/** Kur tablosu — TAMAMI GBP tabanlı. `GBP: 1` değişmez. */
export type Rates = Record<CurrencyCode, number>;

export type CurrencyMeta = {
  code: CurrencyCode;
  /** Tetikleyicide kodun yanında görünen sembol. */
  symbol: string;
  /** Açılır listede görünen tam ad. */
  label: string;
  /** Intl.NumberFormat yerel ayarı — binlik ayracını bu belirler. */
  locale: string;
  /**
   * YUVARLAMA ADIMI.
   *
   * Lüks emlakta kuruş göstermek ucuz durur, ama asıl mesele dürüstlük:
   * GBP dışındaki her tutar bir YAKLAŞIKLIK. Kuruşuna kadar yazılmış bir
   * çeviri, olmadığı bir kesinliği ima eder. Adım her para biriminde tipik
   * bir villa fiyatının (~£400k) yaklaşık binde birine denk gelecek şekilde
   * seçildi; sayı "yuvarlanmış" görünür ama bilgi kaybı ihmal edilebilir.
   */
  step: number;
};

export const CURRENCY_META: Record<CurrencyCode, CurrencyMeta> = {
  /** Kaynak para birimi: yuvarlama YOK, gösterilen tutar gerçek tutardır. */
  GBP: {
    code: "GBP",
    symbol: "£",
    label: "British Pound",
    locale: "en-GB",
    step: 1,
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    label: "Euro",
    /**
     * ⚠️ `de-DE` DEĞİL, `en-IE`.
     *
     * EUR artık kendi başına bir dil seçimi değil; başlıktaki tek seçicide
     * "English (EUR – €)" satırına, yani İNGİLİZCE arayüze bağlı. de-DE
     * biçimi "1.462.000 €" verir — İngilizce bir sayfada nokta binlik ayracı
     * ve sondaki sembol yabancı durur, hatta 1.462 bir buçuk gibi okunabilir.
     * en-IE hem avro bölgesi hem İngilizce: "€1,462,000".
     */
    locale: "en-IE",
    step: 1_000,
  },
  TRY: {
    code: "TRY",
    symbol: "₺",
    label: "Turkish Lira",
    locale: "tr-TR",
    step: 10_000,
  },
  RUB: {
    code: "RUB",
    symbol: "₽",
    label: "Russian Ruble",
    locale: "ru-RU",
    step: 100_000,
  },
};

/**
 * Kur servisi ulaşılamazsa kullanılan güvenli varsayılanlar.
 * Fiyat GÖSTERMEMEKTENSE yaklaşık göstermek daha iyidir — bu yüzden servis
 * hatası build'i düşürmez, sessizce buraya düşer. Değerler Ağustos 2026
 * civarındadır; kur servisi kalıcı olarak bozulursa bunlar bayatlar.
 */
export const FALLBACK_RATES: Rates = {
  GBP: 1,
  EUR: 1.17,
  TRY: 64.8,
  RUB: 113.7,
};

/**
 * NEDEN exchangerate-api (open.er-api.com) VE NEDEN frankfurter DEĞİL.
 *
 * Önceki sürüm frankfurter.app kullanıyordu; ECB referans kurlarına dayanır
 * ve GBP→TRY için gayet iyidir. Ama ECB Mart 2022'den beri RUB referans kuru
 * YAYINLAMIYOR, dolayısıyla frankfurter'ın para birimi listesinde RUB yok —
 * dil seçicisine RU eklenince o kaynak tek başına yetersiz kaldı.
 *
 * open.er-api.com dört para biriminin hepsini tek istekte, anahtarsız veriyor.
 * Bedeli güncelleme sıklığı: günde bir. Bir villa fiyatının yaklaşık
 * gösterimi için fazlasıyla yeterli, üstelik zaten 12 saat cache'liyoruz.
 */
const RATES_ENDPOINT = "https://open.er-api.com/v6/latest/GBP";

/** Servis bir para birimini atlarsa yalnızca ONUN yerine yedek kullanılır. */
function coerceRate(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

/**
 * GBP tabanlı kurlar. Sunucuda çağrılır ve 12 saat cache'lenir; böylece
 * sayfalar statik kalır ama kur bayatlamaz.
 */
export async function getRates(): Promise<Rates> {
  try {
    const response = await fetch(RATES_ENDPOINT, {
      next: { revalidate: 43_200, tags: ["fx-rate"] },
    });

    if (!response.ok) return FALLBACK_RATES;

    const data: { rates?: Record<string, unknown> } = await response.json();
    const rates = data.rates;

    if (!rates) return FALLBACK_RATES;

    return {
      /* Taban her koşulda 1 — servisten gelen değere bakılmaz. */
      GBP: 1,
      EUR: coerceRate(rates.EUR, FALLBACK_RATES.EUR),
      TRY: coerceRate(rates.TRY, FALLBACK_RATES.TRY),
      RUB: coerceRate(rates.RUB, FALLBACK_RATES.RUB),
    };
  } catch {
    return FALLBACK_RATES;
  }
}

/** GBP tutarını hedef para birimine çevirir ve adıma yuvarlar. */
export function convertPrice(
  gbpAmount: number,
  currency: CurrencyCode,
  rates: Rates,
): number {
  const { step } = CURRENCY_META[currency];
  const converted = gbpAmount * rates[currency];

  return Math.round(converted / step) * step;
}

export function formatPrice(
  gbpAmount: number,
  currency: CurrencyCode,
  rates: Rates,
): string {
  const { locale } = CURRENCY_META[currency];

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(convertPrice(gbpAmount, currency, rates));
}
