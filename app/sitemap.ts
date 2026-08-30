import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
import {
  DEFAULT_ROUTE_LOCALE,
  LANGUAGE_META,
  languageFromRoute,
  localizedPath,
  ROUTE_LOCALES,
} from "@/lib/locale";
import { SITE_URL } from "@/lib/site";
import { getAllVillas } from "@/lib/villas";

/**
 * Sitemap yalnızca GERÇEKTEN yayında olan rotaları içerir; var olmayan
 * URL'leri listelemek Search Console'da "soft 404" birikmesine ve tarama
 * bütçesinin boşa harcanmasına yol açar.
 *
 * `priority` mutlak bir sıralama sinyali değildir; Google için yalnızca
 * SİTE İÇİ göreli önem ipucudur. Bu yüzden değerler sayfa türüne göre
 * kademelendirildi: ana sayfa > ilanlar > rehberler > kurumsal sayfalar.
 */
/**
 * Kanonik (dilsiz) girdi. Dil çarpanı `expand()` içinde uygulanıyor —
 * girdileri üç kez elle yazmak, yeni bir sayfa eklendiğinde iki dilde
 * unutulması kesin olan bir tekrar olurdu.
 */
type Entry = {
  path: string;
  lastModified: Date;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

/**
 * Bir kanonik girdiyi ÜÇ dile açar ve her birine `alternates.languages` ekler.
 *
 * Sitemap'teki hreflang, sayfa <head>'indeki hreflang ile aynı bilgiyi
 * taşır ve Google ikisini de kabul eder. İkisini birden vermek fazlalık
 * değil: sitemap kümesi, sayfası henüz taranmamış dilleri de duyurur —
 * yeni eklenen /ru sayfaları keşfedilmek için /tr'nin taranmasını beklemez.
 */
function expand(entries: Entry[]): MetadataRoute.Sitemap {
  return entries.flatMap((entry) =>
    ROUTE_LOCALES.map((locale) => ({
      url: `${SITE_URL}${localizedPath(entry.path, locale)}`,
      lastModified: entry.lastModified,
      changeFrequency: entry.changeFrequency,
      /* İkincil dillerde bir kademe düşük: aynı sayfanın üç sürümüne
         birebir aynı ağırlığı vermek site içi önem sinyalini düzleştirir. */
      priority:
        locale === DEFAULT_ROUTE_LOCALE
          ? entry.priority
          : Math.round(entry.priority * 9) / 10,
      alternates: {
        languages: Object.fromEntries(
          ROUTE_LOCALES.map((alt) => [
            LANGUAGE_META[languageFromRoute(alt)].tag,
            `${SITE_URL}${localizedPath(entry.path, alt)}`,
          ]),
        ),
      },
    })),
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: Entry[] = [
    {
      path: "/",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      path: "/properties",
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      path: "/about-turkey",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      path: "/viewing-day",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      path: "/buying-process",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      path: "/selling-process",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      path: "/citizenship",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      path: "/insurance",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      path: "/blog",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      path: "/about",
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    /*
      Yorum sayfası `monthly`: içerik yeni bir değerlendirme geldikçe
      değişiyor, /about gibi yılda bir değil. Öncelik 0.6 — dönüşüme
      yakın bir sayfa, ama arama niyeti /properties kadar güçlü değil.
    */
    {
      path: "/testimonials",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      path: "/contact",
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    /*
      Hukuki sayfalar EN DÜŞÜK öncelikte ama listede — çünkü bu dosyanın
      sözleşmesi "gerçekten yayında olan rotalar", arama sonucu beklenen
      rotalar değil. Footer her sayfadan bunlara link veriyor; sitemap'te
      olmamaları, Google'ın site içi link grafiği ile beyan edilen harita
      arasında gereksiz bir tutarsızlık üretirdi. Ayrıca gizlilik ve
      koşullar sayfasının VARLIĞI bir güven sinyalidir.
    */
    {
      path: "/privacy-policy",
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      path: "/terms",
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  /** İlan sayfaları: `lastModified` gerçek güncelleme tarihinden gelir. */
  const villaRoutes: Entry[] = (await getAllVillas()).map((villa) => ({
    path: "/properties/${villa.slug}",
    lastModified: new Date(villa.updatedAt),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  /** Blog yazıları: `lastModified` gerçek güncelleme tarihinden gelir. */
  const postRoutes: Entry[] = getAllPosts().map((post) => ({
    path: "/blog/${post.slug}",
    lastModified: new Date(post.updatedAt),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return expand([...staticRoutes, ...villaRoutes, ...postRoutes]);
}
