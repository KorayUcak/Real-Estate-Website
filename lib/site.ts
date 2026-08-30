/**
 * Tek doğruluk kaynağı (single source of truth).
 * Header, Footer, iletişim sayfaları ve Schema.org markup'ı hep buradan beslenir;
 * böylece NAP (Name / Address / Phone) bilgisi tüm sitede birebir tutarlı kalır.
 * Google, yerel SEO'da bu tutarlılığı doğrudan bir güven sinyali olarak kullanır.
 */

/**
 * ÜRETİM ALAN ADI — TEK KAYNAK.
 *
 * ⚠️ `www.` DAHİL. Değer buradan şu alanların TAMAMINA gidiyor:
 * `metadataBase`, canonical, hreflang kümesi, `og:url`, sitemap girdileri,
 * robots.txt host satırı, schema.org `@id` düğümleri ve e-posta şablonları.
 *
 * Bu yüzden alan adı YALNIZCA burada değişir. Örneğin `metadataBase`e elle
 * "www"lu bir adres yazıp gerisini bırakmak, paylaşım görsellerinin bir
 * alan adına, canonical'ların başka bir alan adına işaret etmesi demekti —
 * Google için tek bir sayfanın iki ayrı adresi, yani bölünmüş sinyal.
 *
 * Barındırma tarafında www ↔ apex arasında TEK YÖNLÜ bir yönlendirme
 * olmalı; iki adres de 200 dönerse buradaki tutarlılık tek başına yetmez.
 *
 * `.env.local` içindeki NEXT_PUBLIC_SITE_URL bunu ezer (staging için).
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.coast2coastpropertiesturkey.co.uk"
).replace(/\/$/, "");

export const siteConfig = {
  name: "Coast 2 Coast Properties Turkey",
  shortName: "Coast 2 Coast",
  legalName: "Coast 2 Coast Properties Turkey Ltd.",
  /**
   * BOŞLUKSUZ YAZIM — schema.org `alternateName` için.
   *
   * Marka ekranda ve Google Business Profile'da "Coast 2 Coast" olarak
   * yazılıyor; NAP tutarlılığı için `name` alanı bundan SAPMAMALI. Ama alan
   * adı (coast2coast...) ve insanların arama kutusuna yazdığı hâl bitişik.
   * `alternateName` tam olarak bunun içindir: aynı varlığın ikinci adı.
   * İki yazımı iki ayrı `name` olarak beyan etmek yerine tek varlıkta
   * toplamak, arama ve LLM tarafında birleşik bir kimlik verir.
   */
  alternateName: "Coast2Coast Properties Turkey",
  tagline: "Luxury villas in Fethiye, Ölüdeniz & Göcek",
  description:
    "Coast 2 Coast Properties Turkey is an international real estate consultancy specialising in luxury villas for sale in Fethiye, Ölüdeniz, Hisarönü, Ovacık, Çalış, Üzümlü and Göcek. End-to-end guidance from viewing trip to title deed.",
  /**
   * VARLIK TANIMI — yalnızca schema.org düğümü için, meta açıklama DEĞİL.
   *
   * Neden `description` alanından ayrı duruyor: meta açıklama SERP'te
   * ~160 karakterde kesilir, yani orada uzun yazmak bilgi değil kırpılmış
   * cümle üretir. Buradaki metni ise okuyan taraf (Google'ın varlık grafiği,
   * ChatGPT/Gemini gibi motorların alıntı katmanı) kesmez — kimlere hizmet
   * verildiği, hangi bölgeler ve hangi hizmetler tek paragrafta durur.
   * İkisi ayrı alan olduğu için biri diğerini bozmadan uzayabilir.
   */
  profileDescription:
    "Coast2Coast Properties Turkey is the premier luxury real estate agency in Fethiye, specializing in serving UK expats, foreign investors, and premium Turkish buyers. We offer expert guidance in property investment and holiday homes across central Fethiye, Ölüdeniz, Çalış, Hisarönü, Ovacık, and Üzümlü, alongside seamless title deed transfers and legal support.",
  locale: "en_GB",
  url: SITE_URL,
  founded: "2016",
} as const;

