import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Compass,
  Eye,
  Handshake,
  MessageCircle,
  Scale,
  ShieldCheck,
  Target,
} from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { imagery } from "@/lib/imagery";
import { getSettings, whatsappHref } from "@/lib/settings";
import { PageHero } from "@/components/page-hero";
import { aboutPageSchema, breadcrumbSchema } from "@/lib/schema";
import { HOME_CRUMB, pageMetadata, type Crumb } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

const PAGE_TITLE = "About Us — A Boutique Property Consultancy in Fethiye";
const PAGE_DESCRIPTION =
  "Coast 2 Coast Properties Turkey is a boutique international property consultancy based in Fethiye. We take on fewer listings, represent the buyer properly, and stay reachable long after the title deed is signed.";

const CRUMBS: Crumb[] = [HOME_CRUMB, { name: "About", path: "/about" }];

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: "/about",
    keywords: [
      "Fethiye estate agent",
      "English speaking estate agent Turkey",
      "Coast 2 Coast Properties Turkey",
      "buying property in Turkey advice",
    ],
  });
}

const PRINCIPLES = [
  {
    icon: Scale,
    title: "We represent you, not the seller",
    body: "Your solicitor is instructed by you and is independent of us. We will never recommend the seller's lawyer, and we will tell you when a deal is not worth doing — including when the property is one of ours.",
  },
  {
    icon: Eye,
    title: "Nothing is signed in a language you cannot read",
    body: "Every reservation contract, valuation report and registry document is translated in full before you sign. A sworn translator attends the title deed appointment as a matter of course, not on request.",
  },
  {
    icon: Handshake,
    title: "One named contact, start to finish",
    body: "You are not handed between a sales team, a legal team and an aftercare team. The person who meets you at Dalaman is the person who answers the phone in February.",
  },
  {
    icon: ShieldCheck,
    title: "We say no more often than yes",
    body: "Properties with unresolved title, missing habitation certificates or optimistic pricing do not make it onto this site. A short portfolio is the point, not a limitation.",
  },
];

const NOT_DOING = [
  "We do not run coach tours where eight buyers view the same villa and are pressured to reserve on the day.",
  "We do not take a commission from a developer to steer you towards a specific project.",
  "We do not quote a headline price and reveal the 6–8% of purchase costs after you have committed.",
  "We do not disappear once the title deed transfers — the fifth year of ownership matters as much as the first.",
];

