/**
 * Filtreler tam `Villa` yerine YAPISAL bir alt küme üzerinde çalışıyor.
 *
 * Sebep: /properties istemci bileşenine artık dar bir görünüm modeli
 * (PropertyCardData) geçiyor — koordinatlar sınırı geçmesin diye. Bu
 * fonksiyonlar `Villa` istemeye devam etseydi, dar model kabul edilmezdi.
 * Alanları tek tek isteyerek ikisiyle de çalışıyorlar.
 */
export type FilterableProperty = {
  propertyType: string;
  bedrooms: number;
  areaSlug: string;
  price: number;
  /** Önceden normalize edilmiş arama metni (bkz. property-card-data.ts). */
  searchText: string;
};

/**
 * İlan filtreleme sözleşmesi.
 *
 * Saf fonksiyonlar: hem sunucuda (ilk render'da kaç sonuç var) hem istemcide
 * (filtre değiştikçe) aynı kod çalışır. Bileşenlerin içinde filtre mantığı
 * tutmuyoruz — böylece kural değiştiğinde tek dosya güncellenir ve mantık
 * test edilebilir kalır.
 */

export type PropertyCategory = "villa" | "apartment" | "plot";

export type PropertyFilters = {
  /** Boş dizi = "hepsi". `location.areaSlug` değerleriyle eşleşir. */
  areas: string[];
  /** Boş dizi = "hepsi". */
  categories: PropertyCategory[];
  /** 0 = "farketmez". Filtre daima "X+" mantığıyla çalışır. */
  minBedrooms: number;
  /** GBP. Kaynak fiyat daima GBP'dir; TRY yalnızca görüntüleme katmanı. */
  minPrice: number;
  maxPrice: number;
  /**
   * Serbest metin. HAM kullanıcı girdisi olarak saklanır — kutuda ne yazdıysa
   * o. Normalizasyon yalnızca karşılaştırma anında yapılır, çünkü bu değer
   * aynı zamanda input'un görünen değeri.
   */
  query: string;
};

export type PriceBounds = { min: number; max: number };

/**
 * ⚠️ ARTIK ÇEVİRİ ANAHTARI, GÖRÜNEN METİN DEĞİL.
 *
 * Bu değerler filtre çubuğunda rozet olarak basılıyor. Doğrudan metin
 * tutmaya devam etselerdi Türkçe sayfada "Villa / Apartment / Plot"
 * görünürdü. Anahtar döndürmek, çağıran tarafın `t()` ile çözmesini
 * zorunlu kılıyor — yani unutulması derleme hatası veriyor.
 */
export const CATEGORY_LABEL: Record<PropertyCategory, string> = {
  villa: "explorer.categoryVilla",
  apartment: "explorer.categoryApartment",
  plot: "explorer.categoryPlot",
};

export const CATEGORY_ORDER: PropertyCategory[] = ["villa", "apartment", "plot"];

/** Filtre çubuğundaki yatak odası segmentleri. 0 = "Any". */
export const BEDROOM_OPTIONS = [0, 1, 2, 3, 4] as const;

/** Fiyat kaydırıcısının adımı — lüks segmentte 25.000 £ altı hassasiyet gereksiz. */
export const PRICE_STEP = 25_000;

/**
 * `propertyType` serbest metin ("Detached villa", "Sea-view apartment", ...).
 * Filtre çubuğu ise üç sabit kategori sunuyor; eşleme burada yapılır ki
 * veri girişi serbest kalsın ama arayüz tahmin edilebilir olsun.
 */
const PLOT_WORDS = ["plot", "land", "arsa", "parcel"];
const APARTMENT_WORDS = [
  "apartment",
  "flat",
  "penthouse",
  "duplex",
  "residence",
  "daire",
];

export function categoryOf(villa: Pick<FilterableProperty, "propertyType">): PropertyCategory {
  const type = villa.propertyType.toLowerCase();

  if (PLOT_WORDS.some((word) => type.includes(word))) return "plot";
  if (APARTMENT_WORDS.some((word) => type.includes(word))) return "apartment";

  /** Bilinmeyen her şey villa sayılır: portföyün varsayılanı bu. */
  return "villa";
}

/** Kaydırıcı uçları veriden türetilir — elle yazılan sabit, veri büyüyünce yalan söyler. */
export function priceBounds(villas: Pick<FilterableProperty, "price">[]): PriceBounds {
  if (villas.length === 0) return { min: 0, max: PRICE_STEP * 40 };

  const prices = villas.map((villa) => villa.price);
  const min = Math.floor(Math.min(...prices) / PRICE_STEP) * PRICE_STEP;
  const max = Math.ceil(Math.max(...prices) / PRICE_STEP) * PRICE_STEP;

  /** Tek ilan varsa min === max olur ve kaydırıcı tutuklaşır; bir adım açıyoruz. */
  return { min, max: max > min ? max : min + PRICE_STEP };
}

export function defaultFilters(bounds: PriceBounds): PropertyFilters {
  return {
    areas: [],
    categories: [],
    minBedrooms: 0,
    minPrice: bounds.min,
    maxPrice: bounds.max,
    query: "",
  };
}

