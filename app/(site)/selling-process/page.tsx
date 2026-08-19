import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  FileCheck2,
  MessageCircle,
  Phone,
  ShieldCheck,
  X,
} from "lucide-react";
import { FaqAccordion } from "@/components/faq-accordion";
import { JsonLd } from "@/components/json-ld";
import { LeadForm } from "@/components/lead-form";
import { PageHero } from "@/components/page-hero";
import { imagery } from "@/lib/imagery";
import { getSettings, whatsappHref } from "@/lib/settings";
import { ProcessTimeline } from "@/components/process-timeline";
import {
  MARKETING_CONTRAST,
  SELLER_PAIN_POINTS,
  SELLING_FAQS,
  SELLING_STEPS,
  SOLE_AGENT_POINTS,
} from "@/lib/process";
import { breadcrumbSchema, faqSchema, howToSchema } from "@/lib/schema";
import { HOME_CRUMB, pageMetadata, type Crumb } from "@/lib/seo";

const PAGE_TITLE = "Selling Your Property in Fethiye: The Process";
const PAGE_DESCRIPTION =
  "How to sell a villa or apartment in Fethiye, from honest valuation to funds in your account. Eight stages, the paperwork you need in advance, and what it costs to sell in Türkiye.";

const PATH = "/selling-process";
const CRUMBS: Crumb[] = [HOME_CRUMB, { name: "Selling process", path: PATH }];

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: PATH,
    keywords: [
      "sell property in Turkey",
      "selling a villa in Fethiye",
      "Turkey property valuation",
      "capital gains tax Turkey property",
      "estate agent Fethiye selling",
      "sell house Ölüdeniz",
    ],
    type: "article",
  });
}

const AT_A_GLANCE = [
  { value: "48h", label: "From valuation request to written appraisal" },
  { value: "3–6", label: "Months to a buyer at the right price" },
  { value: "8", label: "Stages, managed on your behalf" },
  { value: "0", label: "Trips required — sell from anywhere" },
];

/**
 * Satıştan önce hazır olması gereken evraklar. İlan yayına girmeden bunlar
 * toplanmazsa süreç kabul edilen teklif AŞAMASINDA durur — bu liste, sayfanın
 * en pratik bölümü.
 */
const DOCUMENTS = [
  {
    title: "Title deed (TAPU)",
    body: "The original deed in your name. We check it against the registry for liens, mortgages or unpaid charges before listing.",
  },
  {
    title: "Habitation certificate (iskân)",
    body: "Confirms the building was completed to its approved plans. Its absence is the single most common reason a Fethiye sale stalls.",
  },
  {
    title: "Energy performance certificate",
    body: "The Enerji Kimlik Belgesi is legally required to sell. If you do not have one, we arrange it — it takes a few days, not weeks.",
  },
  {
    title: "Active DASK policy",
    body: "Compulsory earthquake insurance must be current for the deed to transfer. We check the renewal date at the start, not the end.",
  },
  {
    title: "Paid-up tax and site dues",
    body: "Annual property tax and any complex maintenance charges must be settled and evidenced before the registry appointment.",
  },
  {
    title: "Passport and tax number",
    body: "Plus a power of attorney if you will not be in Türkiye on completion day. This can be signed at a Turkish consulate or embassy in your own country.",
  },
];