/**
 * NAP bilgisinin tek kaynağı. Numara üç ayrı biçimde tutuluyor çünkü üç
 * ayrı tüketicisi var ve her biri farklı bir format bekliyor:
 *
 *   phoneDisplay   → ekranda görünen, uluslararası okunabilir hâli
 *   phoneE164      → tel: bağlantıları ve Schema.org `telephone` alanı
 *   whatsappNumber → wa.me yalnızca rakam kabul eder (+ ve boşluk kabul etmez)
 *
 * Yerel numara 0534 052 00 30; site uluslararası alıcıya baktığı için ekranda
 * daima ülke koduyla gösteriliyor.
 *
 * İkinci hat (`phoneSecondary*`) aynı ikiliyi tekrarlar ama WhatsApp karşılığı
 * YOKTUR — gerekçe alanın kendi yorumunda.
 */
export const contact = {
  /** İnsan tarafından okunan format */
  phoneDisplay: "+90 534 052 00 30",
  /** tel: ve WhatsApp linkleri için E.164 (boşluksuz) */
  phoneE164: "+905340520030",
  /**
   * İKİNCİ HAT — ofisin ikinci numarası.
   *
   * Birincil numaranın hemen ALTINDA gösteriliyor (footer, mobil çekmece,
   * /contact kartı). Bilinçli olarak WhatsApp'a ve schema.org `telephone`
   * alanına BAĞLANMADI: Google yerel SEO'da tek bir birincil numara bekler,
   * ikinci bir `telephone` beyanı NAP sinyalini güçlendirmez, seyreltir.
   * Ekranda "ayrıca buradan da ulaşabilirsiniz" bilgisi olarak duruyor.
   *
   * Yerel yazım 0543 903 35 19; ekranda birincil numarayla aynı kuralla,
   * yani ülke koduyla gösteriliyor.
   */
  phoneSecondaryDisplay: "+90 543 903 35 19",
  /** İkinci hattın tel: bağlantısı için E.164 (boşluksuz) */
  phoneSecondaryE164: "+905439033519",
  /** wa.me sadece rakam kabul eder */
  whatsappNumber: "905340520030",
  email: "info@coast2coastpropertiesturkey.co.uk",
  address: {
    /**
     * EKRANDA GÖRÜNEN RESMÎ ADRES — tek satır, birebir.
     *
     * Footer ve /contact bu dizeyi olduğu gibi basar. Parçalara ayrılmış
     * alanlar yalnızca schema.org PostalAddress'i beslemek için var;
     * ikisinin aynı kaynaktan türemesi NAP tutarlılığını garanti eder.
     *
     * NOT: resmî adreste posta kodu bulunmuyor, bu yüzden `postalCode`
     * alanı kaldırıldı — uydurma bir kod yazmak yerine alanı hiç
     * göndermemek doğru davranış (schema.org'da opsiyonel bir alan).
     */
    full: "Cumhuriyet Mah. Çarşı Caddesi Likya Is Merkezi No.1/208-Fethiye/MUGLA",
    street: "Cumhuriyet Mah. Çarşı Caddesi Likya Is Merkezi No.1/208",
    district: "Fethiye",
    city: "Muğla",
    country: "TR",
    countryName: "Türkiye",
  },
  /** Fethiye merkez — LocalBusiness geo alanı için */
  geo: { latitude: 36.6213, longitude: 29.1164 },
  openingHours: "Mon–Sat, 09:00–19:00 (TRT)",
} as const;

export const social = {
  instagram: "https://www.instagram.com/coast2coastpropertiesturkey/",
  facebook: "https://www.facebook.com/coast2coastpropertiesturkey/",
  x: "https://x.com/coast2coastpro",
} as const;

/** Schema.org sameAs + rel="me" için düz liste */
export const socialProfiles: string[] = Object.values(social);

/**
 * ⚠️ `whatsappLink` BURADAN KALDIRILDI.
 *
 * Numara artık `data/settings.json` üzerinden panelden düzenleniyor.
 * Sabitten okuyan bir yardımcı bırakmak, yönetici numarayı değiştirdiğinde
 * 15 CTA'nın sessizce eski numarayı aramaya devam etmesi demekti.
 *
 * Yerine geçenler:
 *   sunucu bileşenleri → `whatsappHref(number, message)`  (lib/settings.ts)
 *   istemci bileşenleri → `useWhatsappLink(message)`      (components/settings-provider)
 */

