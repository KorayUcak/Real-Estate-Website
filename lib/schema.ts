import type {
  AboutPage,
  Blog,
  BlogPosting,
  BreadcrumbList,
  ContactPage,
  FAQPage,
  HowTo,
  ItemList,
  Organization,
  Place,
  Product,
  RealEstateAgent,
  RealEstateListing,
  Service,
  WebSite,
  WithContext,
} from "schema-dts";
import { contact, getServiceArea, siteConfig, SITE_URL } from "@/lib/site";
import { socialProfileList, type SiteSettings } from "@/lib/settings";
import { safeMapCoordinates } from "@/lib/villa-format";
import type { Post, Villa } from "@/lib/types";

/**
 * Kalıcı @id'ler: aynı varlığa farklı sayfalardan atıf yapabilmek için.
 * Google bu sayede "ajans", "web sitesi" ve "ilan" düğümlerini tek bir
 * bilgi grafiğinde birleştirir — kopuk schema parçalarından çok daha güçlüdür.
 */
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/**
 * ÇEKİRDEK SATIŞ BÖLGELERİ — ajansın gerçekten çalıştığı altı yer.
 *
 * `serviceAreas` on ikiden fazla bölge taşıyor (Kalkan, Dalaman, Bekçiler...);
 * hepsini `areaServed` içine dökmek sinyali seyreltir. Buradaki altısı,
 * markanın uzmanlık iddiasını taşıdığı çekirdek — /about-turkey sayfasında
 * her birinin koordinatlı bir `Place` düğümü zaten var.
 *
 * Slug listesi elle yazılıyor ama İSİMLER `serviceAreas`ten okunuyor:
 * bölge adı bir yerde değişirse schema sessizce eskimez.
 */
const CORE_AREA_SLUGS = [
  "fethiye-centre",
  "oludeniz",
  "calis",
  "hisaronu",
  "ovacik",
  "uzumlu",
] as const;

/**
 * `@id`, /about-turkey'deki `areaPlaceSchema` düğümleriyle AYNI.
 *
 * Bu tekrar değil, birleştirme: Google ve LLM'ler aynı @id'yi taşıyan
 * düğümleri tek varlıkta toplar. Sonuç — "Ölüdeniz" burada ajansın hizmet
 * bölgesi, orada koordinatı ve adresi olan bir yer; ikisi tek kayıt olur.
 * Adı ayrıca yazıyoruz ki düğüm bu sayfada tek başına da anlamlı olsun.
 */
function coreAreasServed() {
  return CORE_AREA_SLUGS.flatMap((slug) => {
    const area = getServiceArea(slug);

    if (!area) return [];

    return [
      {
        "@type": "Place" as const,
        "@id": `${SITE_URL}/about-turkey#area-${slug}`,
        name: `${area.name}, Fethiye, Muğla, Türkiye`,
      },
    ];
  });
}

/**
 * Kurumsal düğüm. `settings` ZORUNLU parametre: NAP (Name/Address/Phone)
 * tutarlılığı yerel SEO'nun temel sinyali ve ekranda görünen adresle
 * schema.org'a yazılan adresin ayrışması, o sinyali doğrudan bozar.
 * Sabitten okusaydı panelden yapılan her adres değişikliği bu ikisini
 * sessizce çelişkiye düşürürdü.
 */
