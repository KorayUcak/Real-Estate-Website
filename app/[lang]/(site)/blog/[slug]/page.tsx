import type { Metadata } from "next";
import Image from "next/image";
import { LocaleLink as Link } from "@/components/locale-link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock, RefreshCw } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { InlineCta } from "@/components/inline-cta";
import { JsonLd } from "@/components/json-ld";
import { PostBody } from "@/components/post-body";
import { PostCard } from "@/components/post-card";
import {
  formatPostDate,
  getAllPostSlugs,
  getPostBySlug,
  getPostHeadings,
  getRelatedPosts,
  splitBodyForCta,
} from "@/lib/posts";
import { blogPostingSchema, breadcrumbSchema } from "@/lib/schema";
import { currentLocale } from "@/lib/current-locale";
import { getT } from "@/lib/i18n/server";
import { HOME_CRUMB, pageMetadata, type Crumb } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

/** Tüm yazılar build anında üretilir. */
export function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata(
  props: PageProps<"/[lang]/blog/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const post = getPostBySlug(slug);

  if (!post) {
    const locale = await currentLocale();
  const t = await getT();

  return pageMetadata({
      title: t("blog.notFoundTitle"),
      description:
        "This article is no longer available. Browse our latest guides on buying property in Fethiye.",
      path: "/blog",
      locale,
      noIndex: true,
    });
  }

  return pageMetadata({
    title: post.seo.title,
    description: post.seo.description,
    path: `/blog/${post.slug}`,
    keywords: post.seo.keywords,
    images: [
      {
        url: post.image.src,
        alt: post.image.alt,
        width: post.image.width,
        height: post.image.height,
      },
    ],
    /** Blog yazısı = article: og:published_time ve og:modified_time eklenir. */
    type: "article",
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
  });
}

