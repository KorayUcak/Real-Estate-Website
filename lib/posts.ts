import postsJson from "@/data/posts.json";
import type { Post } from "@/lib/types";

/**
 * `lib/villas.ts` ile aynı desen: JSON import edildiği için veri build anında
 * modül grafiğine girer. Çalışma zamanında dosya sistemi okuması yoktur ve
 * tüm blog sayfaları statik üretilebilir. CMS eklenirse yalnızca bu dosya değişir.
 */
const posts = postsJson as Post[];

/** Yayın tarihine göre yeniden eskiye — blog listesinin doğal sırası. */
function byNewest(a: Post, b: Post): number {
  return (
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getAllPosts(): Post[] {
  return [...posts].sort(byNewest);
}

export function getPostBySlug(slug: string): Post | undefined {
  return posts.find((post) => post.slug === slug);
}

/** generateStaticParams için — tüm yazı sayfaları build anında üretilir. */
export function getAllPostSlugs(): string[] {
  return posts.map((post) => post.slug);
}

/**
 * Yazının altındaki "devamını okuyun" bloğu. Kendisi hariç, en yeni yazılar.
 */
export function getRelatedPosts(slug: string, limit = 2): Post[] {
  return getAllPosts()
    .filter((post) => post.slug !== slug)
    .slice(0, limit);
}

/**
 * Yazı gövdesini, ortaya CTA bandı yerleştirmek için ikiye böler.
 *
 * Sabit bir indeksten kesmek bir bölümü ortasından ikiye ayırır ve okuma
 * akışını bozar. Bunun yerine ortaya EN YAKIN BAŞLIĞIN önünden kesiyoruz:
 * banner iki bölüm arasındaki doğal duraklamaya denk gelir.
 *
 * Başlık yoksa (çok kısa yazı) bölme yapılmaz ve CTA yalnızca sona eklenir.
 */
export function splitBodyForCta(body: Post["body"]): [Post["body"], Post["body"]] {
  const middle = body.length / 2;

  const headingIndexes = body
    .map((block, index) => (block.type === "heading" ? index : -1))
    .filter((index) => index > 0);

  if (headingIndexes.length === 0) return [body, []];

  const cutAt = headingIndexes.reduce((closest, index) =>
    Math.abs(index - middle) < Math.abs(closest - middle) ? index : closest,
  );

  return [body.slice(0, cutAt), body.slice(cutAt)];
}

/** İçindekiler tablosu — gövdedeki başlıkları sırayla çıkarır. */
export function getPostHeadings(post: Post): { id: string; text: string }[] {
  return post.body
    .filter((block) => block.type === "heading")
    .map((block) => ({ id: block.id, text: block.text }));
}

/** Kategori filtresi rozetleri için benzersiz kategori listesi. */
export function getPostCategories(): string[] {
  return [...new Set(posts.map((post) => post.category))].sort();
}

/**
 * Tarihleri her yerde aynı biçimde yazdırmak için tek nokta.
 * en-GB: "14 July 2026" — İngiliz okuyucu için doğal olan sıra.
 */
export function formatPostDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