export function organizationSchema(
  settings: SiteSettings,
): WithContext<RealEstateAgent> {
  const { contact: c, social: _social, companyName } = settings;
  void _social;

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": ORG_ID,
    /**
     * `name` ekranda görünen adla BİREBİR aynı kalmalı (NAP tutarlılığı) ve
     * bu yüzden panelden gelen `companyName`i kullanıyor. Bitişik yazım
     * `alternateName` olarak duruyor — bkz. siteConfig.alternateName.
     */
    name: companyName,
    alternateName: siteConfig.alternateName,
    legalName: siteConfig.legalName,
    url: `${SITE_URL}/`,
    /** Uzun varlık tanımı; meta açıklama ayrı alandır (siteConfig.description). */
    description: siteConfig.profileDescription,
    image: `${SITE_URL}/opengraph-image`,
    logo: `${SITE_URL}/logo.png`,
    foundingDate: siteConfig.founded,
    telephone: c.phoneE164,
    email: c.email,
    priceRange: "£££",
    currenciesAccepted: "GBP, TRY, EUR",
    address: {
      "@type": "PostalAddress",
      streetAddress: c.address.street,
      addressLocality: c.address.district,
      addressRegion: c.address.city,
      addressCountry: c.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: contact.geo.latitude,
      longitude: contact.geo.longitude,
    },
    /**
     * İki ayrı soruya cevap veriyor ve ikisi de gerekli:
     *
     *   NEREDE MÜLK SATIYORUZ → Fethiye ve altı çekirdek mahalle/bölge.
     *     Yerel aramanın ve "Ölüdeniz'de villa" tipi sorguların okuduğu yer
     *     burası; ilçe adlarını tek tek saymak, tek bir "Fethiye" satırının
     *     veremeyeceği çözünürlükte bir sinyal.
     *   MÜŞTERİ NEREDEN GELİYOR → dünya geneli. Tek bir ülkeyi (eskiden
     *     "United Kingdom") saymak uluslararası alıcıya bakan bir siteye
     *     dar bir sinyaldi.
     */
    areaServed: [
      { "@type": "AdministrativeArea", name: "Fethiye, Muğla, Türkiye" },
      ...coreAreasServed(),
      { "@type": "Country", name: "Türkiye" },
      { "@type": "Place", name: "Worldwide" },
    ],
    /**
     * BCP 47 etiketleri, çıplak dil kodları değil: "en" İngilizceyi
     * söyler, "en-GB" hangi İngilizceyi konuştuğumuzu da söyler. Bir
     * İngiliz alıcının aradığı sinyal ikincisi. Üçlü, başlıktaki dil
     * seçicisiyle aynı (bkz. lib/locale.ts).
     */
    knowsLanguage: ["en-GB", "tr-TR", "ru-RU"],
    /**
     * UZMANLIK ALANLARI.
     *
     * `knowsAbout` bir anahtar kelime çöplüğü değil, varlığın neyde yetkin
     * olduğunu söyleyen alan — LLM'ler bir soruyu kime bağlayacağına
     * karar verirken tam olarak buna bakar. Bu yüzden dört madde, arama
     * terimi gibi değil, gerçek uzmanlık iddiası gibi yazılı.
     */
    knowsAbout: [
      "Fethiye Luxury Real Estate",
      "UK Expat property investment in Turkey",
      "Turkish Title Deed Process for Foreigners",
      "Holiday Homes Fethiye",
    ],
    /*
      HEDEF KİTLE NEDEN AYRI BİR ALANDA DEĞİL:
      schema.org'da `audience`, Organization (dolayısıyla RealEstateAgent)
      üzerinde TANIMLI DEĞİL — CreativeWork, Product ve Service taşır.
      Uydurma bir alan eklemek düğümü doğrulamadan düşürür ve okuyan taraf
      tüm bloğu güvenilmez sayabilir. UK expat / yabancı yatırımcı / premium
      Türk alıcı üçlüsü bu yüzden `description` içinde, düz cümle olarak
      duruyor; hizmet bazında kitle gerekirse doğru yer `serviceSchema`.
    */
    sameAs: socialProfileList(settings),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      telephone: c.phoneE164,
      email: c.email,
      /* Satış kanalının dilleri, başlıktaki dil seçicisiyle aynı üçlü. */
      availableLanguage: ["English", "Turkish", "Russian"],
      /* Ülke kodu listesi kaldırıldı: "GB" tek bir pazara işaret ediyordu
         ve alan zaten üstteki Organization.areaServed ile karşılanıyor. */
    },
  };
}

export function websiteSchema(): WithContext<WebSite> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: siteConfig.name,
    inLanguage: "en-GB",
    publisher: { "@id": ORG_ID } as Organization,
  };
}

/**
 * Öne çıkan villalar için ItemList. Ana sayfada tek tek Product basmak yerine
 * sıralı bir liste vermek, Google'ın hangi ilanın öne çıktığını anlamasını sağlar;
 * fiyat/stok detayı ilanın kendi sayfasındaki Product schema'sına bırakılır.
 */
