import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Globe,
  MessageCircle,
  Phone,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";
import { FaqAccordion } from "@/components/faq-accordion";
import { JsonLd } from "@/components/json-ld";
import { LeadForm } from "@/components/lead-form";
import { PageHero } from "@/components/page-hero";
import { imagery } from "@/lib/imagery";
import { getSettings, whatsappHref } from "@/lib/settings";
import { ProcessTimeline } from "@/components/process-timeline";
import {
  CITIZENSHIP_BENEFITS,
  CITIZENSHIP_DOCUMENTS,
  CITIZENSHIP_FAQS,
  CITIZENSHIP_HOLD_YEARS,
  CITIZENSHIP_STEPS,
  CITIZENSHIP_THRESHOLD_LABEL,
} from "@/lib/citizenship";
import { breadcrumbSchema, faqSchema, howToSchema } from "@/lib/schema";
import { HOME_CRUMB, pageMetadata, type Crumb } from "@/lib/seo";

const PAGE_TITLE = "Turkish Citizenship by Investment: The 2026 Guide";
const PAGE_DESCRIPTION = `Turkish citizenship through property investment from ${CITIZENSHIP_THRESHOLD_LABEL}. The full process, the ${CITIZENSHIP_HOLD_YEARS}-year holding period, the documents required, and who in your family is included — explained by a Fethiye consultancy that handles the purchase end to end.`;

const PATH = "/citizenship";
const CRUMBS: Crumb[] = [HOME_CRUMB, { name: "Citizenship", path: PATH }];

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: PATH,
    keywords: [
      "Turkish citizenship by investment",
      "Turkish citizenship property $400,000",
      "buy property Turkey citizenship",
      "Turkish passport by investment",
      "citizenship by investment Fethiye",
      "Turkey golden visa property",
    ],
    type: "article",
  });
}

const AT_A_GLANCE = [
  { value: CITIZENSHIP_THRESHOLD_LABEL, label: "Minimum property investment" },
  { value: `${CITIZENSHIP_HOLD_YEARS} yrs`, label: "Holding period on the deed" },
  { value: "~3 mo", label: "Typical approval time" },
  { value: "Family", label: "Spouse and under-18s included" },
];

/** Sayfanın en üstünde, göze çarpan dört koşul. */
const REQUIREMENTS = [
  {
    title: `Property worth ${CITIZENSHIP_THRESHOLD_LABEL} or more`,
    body: "Assessed by an official SPK valuation report, not by the asking price. One property or several combined — both are accepted.",
  },
  {
    title: `A ${CITIZENSHIP_HOLD_YEARS}-year commitment on the title deed`,
    body: `The TAPU carries a formal annotation that the property will not be sold for ${CITIZENSHIP_HOLD_YEARS} years. You keep full use of it throughout.`,
  },
  {
    title: "Funds routed through a Turkish bank",
    body: "The purchase must be paid through the Turkish banking system and exchanged into lira, producing the DAB certificate the application requires.",
  },
  {
    title: "A clean, transferable title",
    body: "The property needs an individual deed with no liens, mortgages or unpaid charges. We verify this before you pay a deposit.",
  },
];

