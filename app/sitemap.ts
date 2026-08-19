import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
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
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/properties`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/about-turkey`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/viewing-day`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/buying-process`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/selling-process`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/citizenship`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/insurance`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.6,
    },
  ];

  /** İlan sayfaları: `lastModified` gerçek güncelleme tarihinden gelir. */
  const villaRoutes: MetadataRoute.Sitemap = (await getAllVillas()).map((villa) => ({
    url: `${SITE_URL}/properties/${villa.slug}`,
    lastModified: new Date(villa.updatedAt),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  /** Blog yazıları: `lastModified` gerçek güncelleme tarihinden gelir. */
  const postRoutes: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...villaRoutes, ...postRoutes];
}