/**
 * Fethiye ve çevresi — /about-turkey sayfasındaki bölge rehberinin ve
 * `areaServed` schema alanının ortak kaynağı.
 * `blurb` metinleri kart altlarında görünür; anahtar kelimeleri doğal biçimde taşır.
 *
 * NOT: Ayrı /locations rotaları kaldırıldı. Bölge içeriği artık tek bir
 * kapsamlı sayfada (/about-turkey#areas) yaşıyor — sekiz ince sayfa yerine
 * tek güçlü sayfa, hem kullanıcı hem de tarama bütçesi açısından daha iyi.
 */
export type ServiceArea = {
  slug: string;
  name: string;
  headline: string;
  blurb: string;
  image: string;
  /**
   * Bölge merkezi. Konum FİLTRESİ bunu kullanmaz — filtreleme yalnızca `slug`
   * eşleşmesiyle çalışır. Bu alan schema.org `Place.geo` bloğu içindir:
   * yerel aramada "Fethiye'de satılık villa" sorgusuna bağlanan sinyal budur.
   *
   * NOT: scripts/adapt-villas.js kendi merkez listesini taşır (CommonJS olduğu
   * için bu TS modülünü import edemiyor). Buradaki bir koordinatı
   * değiştirirseniz oradaki SERVICE_AREAS listesini de güncelleyin.
   */
  coordinates: { lat: number; lng: number };
};