export default async function SellingProcessPage() {
  const settings = await getSettings();
  return (
    <>
      <JsonLd
        schema={[
          howToSchema({
            name: "How to sell a property in Fethiye, Türkiye",
            description: PAGE_DESCRIPTION,
            path: PATH,
            steps: SELLING_STEPS.map((step) => ({
              title: step.title,
              body: step.summary,
            })),
          }),
          faqSchema(SELLING_FAQS),
          breadcrumbSchema(CRUMBS),
        ]}
      />

      <main id="main">
        <PageHero
          eyebrow="The selling process"
          title="Selling your property on the Fethiye coast"
          lede="Most properties that sit unsold in Fethiye are not badly located or badly built — they are priced against the neighbours' asking prices and presented with phone photographs. This is how we do it differently, and what we need from you."
          crumbs={CRUMBS}
          image={imagery.sellingProcess}
        >
          <div className="flex flex-col gap-6 sm:gap-10">
            <dl className="grid grid-cols-2 gap-x-8 gap-y-6 sm:gap-y-10 border-t border-line pt-6 sm:pt-10 sm:grid-cols-4">
              {AT_A_GLANCE.map((item) => (
                <div key={item.label}>
                  <dt className="sr-only">{item.label}</dt>
                  <dd>
                    <span className="block font-display text-4xl text-sea-deep">
                      {item.value}
                    </span>
                    <span className="mt-2 block text-xs leading-relaxed text-ink-40">
                      {item.label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>

            <a
              href="#valuation"
              className="inline-flex items-center justify-center gap-2 self-start bg-sea-deep px-8 py-4 text-sm font-medium text-shell transition-colors hover:bg-sea"
            >
              Request a free valuation
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          </div>
        </PageHero>

        {/* ------------------------------------------------- SATICI ŞİKÂYETLERİ */}
        <section
          aria-labelledby="problems-heading"
          className="bg-shell py-section"
        >
          <div className="container-page">
            <header className="max-w-2xl">
              <p className="eyebrow text-sea">Sound familiar?</p>
              <h2
                id="problems-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                Three things we hear from sellers every week
              </h2>
            </header>

            <dl className="mt-8 sm:mt-16 grid gap-x-12 gap-y-8 sm:gap-y-14 lg:grid-cols-3">
              {SELLER_PAIN_POINTS.map((item) => (
                <div key={item.problem} className="border-t border-line pt-6 sm:pt-8">
                  <dt className="font-display text-xl leading-snug text-sea-deep">
                    &ldquo;{item.problem}&rdquo;
                  </dt>
                  <dd className="mt-4 sm:mt-5 text-sm leading-relaxed text-ink-70">
                    {item.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ------------------------------------------------ PAZARLAMA YAKLAŞIMI */}
        <section
          aria-labelledby="marketing-heading"
          className="border-y border-line bg-sea-deep py-section text-shell"
        >
          <div className="container-page">
            <header className="max-w-2xl">
              <p className="eyebrow text-sea">Our approach</p>
              <h2
                id="marketing-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight sm:text-4xl"
              >
                Targeted marketing, not mass marketing
              </h2>
              <p className="mt-4 sm:mt-5 leading-relaxed text-shell/70">
                Listing a property everywhere is not a strategy. Reaching the
                small number of buyers actively planning a purchase in Fethiye is.
              </p>
            </header>

            <div className="mt-8 sm:mt-16 grid gap-6 sm:gap-10 lg:grid-cols-2">
              <article className="border border-shell/15 p-8 sm:p-10">
                <h3 className="font-display text-2xl text-shell/60">
                  {MARKETING_CONTRAST.mass.title}
                </h3>
                <ul className="mt-5 sm:mt-8 space-y-4">
                  {MARKETING_CONTRAST.mass.traits.map((trait) => (
                    <li
                      key={trait}
                      className="flex items-center gap-3 text-sm text-shell/60"
                    >
                      <X className="size-4 shrink-0" aria-hidden="true" />
                      {trait}
                    </li>
                  ))}
                </ul>
              </article>

              <article className="border border-sea bg-sea/10 p-8 sm:p-10">
                <h3 className="font-display text-2xl text-shell">
                  {MARKETING_CONTRAST.targeted.title}
                </h3>
                <ul className="mt-5 sm:mt-8 space-y-4">
                  {MARKETING_CONTRAST.targeted.traits.map((trait) => (
                    <li
                      key={trait}
                      className="flex items-center gap-3 text-sm text-shell"
                    >
                      <Check
                        className="size-4 shrink-0 text-gold-deep"
                        aria-hidden="true"
                      />
                      {trait}
                    </li>
                  ))}
                </ul>
              </article>
            </div>

            {/* --------------------------------------------- TEK YETKİLİ TEKLİF */}
            <div className="mt-8 sm:mt-16 border-t border-shell/15 pt-10 sm:pt-16">
              <div className="grid gap-8 sm:gap-12 lg:grid-cols-12">
                <div className="lg:col-span-5">
                  <h3 className="font-display text-2xl leading-tight sm:text-3xl">
                    Make us your sole agent for six months
                  </h3>
                  <p className="mt-4 sm:mt-6 leading-relaxed text-shell/70">
                    No additional fee for the exclusivity. What you get in return
                    is a property that is genuinely worked rather than one sitting
                    in a pile shared between five agencies.
                  </p>
                </div>

                <ul className="space-y-5 lg:col-span-6 lg:col-start-7">
                  {SOLE_AGENT_POINTS.map((point) => (
                    <li
                      key={point}
                      className="flex gap-4 border-b border-shell/15 pb-5 text-sm leading-relaxed text-shell/80"
                    >
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-gold-deep"
                        aria-hidden="true"
                      />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* --------------------------- ZAMAN ÇİZGİSİ + STICKY DEĞERLEME FORMU */}
        <section aria-labelledby="steps-heading" className="bg-shell py-section">
          <div className="container-page grid gap-8 sm:gap-16 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <header className="max-w-2xl">
                <p className="eyebrow text-sea">Stage by stage</p>
                <h2
                  id="steps-heading"
                  className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
                >
                  From valuation to funds released
                </h2>
                <p className="mt-4 sm:mt-5 leading-relaxed text-ink-70">
                  You can run the entire sale from abroad. We hold keys, manage
                  access, accompany every viewing and complete under power of
                  attorney if you would rather not travel.
                </p>
              </header>

              <div className="mt-8 sm:mt-16">
                <ProcessTimeline steps={SELLING_STEPS} />
              </div>
            </div>

            {/* --------------------------------- CRO: ÜCRETSİZ DEĞERLEME */}
            <aside
              aria-labelledby="valuation-heading"
              id="valuation"
              className="scroll-mt-24 lg:col-span-4 lg:col-start-9"
            >
              <div className="lg:sticky lg:top-24 lg:max-h-[calc(100svh-7rem)] lg:overflow-y-auto">
                <div className="border border-line bg-shell-deep p-7 sm:p-8">
                  <p className="inline-flex items-center gap-2 bg-sea/15 px-3 py-1 text-[11px] uppercase tracking-widest text-sea">
                    No obligation
                  </p>

                  <h2
                    id="valuation-heading"
                    className="mt-4 sm:mt-6 font-display text-2xl leading-snug text-sea-deep"
                  >
                    Request a free property valuation
                  </h2>

                  <p className="mt-4 text-sm leading-relaxed text-ink-70">
                    A written appraisal based on what has actually completed
                    nearby — not on what the villa down the road is asking. No
                    pressure to list with us afterwards.
                  </p>

                  <div className="mt-5 sm:mt-7 flex flex-col gap-3">
                    <a
                      href={whatsappHref(settings.contact.whatsappNumber, 
                        "Hello Coast 2 Coast — I'd like a free valuation on my property in Fethiye.",
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-sea px-6 py-3.5 text-sm font-medium text-shell transition-colors hover:bg-sea"
                    >
                      <MessageCircle className="size-4" aria-hidden="true" />
                      Valuation on WhatsApp
                    </a>
                    <a
                      href={`tel:${settings.contact.phoneE164}`}
                      className="inline-flex items-center justify-center gap-2 border border-line px-6 py-3.5 text-sm font-medium text-sea-deep transition-colors hover:bg-shell"
                    >
                      <Phone className="size-4" aria-hidden="true" />
                      {settings.contact.phoneDisplay}
                    </a>
                  </div>

                  <div className="mt-5 sm:mt-8 border-t border-line pt-6 sm:pt-8">
                    <LeadForm
                      variant="panel"
                      enquiryType="Valuation"
                      submitLabel="Request valuation"
                      showBudget={false}
                      defaultMessage="I'd like a valuation on my property. It is a ___ bedroom ___ in ___ (area), approximately ___ m²."
                      whatsappMessage="Hello Coast 2 Coast — I'd like a free valuation on my property in Fethiye."
                    />
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* ---------------------------------------------------------- EVRAKLAR */}
        <section
          aria-labelledby="documents-heading"
          className="border-y border-line bg-shell-deep py-section"
        >
          <div className="container-page">
            <header className="max-w-2xl">
              <p className="eyebrow text-sea">Before you list</p>
              <h2
                id="documents-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                Six documents to have ready
              </h2>
              <p className="mt-4 sm:mt-5 text-ink-70">
                Gathering these before marketing costs a few days. Discovering a
                gap after an accepted offer costs you the buyer.
              </p>
            </header>

            <ul className="mt-8 sm:mt-16 grid gap-x-12 gap-y-8 sm:gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {DOCUMENTS.map((document) => (
                <li key={document.title} className="border-t border-line pt-6 sm:pt-8">
                  <FileCheck2
                    className="size-5 text-sea"
                    aria-hidden="true"
                  />
                  <h3 className="mt-4 sm:mt-6 font-display text-xl leading-snug text-sea-deep">
                    {document.title}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-ink-70">
                    {document.body}
                  </p>
                </li>
              ))}
            </ul>

            <p className="mt-8 sm:mt-14 inline-flex max-w-2xl items-start gap-3 text-xs leading-relaxed text-ink-40">
              <ShieldCheck
                className="mt-0.5 size-4 shrink-0 text-sea"
                aria-hidden="true"
              />
              Guidance only, current at the time of writing, and not legal or tax
              advice. Turkish capital gains rules and your tax position at home are
              separate questions — we will point you to specialists in both.
            </p>
          </div>
        </section>

        {/* -------------------------------------------------------------- SSS */}
        <section aria-labelledby="faq-heading" className="bg-shell py-section">
          <div className="container-page grid gap-8 sm:gap-16 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="eyebrow text-sea">Straight answers</p>
              <h2
                id="faq-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                What sellers ask us most
              </h2>
              <p className="mt-4 sm:mt-5 text-ink-70">
                If your question is about your specific property, ask directly —
                the answer usually depends on when you bought and what you paid.
              </p>
            </div>

            <div className="lg:col-span-6 lg:col-start-7">
              <FaqAccordion faqs={SELLING_FAQS} groupName="selling-faq" />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- CTA */}
        <section aria-labelledby="selling-cta" className="bg-shell pb-section">
          <div className="container-page">
            <div className="grid gap-8 sm:gap-12 bg-sea px-8 py-10 sm:py-16 text-shell sm:px-14 lg:grid-cols-12 lg:items-center lg:px-20 lg:py-24">
              <div className="lg:col-span-7">
                <h2
                  id="selling-cta"
                  className="font-display text-3xl leading-tight sm:text-4xl"
                >
                  Find out what your property is really worth
                </h2>
                <p className="mt-4 sm:mt-6 max-w-xl leading-relaxed text-shell/85">
                  A written appraisal based on completed sales nearby, not on
                  what the villa down the road is asking. No obligation, and no
                  pressure to list with us afterwards.
                </p>
              </div>

              <div className="flex flex-col gap-4 lg:col-span-4 lg:col-start-9">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-shell px-8 py-4 text-sm font-medium text-sea transition-colors hover:bg-white"
                >
                  Request a valuation
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <p className="mt-2 text-xs leading-relaxed text-shell/70">
                  Buying as well?{" "}
                  <Link
                    href="/buying-process"
                    className="underline underline-offset-4 hover:text-shell"
                  >
                    Read the buying process
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
