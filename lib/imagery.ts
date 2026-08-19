/**
 * Sayfa düzeyindeki dekoratif görseller.
 *
 * İlan ve bölge görselleri kendi veri kaynaklarında yaşar (data/villas.json,
 * lib/site.ts). Burada yalnızca "sayfanın kendisine ait" görseller toplanır:
 * hero bantları, süreç bölümünün zemini, kapanış CTA'sı.
 *
 * Tek dosyada durmalarının sebebi: fotoğraf çekimi tamamlandığında tüm site
 * görsellerini tek yerden değiştirebilmek. Sayfaların içine gömülü URL'ler
 * er ya da geç birbirinden ayrışır.
 *
 * TODO: Bunlar Unsplash'ten gelen geçici görsellerdir. Gerçek çekimler
 * hazır olduğunda /public altına (ya da kendi CDN'imize) taşıyın ve
 * next.config.ts içindeki `remotePatterns` kaydını kaldırın.
 */

/** Unsplash'in görsel dönüştürme parametreleriyle sabit oranlı bir URL üretir. */
export function unsplash(id: string, width: number, height: number): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;
}

export type StockImage = { src: string; alt: string };

export const imagery = {
  /**
   * Site geneline sabitlenen siluet (bkz. app/layout.tsx).
   *
   * Katman katman geri çekilen sırtlar ve deniz: %8 opaklıkta bile şekli
   * okunan, dolayısıyla filigran olarak çalışan nadir görsel türü. Soğuk
   * mavi tonu marka paletiyle örtüşüyor; sıcak turuncu bir gün batımı
   * bütün açık bölümleri sarıya çalardı.
   */
  silhouette: {
    src: unsplash("1672917585946-339e22ac54dc", 2400, 1400),
    alt: "",
  },

  /**
   * Ana sayfa hero: Ölüdeniz koyunun havadan görünümü.
   *
   * Slayt gösterisi devreye girdikten sonra da duruyor: video poster'ı
   * olarak kullanılıyor ve HERO_VIDEO doldurulduğunda tek kare olarak
   * geri dönmesi gerekiyor.
   */
  homeHero: {
    src: unsplash("1569660073216-1a6762baad6a", 2400, 1500),
    alt: "The turquoise Blue Lagoon at Ölüdeniz seen from the mountain road above Fethiye",
  },

  /**
   * HERO SLAYTLARI — YERELLEŞTİRİLMİŞ.
   *
   * Önceki set jenerik tropik stoktu (Bali/Maldiv/Tayland havası) ve burada
   * not düşülen coğrafya uyarısının konusuydu. Bu set onun yerine geçiyor:
   * üçü de Akdeniz/Ege karakteri taşıyor ve üçü de bu projede zaten
   * doğrulanmış görsel havuzundan geliyor.
   *
   * Seçim İÇERİK GÖRÜLEREK yapıldı, kimlik doğrulayarak değil:
   *   1. Ölüdeniz — gün batımında kum tükürüğü ve yamaç paraşütleri.
   *      Babadağ siluetiyle birlikte tartışmasız Fethiye.
   *   2. Ege — selvi ağaçlı teras havuzları, beyaz şemsiyeler, puslu
   *      ada silüetleri.
   *   3. Akdeniz — kayalık kıyının üstünde uçurum havuzu, altın ışık.
   *
   * ÇAKIŞMA KURALI: `homeCta` (1765999906700) bilinçli olarak DIŞARIDA.
   * O görsel ana sayfanın kapanış bandında duruyor; hero'da tekrar
   * kullanılsaydı kullanıcı aynı sayfada aynı fotoğrafı iki kez görürdü.
   */
  /*
    ⚠️ BU ÜÇ URL MÜŞTERİ TARAFINDAN AÇIKÇA VERİLDİ ve birebir korunuyor —
    `unsplash()` yardımcısından GEÇMİYORLAR. Yardımcı kendi `w`/`h`
    parametrelerini kurup sabit bir oranda kırpıyor; verilen adreslerin
    kendi `w` ve `fit=crop` değerleri var ve onları yeniden yazmak
    seçilen kadrajı değiştirirdi.

    Sonuç: bu üç kayıt elle güncellenir. Diğer tüm görseller helper'ı
    kullanmaya devam ediyor.
  */
  homeHeroSlides: [
    {
      src: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=2070&auto=format&fit=crop",
      alt: "Luxury villa with a sea view terrace and infinity pool on the Mediterranean coast",
    },
    {
      src: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop",
      alt: "Modern coastal architecture with clean white lines and full-height glazing",
    },
    {
      src: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop",
      alt: "Infinity pool at a contemporary luxury villa looking out over the water",
    },
  ],

  /** "Kimiz" bento hücresi: havuzlu, selvi ağaçlı bir mülk. */
  homeCredentials: {
    src: unsplash("1783936952983-9b80ff0604e9", 1600, 1600),
    alt: "Terraced infinity pools framed by cypress trees at a Mediterranean villa estate",
  },

  /** Süreç bölümünün zemini: puslu, koyu bir sabah koyu. */
  homeProcess: {
    src: unsplash("1579724173466-03417c245633", 2400, 1400),
    alt: "Islands and headlands in the Gulf of Fethiye seen through morning haze",
  },

  /** Ana sayfa kapanış bandı: denize bakan havuz terası. */
  homeCta: {
    src: unsplash("1765999906700-2d4dfd392966", 2400, 1200),
    alt: "Swimming pool on a hillside terrace looking out over the Mediterranean",
  },

  /** İlan listesi hero'su: Ölüdeniz lagünü. */
  propertiesHero: {
    src: unsplash("1686465602845-868cebea024a", 2400, 1400),
    alt: "The Blue Lagoon at Ölüdeniz enclosed by forested mountains",
  },

  /** İlan listesi kapanış bandı: kayalık kıyıda havuz. */
  propertiesCta: {
    src: unsplash("1646519034169-fd82895985ff", 2400, 1200),
    alt: "Clifftop swimming pool above the Mediterranean sea",
  },

  /** Hakkımızda: Fethiye körfezinde demirlemiş tekneler. */
  about: {
    src: unsplash("1651670598951-9982d1ba7d81", 2000, 1200),
    alt: "Yachts at anchor in a sheltered bay on the Fethiye coast",
  },

  /** Bölge rehberi: tepeden Ölüdeniz sahili ve yerleşim. */
  aboutTurkey: {
    src: unsplash("1646287353872-8d5808c375c9", 2000, 1200),
    alt: "Ölüdeniz beach and the resort behind it seen from the hillside road",
  },

  /* ------------------------------------------------------ PENCERE BANTLARI */

  /**
   * "Bölge zekâsı" bölümüne geçişte açılan pencere — ana sayfada kaydırma
   * sırasında ekrana SABİT duran tek görsel, yani "parallax arka plan".
   *
   * URL müşteri tarafından verildi; helper'dan geçmiyor (bkz. homeHeroSlides).
   */
  revealAreas: {
    src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop",
    alt: "Contemporary architectural interior opening onto the coast",
  },

  /** "Süreç" bölümüne geçişte açılan pencere. */
  revealProcess: {
    src: unsplash("1646287353872-8d5808c375c9", 2400, 1400),
    alt: "Green mountains falling into the bright blue sea on the Fethiye coast",
  },

  /* ---------------------------------------------- İÇ SAYFA MANZARA BANTLARI */

  /** Blog: tepeden sahil ve yerleşim. */
  blog: {
    src: unsplash("1635066500129-bd51d721cb9a", 2000, 1100),
    alt: "The bay and the town seen from the hillside road above Fethiye",
  },

  /** Satın alma süreci: palmiyeli modern villa. */
  buyingProcess: {
    src: unsplash("1613977257365-aaae5a9817ff", 2000, 1100),
    alt: "White modern villa with a pool and palm trees on the Turkish coast",
  },

  /** Satış süreci: havuzlu villa cephesi. */
  sellingProcess: {
    src: unsplash("1602343168117-bb8ffe3e2e9f", 2000, 1100),
    alt: "Sunlit villa facade with a large blue swimming pool",
  },

  /** Vatandaşlık: turkuaz koydaki sahil kasabası. */
  citizenship: {
    src: unsplash("1762457556450-365eb6ee21d8", 2000, 1100),
    alt: "Coastal town rooftops above a turquoise Mediterranean bay",
  },

  /** Sigorta: korunaklı, modern bir ev. */
  insurance: {
    src: unsplash("1613490493576-7fde63acd811", 2000, 1100),
    alt: "Contemporary house with a covered terrace and swimming pool",
  },

  /** Görme günü: selvi ağaçlı havuz terasları. */
  viewingDay: {
    src: unsplash("1783936952983-9b80ff0604e9", 2000, 1100),
    alt: "Terraced pools framed by cypress trees at a Mediterranean estate",
  },

  /** İletişim: körfezde gün batımı. */
  contact: {
    src: unsplash("1719451642957-172abf017863", 2000, 1100),
    alt: "Sunset over the headlands and open water off the Fethiye coast",
  },
/*
  Kısıt `StockImage | readonly StockImage[]`: neredeyse her yuva tek bir
  görsel, `homeHeroSlides` ise bir dizi. Birlik tipi, dizinin elemanlarının
  da aynı `{src, alt}` sözleşmesine uymasını zorunlu tutmaya devam ediyor —
  yani alt metni unutulmuş bir slayt burada derlenmez.
*/
} as const satisfies Record<string, StockImage | readonly StockImage[]>;
