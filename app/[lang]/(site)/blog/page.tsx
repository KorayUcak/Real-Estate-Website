import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { InlineCta } from "@/components/inline-cta";
import { PageHero } from "@/components/page-hero";
import { imagery } from "@/lib/imagery";
import { PostCard } from "@/components/post-card";
import { getAllPosts, getPostCategories } from "@/lib/posts";
import { blogSchema, breadcrumbSchema } from "@/lib/schema";
import { currentLocale } from "@/lib/current-locale";
import { getT } from "@/lib/i18n/server";
import { HOME_CRUMB, pageMetadata, type Crumb } from "@/lib/seo";


const CRUMBS: Crumb[] = [HOME_CRUMB, { name: "Blog", path: "/blog" }];

export async function generateMetadata(): Promise<Metadata> {
  const locale = await currentLocale();
  const t = await getT();

  return pageMetadata({
    title: t("blog.metaTitle"),
    description: t("blog.lede"),
    path: "/blog",
    locale,
    keywords: [
      "Fethiye property blog",
      "buying property in Turkey guide",
      "Turkey real estate news",
      "Ölüdeniz property advice",
      "Fethiye market insights",
    ],
  });
}

export default async function BlogPage() {
  const t = await getT();
  const posts = getAllPosts();
  const categories = getPostCategories();

  /**
   * İlk yazı öne çıkan (yatay, büyük) kart olarak render edilir; kalanlar
   * ızgaraya girer. Tek bir listede iki farklı görsel ağırlık kullanmak,
   * okura nereden başlayacağını söyler — hepsi eşit boyuttayken hiçbiri öne çıkmaz.
   */
  const [lead, ...rest] = posts;

  return (
    <>
      <JsonLd schema={[blogSchema(posts), breadcrumbSchema(CRUMBS)]} />

      <main id="main">
        <PageHero
          eyebrow={t("blog.eyebrow")}
          title={t("blog.heading")}
          lede={t("blog.lede")}
          crumbs={CRUMBS}
          image={{
            ...imagery.blog,
            /* Alt metni çeviriden: erişilebilirlik ve görsel arama
               sinyali sayfanın diliyle aynı olmalı. */
            alt: t("imagery.named.blog"),
          }}
        >
          {categories.length > 1 ? (
            <ul className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <li
                  key={category}
                  className="border border-line bg-shell px-5 py-2 text-xs uppercase tracking-widest text-ink-40"
                >
                  {category}
                </li>
              ))}
            </ul>
          ) : null}
        </PageHero>

        {/* --------------------------------------------------------- YAZILAR */}
        <section aria-labelledby="posts-heading" className="bg-shell py-section">
          <div className="container-page">
            <h2 id="posts-heading" className="sr-only">
              {t("blog.allArticles")}
            </h2>

            {posts.length > 0 ? (
              <>
                {/* Öne çıkan yazı */}
                <PostCard post={lead} priority featured />

                {rest.length > 0 ? (
                  <ul className="mt-24 grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
                    {rest.map((post) => (
                      <li key={post.id}>
                        <PostCard post={post} />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : (
              <p className="max-w-lg text-lg leading-relaxed text-ink-70">
                {t("blog.empty")}
            </p>
            )}
          </div>
        </section>

        {/* ------------------------------------------------------------- CTA */}
        <section className="bg-shell pb-section">
          <div className="container-page">
            <InlineCta
              title={t("blog.ctaHeading")}
              text={t("blog.listCtaText")}
              ctaLabel={t("properties.register")}
              whatsappMessage={t("blog.listCtaWhatsapp")}
            />
          </div>
        </section>
      </main>
    </>
  );
}