export function featuredListSchema(villas: Villa[]): WithContext<ItemList> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Featured luxury villas for sale in Fethiye",
    numberOfItems: villas.length,
    itemListElement: villas.map((villa, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SITE_URL}/properties/${villa.slug}`,
      name: villa.title,
    })),
  };
}

export function faqSchema(
  faqs: { question: string; answer: string }[],
): WithContext<FAQPage> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

export function breadcrumbSchema(
  crumbs: { name: string; path: string }[],
): WithContext<BreadcrumbList> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path}`,
    })),
  };
}

/**
 * Herhangi bir liste sayfası (tüm ilanlar, bölgeler) için ItemList.
 * `featuredListSchema` ana sayfaya özgü kalsın diye ayrı tutuldu.
 */
export function itemListSchema(
  name: string,
  items: { url: string; name: string }[],
): WithContext<ItemList> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SITE_URL}${item.url}`,
      name: item.name,
    })),
  };
}

/** İlan durumu → schema.org ItemAvailability karşılığı. */
function availabilityFor(status: Villa["status"]) {
  switch (status) {
    case "for-sale":
      return "https://schema.org/InStock" as const;
    case "reserved":
      return "https://schema.org/PreOrder" as const;
    default:
      return "https://schema.org/SoldOut" as const;
  }
}

/**
 * İlan sayfası için iki tamamlayıcı düğüm üretilir:
 *
 * 1. `Product` — fiyatı, para birimini, stok durumunu ve ilan kodunu taşıyan
 *    düğüm. Fiyat bilgisini schema.org'da `Offer` üzerinden ifade etmenin
 *    tek geçerli yolu budur; `Residence` tipinin `offers` alanı yoktur.
 * 2. `RealEstateListing` — sayfanın kendisi. Fiziksel nitelikler (oda sayısı,
 *    m², konum) semantik olarak doğru yerde, `SingleFamilyResidence` içinde durur.
 *
 * Bölmenin sebebi: tek bir tipe hem fiyat hem emlak niteliği sıkıştırmak
 * schema.org sözleşmesini ihlal eder, ikisi birlikte ise hem doğrulanır
 * hem de arama motoruna eksiksiz bilgi verir.
 */
export function villaProductSchema(villa: Villa): WithContext<Product> {
  const url = `${SITE_URL}/properties/${villa.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: villa.title,
    description: villa.seo.description,
    sku: villa.reference,
    category: villa.propertyType,
    image: villa.images.map((image) => `${SITE_URL}${image.src}`),
    brand: { "@id": ORG_ID } as Organization,
    offers: {
      "@type": "Offer",
      url,
      price: villa.price.gbp,
      priceCurrency: villa.price.currency,
      availability: availabilityFor(villa.status),
      seller: { "@id": ORG_ID } as Organization,
      /** Fiyatın ne zamana kadar geçerli sayılacağı — bir yıl makul bir ufuk. */
      priceValidUntil: `${new Date(villa.updatedAt).getFullYear() + 1}-12-31`,
    },
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Title deed status",
        value: villa.deedStatus,
      },
      {
        "@type": "PropertyValue",
        name: "Citizenship eligible",
        value: villa.citizenshipEligible ? "Yes" : "No",
      },
      {
        "@type": "PropertyValue",
        name: "Plot size",
        value: `${villa.plotSizeSqm} m²`,
      },
    ],
  };
}