export const serviceAreas: ServiceArea[] = [
  {
    slug: "fethiye-centre",
    /*
      ⚠️ SLUG "fethiye-centre" KALIYOR, AD "Fethiye" OLDU.

      Etiketten "Merkez" düştü çünkü artık Taşyaka da bu bölgenin içinde;
      "merkez" demek, kapsadığı alandan dar bir söz vermek olurdu.

      Slug'a dokunulmadı ve bu bilinçli: `?area=fethiye-centre` filtre
      bağlantıları dizinde, ilan kayıtlarının `location.areaSlug` alanı
      buna bağlı, /about-turkey#area-fethiye-centre çapası da öyle.
      Görünen adı değiştirmek bunların hiçbirini kırmıyor; slug'ı
      değiştirmek üçünü birden kırardı.
    */
    name: "Fethiye",
    headline: "Marina living, year-round town",
    blurb:
      "Fethiye's town centre pairs a working marina, the Tuesday market and full-time amenities with sea-view apartments and hillside villas.",
    image: "https://images.unsplash.com/photo-1651670598951-9982d1ba7d81?auto=format&fit=crop&w=1600&h=1200&q=80",
    coordinates: { lat: 36.6213, lng: 29.1164 },
  },
  {
    slug: "oludeniz",
    name: "Ölüdeniz",
    headline: "The Blue Lagoon postcard",
    blurb:
      "Turkey's most photographed bay. Ölüdeniz villas trade on lagoon views, paragliding skies and the strongest short-let demand in the region.",
    image: "https://images.unsplash.com/photo-1691613931158-defde665d93d?auto=format&fit=crop&w=1600&h=1200&q=80",
    coordinates: { lat: 36.5501, lng: 29.1173 },
  },
  {
    slug: "hisaronu",
    name: "Hisarönü",
    headline: "Nightlife and rental yield",
    blurb:
      "A compact resort centre minutes from Ölüdeniz beach — the go-to for buyers chasing summer rental occupancy.",
    image: "https://images.unsplash.com/photo-1666471771218-c10e5791c935?auto=format&fit=crop&w=1600&h=1200&q=80",
    coordinates: { lat: 36.5747, lng: 29.1225 },
  },
  {
    slug: "ovacik",
    name: "Ovacık",
    headline: "Quiet valley, mountain air",
    blurb:
      "Ovacık sits above the coast in a green valley: larger plots, cooler evenings and a calmer, family-first pace.",
    image: "https://images.unsplash.com/photo-1639766149153-33de8c4906b5?auto=format&fit=crop&w=1600&h=1200&q=80",
    coordinates: { lat: 36.5836, lng: 29.1447 },
  },
  {
    slug: "calis",
    name: "Çalış",
    headline: "Sunsets on a long flat beach",
    blurb:
      "Çalış Beach offers a level promenade, famous sunsets and easy-access properties — popular with retirees and long-stay owners.",
    image: "https://images.unsplash.com/photo-1719451642957-172abf017863?auto=format&fit=crop&w=1600&h=1200&q=80",
    coordinates: { lat: 36.6486, lng: 29.0921 },
  },
  {
    slug: "uzumlu",
    name: "Üzümlü",
    headline: "Village life beneath Babadağ",
    blurb:
      "Üzümlü is Fethiye's highland village: vineyards, cooler summers and detached villas at noticeably lower price per square metre.",
    image: "https://images.unsplash.com/photo-1587996735085-1eba19480192?auto=format&fit=crop&w=1600&h=1200&q=80",
    coordinates: { lat: 36.7179, lng: 29.2677 },
  },
  {
    slug: "gocek",
    name: "Göcek",
    headline: "Six marinas, blue-chip addresses",
    blurb:
      "Göcek is the yachting capital of the Gulf. Low-density, high-value, and the most defensive resale market we cover.",
    image: "https://images.unsplash.com/photo-1619508178926-90fa6cd9c42e?auto=format&fit=crop&w=1600&h=1200&q=80",
    coordinates: { lat: 36.7522, lng: 28.9403 },
  },
  /* ------------------------------------------------------------------
     Aşağıdaki beş bölge WordPress taşımasıyla ortaya çıktı: portföyde
     ilan var ama listede karşılığı yoktu, dolayısıyla Konum filtresinde
     görünmüyorlardı. Fethiye ilçe sınırının dışına taşanlar da var —
     `district` alanı yine "Fethiye" kalıyor çünkü ofis oradan çalışıyor.
     ------------------------------------------------------------------ */
  {
    slug: "yaniklar",
    name: "Yanıklar",
    headline: "Pine coast, no crowds",
    blurb:
      "A quiet stretch of pine-backed coastline north of Çalış, built around large low-density complexes. Beaches and forest on one side, a fifteen-minute drive to Fethiye on the other.",
    image:
      "https://images.unsplash.com/photo-1570799088236-903069fde316?auto=format&fit=crop&w=1600&h=1200&q=80",
    coordinates: { lat: 36.6953, lng: 29.0581 },
  },
  {
    slug: "dalaman",
    name: "Dalaman",
    headline: "Ten minutes from the runway",
    blurb:
      "The airport town, and the shortest transfer on this coast. Sarıgerme's long sand beach sits fifteen minutes away and prices stay well below the Fethiye resorts.",
    image:
      "https://images.unsplash.com/photo-1566460534866-43a00acfc1fc?auto=format&fit=crop&w=1600&h=1200&q=80",
    coordinates: { lat: 36.7573, lng: 28.813 },
  },
  {
    slug: "kalkan",
    name: "Kalkan",
    headline: "Cliffside villas, infinity pools",
    blurb:
      "Whitewashed houses stacked above a working harbour, an hour and a half south of Fethiye. The most established luxury rental market on the Turquoise Coast.",
    image:
      "https://images.unsplash.com/photo-1682882782297-4816cfc744c0?auto=format&fit=crop&w=1600&h=1200&q=80",
    coordinates: { lat: 36.2656, lng: 29.3981 },
  },
  {
    slug: "seydikemer",
    name: "Seydikemer",
    headline: "Mountains, rivers, more land",
    blurb:
      "Inland farming country thirty minutes from Fethiye, on the road to Saklıkent Gorge. Plots here are two or three times the size you would get on the coast for the money.",
    image:
      "https://images.unsplash.com/photo-1625430105065-dea2feb60104?auto=format&fit=crop&w=1600&h=1200&q=80",
    coordinates: { lat: 36.6422, lng: 29.3814 },
  },
  {
    slug: "bekciler",
    name: "Bekçiler",
    headline: "Highland air, cooler summers",
    blurb:
      "A forested plateau well above sea level, where August nights are genuinely cool. A long drive from the beaches, and priced accordingly.",
    image:
      "https://images.unsplash.com/photo-1543198455-0320f7df42f1?auto=format&fit=crop&w=1600&h=1200&q=80",
    coordinates: { lat: 36.8992, lng: 29.7073 },
  },
];