export default async function BlogPostPage(props: PageProps<"/[lang]/blog/[slug]">) {
  const t = await getT();
  const { slug } = await props.params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  const crumbs: Crumb[] = [
    HOME_CRUMB,
    { name: "Blog", path: "/blog" },
    { name: post.title, path: `/blog/${post.slug}` },
  ];

  /** CTA bandı, ortaya en yakın başlığın önüne yerleşir (bkz. splitBodyForCta). */
  const [bodyBeforeCta, bodyAfterCta] = splitBodyForCta(post.body);
  const headings = getPostHeadings(post);
  const relatedPosts = getRelatedPosts(post.slug);

  /** Güncelleme tarihi yayın tarihinden farklıysa okura göster — tazelik sinyali. */
  const wasUpdated = post.updatedAt !== post.publishedAt;

  return (
    <>
      <JsonLd schema={[blogPostingSchema(post), breadcrumbSchema(crumbs)]} />

      <main id="main">
        <div className="container-page pt-12">
          <Breadcrumbs crumbs={crumbs} />
        </div>

        {/*
          <article>: yazı kendi başına anlamlı, taşınabilir bir içerik birimi.
          Başlık bloğu <header>, künye <footer> — belge yapısı okuyucuya da
          arama motoruna da aynı hikâyeyi anlatır.
        */}
        <article>
          <header className="container-page pt-10">
            <p className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs uppercase tracking-widest text-sea">
              {post.category}
              <span className="inline-flex items-center gap-1.5 text-ink-40">
                <Clock className="size-3.5" aria-hidden="true" />
                {post.readingMinutes} min read
              </span>
            </p>

            {/* Sayfadaki tek H1. */}
            <h1 className="mt-7 max-w-4xl font-display text-3xl leading-[1.12] tracking-tight text-sea-deep sm:text-5xl">
              {post.title}
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-ink-70">
              {post.excerpt}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-7 text-sm text-ink-40">
              <span>
                By{" "}
                <Link
                  href="/about"
                  className="text-sea-deep underline-offset-4 hover:underline"
                >
                  {siteConfig.name}
                </Link>
              </span>
              <time dateTime={post.publishedAt}>
                {formatPostDate(post.publishedAt)}
              </time>
              {wasUpdated ? (
                <span className="inline-flex items-center gap-2">
                  <RefreshCw className="size-3.5" aria-hidden="true" />
                  Updated{" "}
                  <time dateTime={post.updatedAt}>
                    {formatPostDate(post.updatedAt)}
                  </time>
                </span>
              ) : null}
            </div>
          </header>

          {/* ------------------------------------------------------ KAPAK GÖRSELİ */}
          <div className="container-page mt-12">
            <div className="relative aspect-[16/9] overflow-hidden bg-shell-deep">
              <Image
                src={post.image.src}
                alt={post.image.alt}
                fill
                /* Sayfanın LCP öğesi — erken yüklenmesi gerekiyor. */
                priority
                quality={85}
                sizes="(min-width: 1024px) 82vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>

          {/* ------------------------------------------------ İÇERİK + YAN SÜTUN */}
          <div className="container-page grid gap-16 pb-section pt-20 lg:grid-cols-12">
            {/* İçindekiler — sticky, uzun yazılarda gezinmeyi kolaylaştırır. */}
            {headings.length > 2 ? (
              <aside
                aria-labelledby="toc-heading"
                className="lg:col-span-3 lg:order-2"
              >
                <div className="lg:sticky lg:top-28">
                  <h2
                    id="toc-heading"
                    className="eyebrow border-b border-line pb-4 text-ink-40"
                  >
                    {t("blog.inThisArticle")}
                  </h2>
                  <nav aria-labelledby="toc-heading">
                    <ol className="mt-5 space-y-3.5 text-sm">
                      {headings.map((heading) => (
                        <li key={heading.id}>
                          <a
                            href={`#${heading.id}`}
                            className="text-ink-70 underline-offset-4 transition-colors hover:text-sea-deep hover:underline"
                          >
                            {heading.text}
                          </a>
                        </li>
                      ))}
                    </ol>
                  </nav>
                </div>
              </aside>
            ) : null}

            <div
              className={
                headings.length > 2
                  ? "lg:col-span-8 lg:order-1"
                  : "lg:col-span-9"
              }
            >
              <PostBody blocks={bodyBeforeCta} />

              {/* CRO: yazının ortasında, doğal bir duraklama noktasında. */}
              {bodyAfterCta.length > 0 ? (
                <>
                  <InlineCta tone="soft" />
                  <PostBody blocks={bodyAfterCta} />
                </>
              ) : null}

              {/* CRO: yazının sonunda, okuma bittiğinde. */}
              <InlineCta
                title={t("blog.ctaProperties")}
                text={t("blog.postCtaText")}
                ctaLabel={t("viewingDay.finalPrimary")}
                ctaHref="/properties"
              />

              <footer className="mt-16 border-t border-line pt-8">
                <p className="text-xs leading-relaxed text-ink-40">
                  Written by {siteConfig.name}, a boutique international property
                  consultancy based in Fethiye. Guidance only, current at the time
                  of writing, and not legal or tax advice — we confirm the exact
                  position for your purchase in writing before you commit.
                </p>
              </footer>
            </div>
          </div>
        </article>

        {/* ----------------------------------------------------- İLGİLİ YAZILAR */}
        {relatedPosts.length > 0 ? (
          <section
            aria-labelledby="related-heading"
            className="border-t border-line bg-shell-deep py-section"
          >
            <div className="container-page">
              <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <h2
                  id="related-heading"
                  className="font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
                >
                  {t("blog.keepReading")}
                </h2>
                <Link
                  href="/blog"
                  className="group inline-flex shrink-0 items-center gap-2 text-sm text-sea-deep underline-offset-4 hover:underline"
                >
                  {t("blog.allArticles")}
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </header>

              <ul className="mt-14 grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
                {relatedPosts.map((related) => (
                  <li key={related.id}>
                    <PostCard post={related} />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}
      </main>
    </>
  );
}