export function villaListingSchema(
  villa: Villa,
): WithContext<RealEstateListing> {
  const url = `${SITE_URL}/properties/${villa.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": `${url}#listing`,
    url,
    name: villa.seo.title,
    description: villa.seo.description,
    datePosted: villa.publishedAt,
    dateModified: villa.updatedAt,
    inLanguage: "en-GB",
    isPartOf: { "@id": WEBSITE_ID } as WebSite,
    provider: { "@id": ORG_ID } as Organization,
    mainEntity: {
      "@type": "SingleFamilyResidence",
      name: villa.title,
      numberOfRooms: villa.bedrooms,
      numberOfBedrooms: villa.bedrooms,
      numberOfBathroomsTotal: villa.bathrooms,
      numberOfFullBathrooms: villa.bathrooms,
      floorSize: {
        "@type": "QuantitativeValue",
        value: villa.buildSizeSqm,
        /** UN/CEFACT kodu: MTK = metrekare. Birimi yazıyla yazmak belirsiz kalır. */
        unitCode: "MTK",
      },
      photo: villa.images.map((image) => ({
        "@type": "ImageObject",
        url: `${SITE_URL}${image.src}`,
        caption: image.alt,
        width: String(image.width),
        height: String(image.height),
      })),
      address: {
        "@type": "PostalAddress",
        addressLocality: villa.location.district,
        addressRegion: villa.location.region,
        addressCountry: "TR",
      },
      /*
        GEO YALNIZCA GÜVENLİ KOORDİNATLA.

        Taşınan 57 ilanın 21'i Houzez'in varsayılan pin'i ile geldi:
        25.68654, -80.431345 — yani MIAMI, FLORIDA. Bu değeri Product/
        Residence schema'sına basmak, Google'a mülkün Florida'da olduğunu
        beyan etmek demektir; hem yerel sıralamayı bozar hem de yanlış
        beyandır.

        `safeMapCoordinates` gerçek koordinat yoksa bölge merkezini döner,
        o da yoksa null — bu durumda `geo` alanı hiç yazılmaz.
      */
      ...(() => {
        const point = safeMapCoordinates(villa);
        return point
          ? {
              geo: {
                "@type": "GeoCoordinates" as const,
                latitude: point.lat,
                longitude: point.lng,
              },
            }
          : {};
      })(),
      amenityFeature: villa.features.map((feature) => ({
        "@type": "LocationFeatureSpecification",
        name: feature,
        value: true,
      })),
    },
  };
}

/**
 * Bölgeyi coğrafi bir varlık olarak tanımlar.
 * /about-turkey sayfasındaki her bölge bölümü için bir düğüm üretilir; `@id`
 * o bölümün çapasını işaret eder, böylece varlık ile sayfadaki içerik eşleşir.
 */
export function areaPlaceSchema(area: {
  name: string;
  slug: string;
  blurb: string;
  coordinates?: { lat: number; lng: number };
}): WithContext<Place> {
  return {
    "@context": "https://schema.org",
    "@type": "Place",
    "@id": `${SITE_URL}/about-turkey#area-${area.slug}`,
    name: `${area.name}, Fethiye`,
    description: area.blurb,
    /** Yerel aramanın okuduğu sinyal: bölgeyi haritada bir noktaya bağlar. */
    ...(area.coordinates
      ? {
          geo: {
            "@type": "GeoCoordinates" as const,
            latitude: area.coordinates.lat,
            longitude: area.coordinates.lng,
          },
        }
      : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: "Fethiye",
      addressRegion: "Muğla",
      addressCountry: "TR",
    },
  };
}

export function aboutPageSchema(
  description: string,
): WithContext<AboutPage> {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${SITE_URL}/about#webpage`,
    url: `${SITE_URL}/about`,
    name: `About ${siteConfig.name}`,
    description,
    inLanguage: "en-GB",
    isPartOf: { "@id": WEBSITE_ID } as WebSite,
    about: { "@id": ORG_ID } as Organization,
  };
}

export function contactPageSchema(
  description: string,
): WithContext<ContactPage> {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${SITE_URL}/contact#webpage`,
    url: `${SITE_URL}/contact`,
    name: `Contact ${siteConfig.name}`,
    description,
    inLanguage: "en-GB",
    isPartOf: { "@id": WEBSITE_ID } as WebSite,
    about: { "@id": ORG_ID } as Organization,
  };
}

/**
 * Adım adım rehber sayfaları için HowTo.
 * Not: Google, HowTo zengin sonuçlarını 2023'te masaüstünde de kaldırdı —
 * yani bu markup görsel bir SERP kazancı getirmez. Yine de geçerli schema.org
 * sözlüğüdür ve sayfanın "bir süreci adım adım anlattığı" bilgisini
 * makineye açıkça verir; bu da entity anlayışı açısından değerlidir.
 */