/**
 * ANA SAYFADA GÖSTERİLEN BÖLGELER — dört tane, elle seçilmiş.
 *
 * ⚠️ ÖNCEDEN `serviceAreas.slice(0, 5)` İDİ. Dilim almak "seçim" değil
 * kazaydı: listenin başına yeni bir bölge eklendiği gün ana sayfa
 * sessizce başka bir şey tanıtmaya başlıyordu. Vitrin, veri sırasının
 * yan etkisi olmamalı.
 *
 * NEDEN DÖRT: ana sayfa bir fihrist değil, bir fragman. On iki bölgenin
 * tamamı zaten /about-turkey'de haritasıyla ve tam anlatısıyla duruyor;
 * ziyaretçiyi ana sayfada aynı listeyle karşılamak kararı kolaylaştırmıyor,
 * erteletiyor. Dört kart tek satıra sığıyor (lg:grid-cols-4) ve altındaki
 * "tümünü keşfet" bağlantısı akışı doğru yere taşıyor.
 *
 * SIRA ÖNEMLİ: kartlar bu dizinin sırasıyla basılıyor, `serviceAreas`in
 * sırasıyla değil. En bilinen iki ad önde, Kalkan lüks segmentin vitrini,
 * Hisarönü getiri odaklı alıcı için.
 */
export const FEATURED_AREA_SLUGS = [
  "fethiye-centre",
  "oludeniz",
  "kalkan",
  "hisaronu",
] as const;

/**
 * Header ve Footer'ın ORTAK kaynağı — ikisi de bu diziyi map'ler.
 * Bu yüzden bir rota adı değiştiğinde iki bileşeni ayrı ayrı düzenlemek
 * gerekmez; burayı güncellemek yeterlidir.
 */
export const primaryNav = [
  { href: "/properties", label: "Properties" },
  { href: "/about-turkey", label: "About Turkey" },
  { href: "/viewing-day", label: "Viewing Day" },
  /**
   * Kısa etiketler: dokuz öğelik bir menüde "Buying Process" / "Selling Process"
   * tek satıra sığmıyor. Sayfaların kendi <h1> ve <title> değerleri tam hâliyle
   * kalır — kısaltma yalnızca menü etiketidir.
   */
  { href: "/buying-process", label: "Buying" },
  { href: "/selling-process", label: "Selling" },
  { href: "/citizenship", label: "Citizenship" },
  { href: "/insurance", label: "Insurance" },
  { href: "/about", label: "About" },
  { href: "/testimonials", label: "Testimonials" },
  { href: "/contact", label: "Contact" },
] as const;

/**
 * BAŞLIK GEZİNMESİ — gruplu.
 *
 * `primaryNav` düz kalıyor ve footer'ın "Explore" sütununu beslemeye devam
 * ediyor: bir site haritasında düzlük doğru davranış, her sayfa aynı
 * derinlikte listelenmeli. Başlık ise farklı bir sorunu çözüyor — dokuz
 * bağlantı masaüstünde bir "bağlantı çorbası", mobil çekmecede ise bir metin
 * duvarı üretiyordu.
 *
 * Beş bilgi sayfası tek bir "Guides" başlığı altında toplandı; üst seviyede
 * yalnızca kullanıcının gerçekten aradığı beş şey kaldı: ilanlar, rehberler,
 * gezi, biz kimiz, iletişim.
 *
 * `description` yalnızca masaüstü açılır menüsünde görünüyor. Etiketler tek
 * başına ("Buying", "Selling") menüde ne olduğunu anlatmıyordu; tek satırlık
 * bir açıklama, tıklamadan önce kararı veren şey.
 */
export type HeaderNavLink = { href: string; label: string; description?: string };
export type HeaderNavItem =
  | HeaderNavLink
  | { label: string; children: readonly HeaderNavLink[] };

