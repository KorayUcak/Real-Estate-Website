import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  MessageCircle,
  Phone,
  ShieldCheck,
  X,
} from "lucide-react";
import { FaqAccordion } from "@/components/faq-accordion";
import { JsonLd } from "@/components/json-ld";
import { PageHero } from "@/components/page-hero";
import { imagery } from "@/lib/imagery";
import { getSettings, whatsappHref } from "@/lib/settings";
import { ViewingTripForm } from "@/components/viewing-trip-form";
import { breadcrumbSchema, faqSchema, serviceSchema } from "@/lib/schema";
import { HOME_CRUMB, pageMetadata, type Crumb } from "@/lib/seo";

import {
  HOSTS,
  ITINERARY,
  TRIP_INCLUDED,
  TRIP_NOT_DOING,
  TRIP_PREPARE,
  VIEWING_FAQS,
} from "@/lib/viewing-trip";

const PAGE_TITLE = "Property Viewing Trips in Fethiye, Turkey";
const PAGE_DESCRIPTION =
  "Plan a property viewing trip to Fethiye, Ölüdeniz and Göcek. A shortlist agreed before you fly, private transport, a named consultant for the whole trip, no coach tours and no pressure to buy.";

const PATH = "/viewing-day";
const CRUMBS: Crumb[] = [HOME_CRUMB, { name: "Viewing Day", path: PATH }];

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: PATH,
    keywords: [
      "property viewing trips Fethiye Turkey",
      "Turkey property inspection trip",
      "viewing trip Ölüdeniz",
      "buy property Turkey viewing day",
      "Fethiye property tour",
      "inspection trip Turkey villas",
    ],
    type: "article",
  });
}

const TRIP_STATS = [
  { value: "2–3", label: "Days, built around your shortlist" },
  { value: "6–8", label: "Properties a day, maximum" },
  { value: "£0", label: "For our time and transport" },
  { value: "1", label: "Named consultant, start to finish" },
];