export function howToSchema(input: {
  name: string;
  description: string;
  path: string;
  totalTime?: string;
  steps: { title: string; body: string }[];
}): WithContext<HowTo> {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "@id": `${SITE_URL}${input.path}#howto`,
    name: input.name,
    description: input.description,
    inLanguage: "en-GB",
    ...(input.totalTime ? { totalTime: input.totalTime } : {}),
    step: input.steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.title,
      text: step.body,
      url: `${SITE_URL}${input.path}#step-${index + 1}`,
    })),
  };
}

/**
 * Sigorta gibi hizmet sayfaları için Service düğümü.
 * `provider` kök layout'taki RealEstateAgent düğümüne @id ile bağlanır —
 * hizmeti sunanın kim olduğu tekrar tanımlanmaz, referans verilir.
 */
export function serviceSchema(input: {
  name: string;
  description: string;
  path: string;
  serviceType: string;
  /** Hizmetin alt kalemleri — "DASK", "Buildings", "Contents" gibi. */
  offers?: { name: string; description: string }[];
}): WithContext<Service> {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${SITE_URL}${input.path}#service`,
    name: input.name,
    description: input.description,
    serviceType: input.serviceType,
    provider: { "@id": ORG_ID } as Organization,
    areaServed: [
      { "@type": "AdministrativeArea", name: "Fethiye, Muğla, Türkiye" },
      { "@type": "Country", name: "Türkiye" },
    ],
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: `${SITE_URL}${input.path}`,
      /** schema.org'da `servicePhone` düz metin değil, bir ContactPoint bekler. */
      servicePhone: {
        "@type": "ContactPoint",
        contactType: "sales",
        telephone: contact.phoneE164,
        email: contact.email,
        availableLanguage: ["English", "Turkish", "Russian"],
      },
    },
    ...(input.offers?.length
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: input.name,
            itemListElement: input.offers.map((offer) => ({
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: offer.name,
                description: offer.description,
              },
            })),
          },
        }
      : {}),
  };
}

/**
 * Blog yazısı düğümü.
 *
 * `author` olarak kurum düğümü kullanılıyor (uydurma bir yazar adı değil).
 * `mainEntityOfPage` yazının kanonik URL'ini işaret eder — aynı içerik başka
 * bir yerde alıntılandığında asıl kaynağın hangisi olduğunu belirler.
 */
export function blogPostingSchema(post: Post): WithContext<BlogPosting> {
  const url = `${SITE_URL}/blog/${post.slug}`;

  /** Gövdedeki düz metin ~ kelime sayısı: Google için içerik derinliği sinyali. */
  const wordCount = post.body.reduce((total, block) => {
    if (block.type === "paragraph" || block.type === "quote") {
      return total + block.text.split(/\s+/).length;
    }
    if (block.type === "list") {
      return total + block.items.join(" ").split(/\s+/).length;
    }
    return total;
  }, 0);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#post`,
    mainEntityOfPage: url,
    url,
    headline: post.title,
    description: post.excerpt,
    articleSection: post.category,
    keywords: post.seo.keywords.join(", "),
    wordCount,
    inLanguage: "en-GB",
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { "@id": ORG_ID } as Organization,
    publisher: { "@id": ORG_ID } as Organization,
    isPartOf: { "@id": `${SITE_URL}/blog#blog` } as Blog,
    image: {
      "@type": "ImageObject",
      url: `${SITE_URL}${post.image.src}`,
      caption: post.image.alt,
      width: String(post.image.width),
      height: String(post.image.height),
    },
  };
}

/** /blog liste sayfası — yazıları tek bir Blog düğümü altında toplar. */
export function blogSchema(posts: Post[]): WithContext<Blog> {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${SITE_URL}/blog#blog`,
    url: `${SITE_URL}/blog`,
    name: `${siteConfig.name} — property insights`,
    description:
      "Guides and market notes on buying, selling and owning property in Fethiye, Ölüdeniz and Göcek.",
    inLanguage: "en-GB",
    publisher: { "@id": ORG_ID } as Organization,
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      "@id": `${SITE_URL}/blog/${post.slug}#post`,
      headline: post.title,
      url: `${SITE_URL}/blog/${post.slug}`,
      datePublished: post.publishedAt,
    })),
  };
}