export const headerNav: readonly HeaderNavItem[] = [
  { href: "/properties", label: "Properties" },
  {
    label: "Guides",
    children: [
      {
        href: "/about-turkey",
        label: "About Turkey",
        description: "The coast, the areas and what living here is like",
      },
      {
        href: "/buying-process",
        label: "Buying Process",
        description: "Every stage from offer to title deed",
      },
      {
        href: "/selling-process",
        label: "Selling Process",
        description: "How we price, market and complete a sale",
      },
      {
        href: "/citizenship",
        label: "Turkish Citizenship",
        description: "Residency and citizenship by investment",
      },
      {
        href: "/insurance",
        label: "Property Insurance",
        description: "DASK and the cover a deed transfer requires",
      },
    ],
  },
  { href: "/viewing-day", label: "Viewing Day" },
  { href: "/about", label: "About" },
  /*
    "Testimonials" ALTINCI ÖĞE — ve üst sınır burada.

    Bu dizinin altındaki not "header'ı altı öğede tutuyoruz" diyor;
    yedincisi masaüstünde satırı sıkıştırıyor. Sayfa o son yeri hak
    ediyor: sosyal kanıt, dönüşüm hunisinde "About"un hemen yanında
    duruyor ve footer'a gömülürse ziyaretçinin karar anında görmediği
    bir sayfa olur.
  */
  { href: "/testimonials", label: "Testimonials" },
  { href: "/contact", label: "Contact" },
];

/**
 * İkincil gezinme — footer'daki "Guides" sütunu.
 *
 * Header'ı altı öğede tutuyoruz: yedinci öğe masaüstünde satırı sıkıştırır ve
 * tıklama oranını düşürür. Ama bu sayfaların HİÇBİR yerden link almaması
 * daha kötü olurdu: dahili linki olmayan sayfa Google için pratikte yetim
 * kalır. Footer her sayfada göründüğü için tarama derinliğini 1'de tutar.
 */
export const guidesNav = [
  { href: "/buying-process", label: "Buying Process" },
  { href: "/selling-process", label: "Selling Process" },
  { href: "/citizenship", label: "Turkish Citizenship" },
  { href: "/insurance", label: "Property Insurance" },
  { href: "/viewing-day", label: "Viewing Trips" },
  { href: "/blog", label: "Insights & Guides" },
] as const;

/**
 * Slug -> ServiceArea. Kartlar bölge adını buradan okur: villa kaydındaki
 * `location.area` alanı taşımadan geldiği için boş olabilir, `areaSlug` ise
 * her zaman dolu ve serviceAreas ile eşleşiyor.
 */
export function getServiceArea(slug: string): ServiceArea | undefined {
  return serviceAreas.find((area) => area.slug === slug);
}

/**
 * "Ovacık, Fethiye" — ama ASLA "Fethiye, Fethiye".
 *
 * ⚠️ BU FONKSİYON "Fethiye Merkez" → "Fethiye" ADLANDIRMASIYLA BİRLİKTE
 * DOĞDU. Önceden bölge adı ilçe adından her zaman farklıydı, dolayısıyla
 * `${area}, ${district}` şablonu her kayıtta doğru sonuç veriyordu.
 * "Merkez" düşünce fethiye-centre bölgesinin adı ilçe adıyla aynı hâle
 * geldi ve o şablon on bir ilanda birden "Fethiye, Fethiye" yazmaya
 * başladı — kart etiketinde, ilan başlığının üstünde ve harita
 * açıklamasında.
 *
 * Kontrolü tek bir yere koymanın sebebi: aynı birleştirme üç ayrı dosyada
 * yapılıyordu. Üçünü ayrı ayrı düzeltmek, dördüncüsü eklendiğinde hatanın
 * geri gelmesi demekti.
 */
/**
 * İLÇENİN KENDİSİ OLAN BÖLGE.
 *
 * `serviceAreas` içindeki bölgelerin hepsi Fethiye ilçesinin BİR PARÇASI;
 * biri ise ilçenin kendisi. Ad karşılaştırmasıyla ("Fethiye" === "Fethiye")
 * bulmak Rusça'da çalışmıyor: bölge adları çevrilmiyor ama arayüzdeki ilçe
 * adı çevriliyor ("Фетхие"). Slug alfabeden bağımsız olduğu için doğru
 * karşılaştırma noktası o.
 */
export const DISTRICT_AREA_SLUG = "fethiye-centre";

export function formatAreaLabel(
  areaName: string | undefined,
  district: string,
): string {
  const name = areaName?.trim();

  if (!name) return district;
  return name === district ? name : `${name}, ${district}`;
}