export default async function AboutPage() {
  const settings = await getSettings();
  return (
    <>
      <JsonLd
        schema={[aboutPageSchema(PAGE_DESCRIPTION), breadcrumbSchema(CRUMBS)]}
      />

      <main id="main">
        <PageHero
          eyebrow={`Boutique consultancy · Fethiye · since ${siteConfig.founded}`}
          title="A small firm, on the ground, answering to international buyers"
          lede="Coast 2 Coast Properties Turkey was built around a straightforward observation: most people buying on this coast are making the largest purchase of their lives in a legal system and a language they do not know. That deserves more than a portal listing and a handshake."
          crumbs={CRUMBS}
          image={imagery.about}
        />

        {/* ---------------------------------------------------------- HİKÂYE */}
        <section aria-labelledby="story-heading" className="bg-shell py-section">
          <div className="container-page grid gap-8 sm:gap-16 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-6">
              <div className="relative aspect-[4/3] sm:aspect-[4/5] overflow-hidden bg-shell-deep">
                <Image
                  src={imagery.about.src}
                  alt="Fethiye bay and the surrounding coastline, where Coast 2 Coast Properties Turkey is based"
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="lg:col-span-5 lg:col-start-8">
              <p className="eyebrow text-sea">Our story</p>
              <h2
                id="story-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                Built on the coast we sell
              </h2>

              <div className="mt-5 sm:mt-8 space-y-5 sm:space-y-6 leading-relaxed text-ink-70">
                <p>
                  We are based in Fethiye, not in a call centre elsewhere. That
                  means we have walked every property on this site, we know which
                  hillside loses the sun in November, and we know which
                  developments have unresolved habitation certificates before the
                  paperwork tells us.
                </p>
                <p>
                  The firm was founded to bridge two systems that rarely explain
                  themselves to each other. Buyers arrive expecting the conveyancing
                  habits of their own country. Türkiye offers a land registry
                  that is faster and cleaner than most people expect, but with
                  its own requirements — the SPK valuation report, DASK, the DAB
                  currency certificate — that nobody mentions until they hold
                  something up.
                </p>
                <p>
                  Our job is to remove that gap entirely: to make a purchase in
                  Fethiye feel as legible as one at home, without pretending the
                  two processes are the same.
                </p>
              </div>

              <Link
                href="/buying-process"
                className="group mt-6 sm:mt-10 inline-flex items-center gap-2 text-sm text-sea-deep underline-offset-4 hover:underline"
              >
                See exactly how a purchase runs
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------- VİZYON & MİSYON */}
        <section
          aria-labelledby="vision-heading"
          className="border-y border-line bg-shell-deep py-section"
        >
          <div className="container-page">
            <h2 id="vision-heading" className="sr-only">
              Our vision and mission
            </h2>

            <div className="grid gap-8 sm:gap-12 lg:grid-cols-2">
              <article className="flex flex-col bg-shell p-10 sm:p-14">
                <Compass className="size-7 text-sea" aria-hidden="true" />
                <h3 className="mt-5 sm:mt-8 font-display text-2xl text-sea-deep sm:text-3xl">
                  Our vision
                </h3>
                <p className="mt-4 sm:mt-6 leading-relaxed text-ink-70">
                  That buying a home on the Turkish coast becomes something
                  families do with confidence rather than nerve — because
                  the process was explained, the risks were named out loud, and
                  the person guiding them had nothing to hide.
                </p>
              </article>

              <article className="flex flex-col bg-sea-deep p-10 text-shell sm:p-14">
                <Target className="size-7 text-sea" aria-hidden="true" />
                <h3 className="mt-5 sm:mt-8 font-display text-2xl sm:text-3xl">
                  Our mission
                </h3>
                <p className="mt-4 sm:mt-6 leading-relaxed text-shell/80">
                  To handle every stage of a Fethiye purchase — shortlist,
                  viewing trip, negotiation, independent legal checks, valuation,
                  currency, title deed and aftercare — through a single named
                  contact who is accountable for all of it, and to turn down the
                  business when the property does not stand up.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------- İLKELER */}
        <section
          aria-labelledby="principles-heading"
          className="bg-shell py-section"
        >
          <div className="container-page">
            <header className="max-w-2xl">
              <p className="eyebrow text-sea">How we work</p>
              <h2
                id="principles-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                Four commitments we will put in writing
              </h2>
            </header>

            <ul className="mt-8 sm:mt-16 grid gap-x-12 gap-y-8 sm:gap-y-14 sm:grid-cols-2">
              {PRINCIPLES.map((principle) => (
                <li key={principle.title} className="border-t border-line pt-6 sm:pt-8">
                  <principle.icon
                    className="size-6 text-sea"
                    aria-hidden="true"
                  />
                  <h3 className="mt-4 sm:mt-6 font-display text-xl leading-snug text-sea-deep">
                    {principle.title}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-ink-70">
                    {principle.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* --------------------------------------------------- NE YAPMAYIZ */}
        <section
          aria-labelledby="not-heading"
          className="border-t border-line bg-shell-deep py-section"
        >
          <div className="container-page grid gap-8 sm:gap-16 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="eyebrow text-sea">Just as important</p>
              <h2
                id="not-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                What we don&apos;t do
              </h2>
              <p className="mt-4 sm:mt-6 leading-relaxed text-ink-70">
                Overseas property has earned a share of its reputation. These are
                the practices we have deliberately built the firm to avoid.
              </p>
            </div>

            <ul className="space-y-5 sm:space-y-8 lg:col-span-6 lg:col-start-7">
              {NOT_DOING.map((line) => (
                <li
                  key={line}
                  className="border-b border-line pb-6 sm:pb-8 text-base leading-relaxed text-ink-70"
                >
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/*
          TODO: Ekip bölümü. Gerçek isim, fotoğraf ve rol bilgileri hazır olduğunda
          buraya bir "Meet the team" bloğu ekleyin ve schema.ts içindeki
          organizationSchema'ya `employee` alanını bağlayın. Uydurma isim veya
          stok fotoğraf KOYMAYIN — bu sayfanın tek işi güven inşa etmek.
        */}

        {/* ------------------------------------------------------------ CTA */}
        <section aria-labelledby="about-cta" className="bg-shell py-section">
          <div className="container-page">
            <div className="grid gap-8 sm:gap-12 bg-sea px-8 py-10 sm:py-16 text-shell sm:px-14 lg:grid-cols-12 lg:items-center lg:px-20 lg:py-24">
              <div className="lg:col-span-7">
                <h2
                  id="about-cta"
                  className="font-display text-3xl leading-tight sm:text-4xl"
                >
                  Talk to the person who will handle your purchase
                </h2>
                <p className="mt-4 sm:mt-6 max-w-xl leading-relaxed text-shell/85">
                  Not a call centre, not a lead form that disappears into a CRM.
                  Tell us what you are considering and you will get a considered
                  reply from someone who has stood in the properties concerned.
                </p>
              </div>

              <div className="flex flex-col gap-4 lg:col-span-4 lg:col-start-9">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-shell px-8 py-4 text-sm font-medium text-sea transition-colors hover:bg-white"
                >
                  Get in touch
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <a
                  href={whatsappHref(settings.contact.whatsappNumber, 
                    "Hello Coast 2 Coast — I'd like to know more about how you work.",
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 border border-shell/40 px-8 py-4 text-sm font-medium transition-colors hover:bg-shell/10"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  Message us on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