export default async function ViewingDayPage() {
  const settings = await getSettings();
  const whatsappMessage =
    "Hello Coast 2 Coast — I'd like to arrange a viewing trip to Fethiye.";

  return (
    <>
      <JsonLd
        schema={[
          serviceSchema({
            name: "Property viewing trips in Fethiye, Türkiye",
            description: PAGE_DESCRIPTION,
            path: PATH,
            serviceType: "Property viewing and inspection trip",
            offers: ITINERARY.map((day) => ({
              name: day.title,
              description: day.summary,
            })),
          }),
          faqSchema(VIEWING_FAQS),
          breadcrumbSchema(CRUMBS),
        ]}
      />

      <main id="main">
        <PageHero
          eyebrow="Viewing trips"
          title="Two days on the ground beat two months of browsing"
          lede={`A viewing trip with us is not a coach tour. ${HOSTS[0]} and ${HOSTS[1]} collect you from your accommodation, drive you between properties chosen from a shortlist you agreed before flying, and tell you the truth about every one of them — including the ones we would talk you out of.`}
          crumbs={CRUMBS}
          image={imagery.viewingDay}
        >
          <div className="flex flex-col gap-8">
            <dl className="grid grid-cols-2 gap-x-8 gap-y-6 sm:gap-y-10 border-t border-line pt-6 sm:pt-10 sm:grid-cols-4">
              {TRIP_STATS.map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="block font-display text-4xl text-sea-deep">
                      {stat.value}
                    </span>
                    <span className="mt-2 block text-xs leading-relaxed text-ink-40">
                      {stat.label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>

            <div className="flex flex-col gap-4 sm:flex-row">
              <a
                href="#book"
                className="inline-flex items-center justify-center gap-2 bg-sea-deep px-8 py-4 text-sm font-medium text-shell transition-colors hover:bg-sea"
              >
                Book your viewing trip
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
              <a
                href={whatsappHref(settings.contact.whatsappNumber, whatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 border border-line px-8 py-4 text-sm font-medium text-sea-deep transition-colors hover:bg-shell-deep"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                Ask a question first
              </a>
            </div>
          </div>
        </PageHero>

        {/* ------------------------------------------- DAHİL / DAHİL DEĞİL */}
        <section
          aria-labelledby="included-heading"
          className="bg-shell py-section"
        >
          <div className="container-page grid gap-8 sm:gap-16 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <h2
                id="included-heading"
                className="font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                What is included
              </h2>
              <ul className="mt-6 sm:mt-10 space-y-5">
                {TRIP_INCLUDED.map((item) => (
                  <li
                    key={item}
                    className="flex gap-4 border-b border-line pb-5 text-sm leading-relaxed text-ink-70"
                  >
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-gold-deep"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-5 lg:col-start-8">
              <h2 className="font-display text-3xl leading-tight text-sea-deep sm:text-4xl">
                What we don&apos;t do
              </h2>
              <p className="mt-4 sm:mt-5 text-sm leading-relaxed text-ink-70">
                Overseas property viewing trips have earned a reputation. These
                are the practices we have deliberately built the trip to avoid.
              </p>
              <ul className="mt-6 sm:mt-10 space-y-5">
                {TRIP_NOT_DOING.map((item) => (
                  <li
                    key={item}
                    className="flex gap-4 border-b border-line pb-5 text-sm leading-relaxed text-ink-70"
                  >
                    <X
                      className="mt-0.5 size-4 shrink-0 text-ink-40"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ------------------------------- İTİNERER + STICKY REZERVASYON */}
        <section
          aria-labelledby="itinerary-heading"
          className="border-t border-line bg-shell-deep py-section"
        >
          <div className="container-page grid gap-8 sm:gap-16 lg:grid-cols-12">
            {/* ------------------------------------------------- İTİNERER */}
            <div className="lg:col-span-7">
              <header className="max-w-2xl">
                <p className="eyebrow text-sea">The itinerary</p>
                <h2
                  id="itinerary-heading"
                  className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
                >
                  How the days actually run
                </h2>
                <p className="mt-4 sm:mt-5 text-ink-70">
                  Nothing here is fixed. The schedule bends around what you
                  respond to on day one — because almost nobody&apos;s shortlist
                  survives contact with the actual houses.
                </p>
              </header>

              <div className="mt-8 sm:mt-16 space-y-10 sm:space-y-20">
                {ITINERARY.map((day) => (
                  <article key={day.id} id={day.id} className="scroll-mt-28">
                    <p className="eyebrow text-sea">{day.label}</p>
                    <h3 className="mt-4 font-display text-2xl leading-tight text-sea-deep sm:text-3xl">
                      {day.title}
                    </h3>
                    <p className="mt-4 sm:mt-5 max-w-2xl leading-relaxed text-ink-70">
                      {day.summary}
                    </p>

                    {/*
                      <ol>: gün içindeki sıra anlamın parçası. Ekran okuyucuya
                      "N öğeli sıralı liste" bilgisini verir.
                    */}
                    <ol className="mt-6 sm:mt-10 space-y-6 sm:space-y-10">
                      {day.entries.map((entry) => (
                        <li
                          key={entry.title}
                          className="relative border-l border-line pb-1 pl-8"
                        >
                          {/* Zaman çizgisi üzerindeki nokta */}
                          <span
                            aria-hidden="true"
                            className="absolute -left-[0.3125rem] top-1.5 size-2.5 border border-line bg-shell"
                          />

                          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                            <h4 className="inline-flex items-center gap-3 font-display text-lg text-sea-deep">
                              <entry.icon
                                className="size-4 shrink-0 text-sea"
                                aria-hidden="true"
                              />
                              {entry.title}
                            </h4>
                            <p className="shrink-0 text-xs uppercase tracking-widest text-ink-40">
                              {entry.time}
                            </p>
                          </div>

                          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-70">
                            {entry.body}
                          </p>
                        </li>
                      ))}
                    </ol>
                  </article>
                ))}
              </div>
            </div>

            {/* --------------------------------- CRO: STICKY REZERVASYON */}
            <aside
              aria-labelledby="book-heading"
              id="book"
              className="scroll-mt-24 lg:col-span-4 lg:col-start-9"
            >
              {/*
                Sayfanın tamamı bu forma hizmet ediyor: kullanıcı itinereri
                okurken form ekranda kalır, böylece "şimdi ilgilendim" anı ile
                eylem arasındaki mesafe sıfıra iner.
              */}
              <div className="lg:sticky lg:top-24 lg:max-h-[calc(100svh-7rem)] lg:overflow-y-auto">
                <div className="border border-line bg-shell p-7 sm:p-8">
                  <h2
                    id="book-heading"
                    className="font-display text-2xl leading-snug text-sea-deep"
                  >
                    Book your viewing trip
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-ink-70">
                    Tell us roughly when you could travel and what you are looking
                    for. We will come back with a proposed itinerary and a
                    shortlist to approve — before anyone books a flight.
                  </p>

                  <div className="mt-5 sm:mt-8">
                    <ViewingTripForm />
                  </div>
                </div>

                <div className="mt-4 sm:mt-6 flex flex-col gap-3">
                  <a
                    href={whatsappHref(settings.contact.whatsappNumber, whatsappMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-sea px-6 py-3.5 text-sm font-medium text-shell transition-colors hover:bg-sea"
                  >
                    <MessageCircle className="size-4" aria-hidden="true" />
                    Rather ask on WhatsApp?
                  </a>
                  <a
                    href={`tel:${settings.contact.phoneE164}`}
                    className="inline-flex items-center justify-center gap-2 border border-line px-6 py-3.5 text-sm font-medium text-sea-deep transition-colors hover:bg-shell"
                  >
                    <Phone className="size-4" aria-hidden="true" />
                    {settings.contact.phoneDisplay}
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* --------------------------------------------------------- HAZIRLIK */}
        <section
          aria-labelledby="prepare-heading"
          className="bg-shell py-section"
        >
          <div className="container-page">
            <header className="max-w-2xl">
              <p className="eyebrow text-sea">Before you come</p>
              <h2
                id="prepare-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                Four things to bring
              </h2>
            </header>

            <ul className="mt-8 sm:mt-16 grid gap-x-12 gap-y-8 sm:gap-y-14 sm:grid-cols-2">
              {TRIP_PREPARE.map((item) => (
                <li key={item.title} className="border-t border-line pt-6 sm:pt-8">
                  <h3 className="font-display text-xl leading-snug text-sea-deep">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-ink-70">
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>

            <p className="mt-8 sm:mt-16 inline-flex max-w-2xl items-start gap-3 border-t border-line pt-6 sm:pt-8 text-xs leading-relaxed text-ink-40">
              <ShieldCheck
                className="mt-0.5 size-4 shrink-0 text-sea"
                aria-hidden="true"
              />
              Every purchase we handle completes with independent legal
              representation instructed by you, never by the seller and never by
              us. See{" "}
              <Link
                href="/buying-process"
                className="text-sea-deep underline underline-offset-4"
              >
                the full buying process
              </Link>
              .
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------------- SSS */}
        <section
          aria-labelledby="faq-heading"
          className="border-t border-line bg-shell-deep py-section"
        >
          <div className="container-page grid gap-8 sm:gap-16 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="eyebrow text-sea">Straight answers</p>
              <h2
                id="faq-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                Viewing trip questions
              </h2>
              <p className="mt-4 sm:mt-5 text-ink-70">
                Costs, timings, how many properties and what happens if you decide
                not to buy — which is a completely normal outcome.
              </p>
            </div>

            <div className="lg:col-span-6 lg:col-start-7">
              <FaqAccordion faqs={VIEWING_FAQS} groupName="viewing-faq" />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- CTA */}
        <section aria-labelledby="viewing-cta" className="bg-shell py-section">
          <div className="container-page">
            <div className="grid gap-8 sm:gap-12 bg-sea px-8 py-10 sm:py-16 text-shell sm:px-14 lg:grid-cols-12 lg:items-center lg:px-20 lg:py-24">
              <div className="lg:col-span-7">
                <h2
                  id="viewing-cta"
                  className="font-display text-3xl leading-tight sm:text-4xl"
                >
                  Not ready to fly yet?
                </h2>
                <p className="mt-4 sm:mt-6 max-w-xl leading-relaxed text-shell/85">
                  Start with the portfolio, or read how a purchase actually runs
                  from offer to title deed. When you are ready, the trip will be
                  here.
                </p>
              </div>

              <div className="flex flex-col gap-4 lg:col-span-4 lg:col-start-9">
                <Link
                  href="/properties"
                  className="inline-flex items-center justify-center gap-2 bg-shell px-8 py-4 text-sm font-medium text-sea transition-colors hover:bg-white"
                >
                  Browse villas for sale
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/about-turkey"
                  className="inline-flex items-center justify-center gap-2 border border-shell/40 px-8 py-4 text-sm font-medium transition-colors hover:bg-shell/10"
                >
                  Read about the region
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