/* ------------------------------------------------------------ SERBEST METİN */

/**
 * Türkçe karakter katlaması. `NFD` + aksan silme TEK BAŞINA YETMEZ:
 * "ı" (U+0131) bir "i" + aksan değil, kendi başına bir harftir ve
 * ayrıştırılamaz. Yani "ovacik" yazan kullanıcı "Ovacık"ı bulamazdı.
 * Bu tablo tam da o boşluğu kapatıyor; kalan aksanları (é, â...) NFD alıyor.
 */
const TURKISH_FOLD: Record<string, string> = {
  ı: "i",
  İ: "i",
  ş: "s",
  Ş: "s",
  ğ: "g",
  Ğ: "g",
  ç: "c",
  Ç: "c",
  ö: "o",
  Ö: "o",
  ü: "u",
  Ü: "u",
};

/**
 * Aramanın iki ucunda da ÇALIŞAN TEK fonksiyon: ilan metni derleme anında,
 * kullanıcı sorgusu tuş vuruşunda buradan geçer. İkisi ayrı yerlerde
 * normalize edilseydi, aradaki en küçük fark sessizce eşleşmeyen bir arama
 * üretirdi — hata vermeyen, sadece "sonuç yok" diyen türden.
 */
export function normalizeSearch(value: string): string {
  return value
    .replace(/[ıİşŞğĞçÇöÖüÜ]/g, (char) => TURKISH_FOLD[char] ?? char)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Sorgu kelimelere bölünür ve HEPSİ eşleşmek zorundadır (VE mantığı):
 * "sea view pool" yazan kullanıcı ikisini birden isteyip aramayı daraltmayı
 * bekler; VEYA mantığı yazdıkça sonuç sayısını büyütür ve arama kutusunu
 * kırık gösterir. Kelime sırası önemsizdir.
 */
function matchesQuery(searchText: string, query: string): boolean {
  const terms = normalizeSearch(query).split(" ").filter(Boolean);
  if (terms.length === 0) return true;

  return terms.every((term) => searchText.includes(term));
}

export function filterVillas<T extends FilterableProperty>(
  villas: T[],
  filters: PropertyFilters,
): T[] {
  return villas.filter((villa) => {
    if (filters.areas.length > 0 && !filters.areas.includes(villa.areaSlug)) {
      return false;
    }

    if (
      filters.categories.length > 0 &&
      !filters.categories.includes(categoryOf(villa))
    ) {
      return false;
    }

    if (villa.bedrooms < filters.minBedrooms) return false;

    if (!matchesQuery(villa.searchText, filters.query)) return false;

    return villa.price >= filters.minPrice && villa.price <= filters.maxPrice;
  });
}

/** Sıfırlama butonunun ve "N filtre aktif" rozetinin kaynağı. */
export function activeFilterCount(
  filters: PropertyFilters,
  bounds: PriceBounds,
): number {
  return (
    filters.areas.length +
    filters.categories.length +
    (filters.minBedrooms > 0 ? 1 : 0) +
    (filters.minPrice > bounds.min || filters.maxPrice < bounds.max ? 1 : 0) +
    /* Yalnızca boşluk yazmak filtre sayılmaz — `Reset` boş yere belirmesin. */
    (normalizeSearch(filters.query).length > 0 ? 1 : 0)
  );
}

/* --------------------------------------------------------------- DERİN LİNK */

/**
 * Filtre durumu URL'in HASH kısmında taşınır (`/properties#area=oludeniz&beds=3`),
 * query string'de değil.
 *
 * Sebep: query string sunucuya gider ve her filtre kombinasyonu ayrı bir
 * taranabilir URL üretir — aynı ilanların onlarca kopyası, boşa harcanan
 * tarama bütçesi. Hash sunucuya hiç gönderilmez: sayfa statik (SSG) kalır,
 * tek bir canonical URL vardır, ama kullanıcı yine de filtreli bir görünümü
 * paylaşabilir. Ayrıca `useSearchParams` kullanmadığımız için ızgara
 * prerender iptaline yol açmaz.
 *
 * `encodeFilters` ikinci bir iş daha görüyor: gezgin bu metni filtre KİMLİĞİ
 * olarak kullanıp "Load more" sayacını sıfırlıyor. Buraya yeni bir filtre
 * alanı eklenir de burada serileştirilmezse, o alan değiştiğinde sayfalama
 * başa dönmez.
 */
export function encodeFilters(
  filters: PropertyFilters,
  bounds: PriceBounds,
): string {
  const parts: string[] = [];

  if (filters.areas.length > 0) parts.push(`area=${filters.areas.join(",")}`);
  if (filters.categories.length > 0) {
    parts.push(`type=${filters.categories.join(",")}`);
  }
  if (filters.minBedrooms > 0) parts.push(`beds=${filters.minBedrooms}`);
  if (filters.minPrice > bounds.min) parts.push(`min=${filters.minPrice}`);
  if (filters.maxPrice < bounds.max) parts.push(`max=${filters.maxPrice}`);
  /*
    `encodeURIComponent`: sorgu "sea view & pool" olabilir. Kaçırılmazsa
    `&` hash'i ikiye bölüp uydurma bir parametre üretir.
  */
  if (filters.query.trim().length > 0) {
    parts.push(`q=${encodeURIComponent(filters.query.trim())}`);
  }

  return parts.join("&");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function readNumber(params: URLSearchParams, key: string): number | null {
  const raw = params.get(key);
  if (raw === null) return null;

  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

/**
 * Hash'i filtreye çevirir. Girdi kullanıcı tarafından düzenlenebilir olduğu
 * için her alan doğrulanır; tanınmayan değer sessizce yok sayılır ve
 * varsayılana düşülür — hatalı bir link asla boş bir sayfa göstermez.
 */
export function decodeFilters(
  hash: string,
  bounds: PriceBounds,
): PropertyFilters {
  const base = defaultFilters(bounds);
  const params = new URLSearchParams(hash.replace(/^#/, ""));

  const areas = (params.get("area") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const categories = (params.get("type") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value): value is PropertyCategory =>
      CATEGORY_ORDER.includes(value as PropertyCategory),
    );

  const beds = readNumber(params, "beds");
  const min = readNumber(params, "min");
  const max = readNumber(params, "max");

  const minPrice = min === null ? base.minPrice : clamp(min, bounds.min, bounds.max);
  const maxPrice = max === null ? base.maxPrice : clamp(max, bounds.min, bounds.max);

  return {
    areas,
    categories,
    minBedrooms: beds === null ? 0 : clamp(Math.round(beds), 0, 4),
    /** Sıra bozuksa düzelt: `min>max` görsel olarak kırık bir kaydırıcı demek. */
    minPrice: Math.min(minPrice, maxPrice),
    maxPrice: Math.max(minPrice, maxPrice),
    /*
      `URLSearchParams` çözmeyi kendi yapıyor; ayrıca decode etmek
      "%2520" gibi çift kaçırılmış girdilerde metni bozardı. Uzunluk sınırı
      kötü niyetli bir linkin arama kutusuna kilobaytlarca metin
      doldurmasını engelliyor.
    */
    query: (params.get("q") ?? "").slice(0, 80),
  };
}

/* ------------------------------------------------------------------ SIRALAMA */

export type SortKey = "recommended" | "price-asc" | "price-desc" | "newest";

export type SortableProperty = {
  price: number;
  publishedAt: string;
  featured: boolean;
};

/** `label` bir ÇEVİRİ ANAHTARI — gerekçe CATEGORY_LABEL'de. */
export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recommended", label: "explorer.sortRecommended" },
  { value: "price-asc", label: "explorer.sortPriceAsc" },
  { value: "price-desc", label: "explorer.sortPriceDesc" },
  { value: "newest", label: "explorer.sortNewest" },
];

export const DEFAULT_SORT: SortKey = "recommended";

export function decodeSort(hash: string): SortKey {
  const raw = new URLSearchParams(hash.replace(/^#/, "")).get("sort");
  return SORT_OPTIONS.some((option) => option.value === raw)
    ? (raw as SortKey)
    : DEFAULT_SORT;
}

/**
 * Sıralama. `filterVillas`ın çıktısı üzerinde, sayfalama dilimlemesinden
 * ÖNCE çalışır — sonra çalışsaydı yalnızca görünen 12 kart kendi içinde
 * sıralanır ve "en ucuz" kart 13. sırada saklı kalırdı.
 *
 * Girdi kopyalanıyor (`[...villas]`): `sort` yerinde çalışır ve `useMemo`
 * girdisini mutasyona uğratmak, aynı diziyi okuyan başka bir hesabın
 * sırasını sessizce değiştirir.
 */
export function sortVillas<T extends SortableProperty>(
  villas: T[],
  sort: SortKey,
): T[] {
  const list = [...villas];

  /*
    Fiyatı 0 olan ilan "Price on application" demek, "bedava" değil.
    Sayısal karşılaştırmaya girerse artan sıralamada en başa oturur ve
    listenin en pahalı evlerinin önüne geçer. Yönü ne olursa olsun sona.
  */
  const priced = (villa: T) => (villa.price > 0 ? villa.price : null);

  switch (sort) {
    case "price-asc":
    case "price-desc":
      return list.sort((a, b) => {
        const left = priced(a);
        const right = priced(b);
        if (left === null || right === null) {
          return left === right ? 0 : left === null ? 1 : -1;
        }
        return sort === "price-asc" ? left - right : right - left;
      });

    case "newest":
      /*
        ISO tarihler (YYYY-MM-DD) sözlük sırasıyla kronolojik sıralanır;
        `Date` nesnesi kurmaya gerek yok. 57 ilan yalnızca 24 farklı tarih
        taşıyor — WordPress taşımasında ilanlar toplu damgalanmış. Eşit
        tarihlerde `sort` kararlı olduğu için kaynak sırası korunuyor.
      */
      return list.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

    case "recommended":
    default:
      /* Öne çıkanlar başa; gerisi kaynak sırasında (kararlı sıralama). */
      return list.sort((a, b) => Number(b.featured) - Number(a.featured));
  }
}
