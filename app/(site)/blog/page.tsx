import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { InlineCta } from "@/components/inline-cta";
import { PageHero } from "@/components/page-hero";
import { imagery } from "@/lib/imagery";
import { PostCard } from "@/components/post-card";
import { getAllPosts, getPostCategories } from "@/lib/posts";
import { blogSchema, breadcrumbSchema } from "@/lib/schema";
import { HOME_CRUMB, pageMetadata, type Crumb } from "@/lib/seo";

const PAGE_TITLE = "Fethiye Property Insights & Buying Guides";
const PAGE_DESCRIPTION =
  "Guides, market notes and straight answers on buying, selling and owning property in Fethiye, Ölüdeniz and Göcek — written by the people who handle the purchases.";

const CRUMBS: Crumb[] = [HOME_CRUMB, { name: "Blog", path: "/blog" }];

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: "/blog",
    keywords: [
      "Fethiye property blog",
      "buying property in Turkey guide",
      "Turkey real estate news",
      "Ölüdeniz property advice",
      "Fethiye market insights",
    ],
  });
}

export default function BlogPage() {
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
          eyebrow="Insights"
          title="Notes from the Fethiye property market"
          lede="No recycled press releases and no market hype. These are the things we end up explaining on the phone every week — written down properly so you can read them before we speak."
          crumbs={CRUMBS}
          image={imagery.blog}
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
              All articles
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
                The first articles are being written. In the meantime, the buying
                and selling process guides cover the questions we are asked most.
              </p>
            )}
          </div>
        </section>

        {/* ------------------------------------------------------------- CTA */}
        <section className="bg-shell pb-section">
          <div className="container-page">
            <InlineCta
              title="Reading is a good start. A shortlist is better."
              text="Tell us your budget, your timeline and how you plan to use the property. We will come back with what actually fits — and what to avoid."
              ctaLabel="Register your requirements"
              whatsappMessage="Hello Coast 2 Coast — I've been reading your guides and I'd like to talk about buying in Fethiye."
            />
          </div>
        </section>
      </main>
    </>
  );
}