export default async function CitizenshipPage() {
  const settings = await getSettings();
  const consultationMessage =
    "Hello Coast 2 Coast — I'd like a consultation about Turkish citizenship through property investment.";

  return (
    <>
      <JsonLd
        schema={[
          /* Kullanıcı talebi: FAQPage — AI ve Google'ın soru-cevap eşlemesi için. */
          faqSchema(CITIZENSHIP_FAQS),
          howToSchema({
            name: "How to obtain Turkish citizenship through property investment",
            description: PAGE_DESCRIPTION,
            path: PATH,
            steps: CITIZENSHIP_STEPS.map((step) => ({
              title: step.title,
              body: step.summary,
            })),
          }),
          breadcrumbSchema(CRUMBS),
        ]}
      />

      <main id="main">
        <PageHero
          eyebrow="Citizenship by investment"
          title="A Turkish passport, through a property you actually keep"
          lede={`Unlike donation-based programmes, this one leaves you holding the asset. Invest ${CITIZENSHIP_THRESHOLD_LABEL} or more in Turkish property, hold it for ${CITIZENSHIP_HOLD_YEARS} years, and you, your spouse and your children under 18 can become Turkish citizens — with no residence requirement, no language test and no interview.`}
          crumbs={CRUMBS}
          image={imagery.citizenship}
        >
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
        </PageHero>

        {/* ------------------------------------------------------ KOŞULLAR */}
        <section
          aria-labelledby="requirements-heading"
          className="bg-shell py-section"
        >
          <div className="container-page">
            <header className="max-w-2xl">
              <p className="eyebrow text-sea">The four conditions</p>
              <h2
                id="requirements-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                What actually has to be true
              </h2>
              <p className="mt-4 sm:mt-5 text-ink-70">
                Most failed applications fail on one of these four points, and
                almost always on the first. A property marketed at{" "}
                {CITIZENSHIP_THRESHOLD_LABEL} does not automatically value at{" "}
                {CITIZENSHIP_THRESHOLD_LABEL}.
              </p>
            </header>

            <ul className="mt-8 sm:mt-16 grid gap-x-12 gap-y-8 sm:gap-y-14 sm:grid-cols-2">
              {REQUIREMENTS.map((requirement, index) => (
                <li
                  key={requirement.title}
                  className="border-t border-line pt-6 sm:pt-8"
                >
                  <p className="font-display text-sm text-ink-40">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-4 font-display text-xl leading-snug text-sea-deep">
                    {requirement.title}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-ink-70">
                    {requirement.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* --------------------------------- ZAMAN ÇİZGİSİ + STICKY DANIŞMA */}
        <section
          aria-labelledby="process-heading"
          className="border-t border-line bg-shell-deep py-section"
        >
          <div className="container-page grid gap-8 sm:gap-16 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <header className="max-w-2xl">
                <p className="eyebrow text-sea">Stage by stage</p>
                <h2
                  id="process-heading"
                  className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
                >
                  From shortlist to passport
                </h2>
                <p className="mt-4 sm:mt-5 text-ink-70">
                  Seven stages, typically five to six months end to end. We handle
                  the property side and coordinate with English-speaking
                  solicitors who handle the application itself.
                </p>
              </header>

              <div className="mt-8 sm:mt-16">
                <ProcessTimeline steps={CITIZENSHIP_STEPS} />
              </div>
            </div>

            {/* ---------------------------------------- CRO: STICKY DANIŞMA */}
            <aside
              aria-labelledby="consultation-heading"
              className="lg:col-span-4 lg:col-start-9"
            >
              <div className="lg:sticky lg:top-24 lg:max-h-[calc(100svh-7rem)] lg:overflow-y-auto">
                <div className="border border-line bg-shell p-7 sm:p-8">
                  <p className="inline-flex items-center gap-2 bg-sea/15 px-3 py-1 text-[11px] uppercase tracking-widest text-sea">
                    <BadgeCheck className="size-3.5" aria-hidden="true" />
                    Free consultation
                  </p>

                  <h2
                    id="consultation-heading"
                    className="mt-4 sm:mt-6 font-display text-2xl leading-snug text-sea-deep"
                  >
                    Get a citizenship consultation
                  </h2>

                  <p className="mt-4 text-sm leading-relaxed text-ink-70">
                    We will tell you honestly whether your budget clears the
                    threshold on a real valuation, what the total cost looks like,
                    and how long it is likely to take for your family.
                  </p>

                  <div className="mt-5 sm:mt-7 flex flex-col gap-3">
                    <a
                      href={whatsappHref(settings.contact.whatsappNumber, consultationMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-sea px-6 py-3.5 text-sm font-medium text-shell transition-colors hover:bg-sea"
                    >
                      <MessageCircle className="size-4" aria-hidden="true" />
                      Ask on WhatsApp
                    </a>
                    <a
                      href={`tel:${settings.contact.phoneE164}`}
                      className="inline-flex items-center justify-center gap-2 border border-line px-6 py-3.5 text-sm font-medium text-sea-deep transition-colors hover:bg-shell-deep"
                    >
                      <Phone className="size-4" aria-hidden="true" />
                      {settings.contact.phoneDisplay}
                    </a>
                  </div>

                  <div className="mt-5 sm:mt-8 border-t border-line pt-6 sm:pt-8">
                    <LeadForm
                      variant="panel"
                      enquiryType="Citizenship"
                      submitLabel="Request consultation"
                      showBudget
                      defaultMessage="I'm interested in Turkish citizenship through property investment. Please could you tell me what my budget would qualify for?"
                      whatsappMessage={consultationMessage}
                    />
                  </div>
                </div>

                <p className="mt-4 sm:mt-6 inline-flex items-start gap-2 text-xs leading-relaxed text-ink-40">
                  <Globe
                    className="mt-0.5 size-4 shrink-0 text-sea"
                    aria-hidden="true"
                  />
                  We work alongside English-speaking immigration solicitors who
                  are instructed by you, not by us.
                </p>
              </div>
            </aside>
          </div>
        </section>

        {/* ----------------------------------------------------- AVANTAJLAR */}
        <section
          aria-labelledby="benefits-heading"
          className="bg-sea-deep py-section text-shell"
        >
          <div className="container-page">
            <header className="max-w-2xl">
              <p className="eyebrow text-sea">Why people do it</p>
              <h2
                id="benefits-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight sm:text-4xl"
              >
                What Turkish citizenship gives you
              </h2>
            </header>

            <ul className="mt-8 sm:mt-16 grid gap-x-12 gap-y-8 sm:gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {CITIZENSHIP_BENEFITS.map((benefit) => (
                <li
                  key={benefit.title}
                  className="border-t border-shell/20 pt-6 sm:pt-8"
                >
                  <Check className="size-5 text-gold-deep" aria-hidden="true" />
                  <h3 className="mt-4 sm:mt-6 font-display text-xl leading-snug">
                    {benefit.title}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-shell/70">
                    {benefit.body}
                  </p>
                </li>
              ))}
            </ul>

            <p className="mt-8 sm:mt-16 inline-flex max-w-2xl items-start gap-3 border-t border-shell/20 pt-6 sm:pt-8 text-xs leading-relaxed text-shell/60">
              <ShieldAlert
                className="mt-0.5 size-4 shrink-0 text-sea"
                aria-hidden="true"
              />
              Visa-free travel arrangements are set by each destination country
              and change regularly. Check the current position for your intended
              destinations before relying on it — we do not advise on travel
              rights.
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------- EVRAKLAR */}
        <section
          aria-labelledby="documents-heading"
          className="bg-shell py-section"
        >
          <div className="container-page grid gap-8 sm:gap-16 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="eyebrow text-sea">Paperwork</p>
              <h2
                id="documents-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                What you will be asked for
              </h2>
              <p className="mt-4 sm:mt-6 leading-relaxed text-ink-70">
                Every foreign-issued document needs a notarised Turkish
                translation, and several need an apostille from the issuing
                country. Starting this early is the single easiest way to shorten
                the timeline.
              </p>
            </div>

            <ul className="lg:col-span-6 lg:col-start-7">
              {CITIZENSHIP_DOCUMENTS.map((document) => (
                <li
                  key={document}
                  className="flex gap-4 border-b border-line py-5 text-sm leading-relaxed text-ink-70"
                >
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-gold-deep"
                    aria-hidden="true"
                  />
                  {document}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ------------------------------------------------------------ SSS */}
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
                Turkish citizenship questions, answered
              </h2>
              <p className="mt-4 sm:mt-5 text-ink-70">
                If your situation is unusual — a company purchase, a shared deed,
                an adult child — ask us directly. The answer genuinely depends on
                the detail.
              </p>
            </div>

            <div className="lg:col-span-6 lg:col-start-7">
              <FaqAccordion faqs={CITIZENSHIP_FAQS} groupName="citizenship-faq" />
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- UYARI + CTA */}
        <section aria-labelledby="citizenship-cta" className="bg-shell py-section">
          <div className="container-page">
            <p className="mb-8 sm:mb-14 inline-flex max-w-3xl items-start gap-3 border border-line bg-shell-deep p-6 text-xs leading-relaxed text-ink-70">
              <TriangleAlert
                className="mt-0.5 size-4 shrink-0 text-sea"
                aria-hidden="true"
              />
              <span>
                <strong className="font-medium text-sea-deep">
                  Important:
                </strong>{" "}
                Coast 2 Coast Properties Turkey is a property consultancy, not a
                law firm or a licensed immigration adviser. The figures on this
                page reflect the rules in force at the time of writing and are set
                by the Turkish government, which changes them — the threshold moved
                from $250,000 to {CITIZENSHIP_THRESHOLD_LABEL} in 2022. Nothing
                here is legal or immigration advice. We introduce you to
                English-speaking solicitors who are instructed by you and who
                confirm your position in writing before you commit any funds.
              </span>
            </p>

            <div className="grid gap-8 sm:gap-12 bg-sea px-8 py-10 sm:py-16 text-shell sm:px-14 lg:grid-cols-12 lg:items-center lg:px-20 lg:py-24">
              <div className="lg:col-span-7">
                <h2
                  id="citizenship-cta"
                  className="font-display text-3xl leading-tight sm:text-4xl"
                >
                  Find out what your budget qualifies for
                </h2>
                <p className="mt-4 sm:mt-6 max-w-xl leading-relaxed text-shell/85">
                  We will shortlist properties that clear the threshold on a real
                  valuation, not on an optimistic asking price — and tell you
                  plainly if your budget does not reach it yet.
                </p>
              </div>

              <div className="flex flex-col gap-4 lg:col-span-4 lg:col-start-9">
                <Link
                  href="/properties"
                  className="inline-flex items-center justify-center gap-2 bg-shell px-8 py-4 text-sm font-medium text-sea transition-colors hover:bg-white"
                >
                  See qualifying properties
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/buying-process"
                  className="inline-flex items-center justify-center gap-2 border border-shell/40 px-8 py-4 text-sm font-medium transition-colors hover:bg-shell/10"
                >
                  How the purchase works
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
