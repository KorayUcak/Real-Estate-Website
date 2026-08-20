import type { Metadata } from "next";
import { LocaleLink as Link } from "@/components/locale-link";
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
  CITIZENSHIP_HOLD_YEARS,
  CITIZENSHIP_STEPS,
  CITIZENSHIP_THRESHOLD_LABEL,
} from "@/lib/citizenship";
import { breadcrumbSchema, faqSchema, howToSchema } from "@/lib/schema";
import { currentLocale } from "@/lib/current-locale";
import { getCitizenshipCopy, getT } from "@/lib/i18n/server";
import { HOME_CRUMB, pageMetadata, type Crumb } from "@/lib/seo";


const PATH = "/citizenship";
const CRUMBS: Crumb[] = [HOME_CRUMB, { name: "Citizenship", path: PATH }];

export async function generateMetadata(): Promise<Metadata> {
  const locale = await currentLocale();
  const t = await getT();

  return pageMetadata({
    title: t("citizenshipPage.metaTitle"),
    description: t("citizenshipPage.metaDescription", {
      threshold: CITIZENSHIP_THRESHOLD_LABEL,
      years: CITIZENSHIP_HOLD_YEARS,
    }),
    path: PATH,
    locale,
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

/* Rakamlar sabit, etiketler çeviriden (modül kapsamında `t()` yok). */
const AT_A_GLANCE = [
  { value: CITIZENSHIP_THRESHOLD_LABEL, key: "citizenshipPage.statInvestment" },
  { value: `${CITIZENSHIP_HOLD_YEARS} yrs`, key: "citizenshipPage.statHolding" },
  { value: "~3 mo", key: "citizenshipPage.statApproval" },
  { value: "Family", key: "citizenshipPage.statFamily" },
] as const;

/**
 * Sayfanın en üstünde, göze çarpan dört koşul.
 * Metin sözlükte; burada yalnızca sıra için anahtarlar var.
 */
const REQUIREMENT_KEYS = ["cond1", "cond2", "cond3", "cond4"] as const;

/** CITIZENSHIP_BENEFITS ile aynı sırada. */
const BENEFIT_KEYS = [
  "family",
  "dual",
  "no-residence",
  "retained",
  "e2",
  "rights",
] as const;

export default async function CitizenshipPage() {
  const t = await getT();

  /*
    Eşik ve süre KODDAN geliyor, çeviriden değil — kararname değiştiğinde
    tek güncelleme noktası lib/citizenship.ts kalsın diye (bkz. server.ts).
  */
  const copy = await getCitizenshipCopy({
    threshold: CITIZENSHIP_THRESHOLD_LABEL,
    years: CITIZENSHIP_HOLD_YEARS,
  });

  const steps = CITIZENSHIP_STEPS.map((step) => ({
    ...step,
    ...copy.step(step.id, step),
  }));
  const benefits = CITIZENSHIP_BENEFITS.map((b, i) => ({
    ...b,
    ...copy.benefit(BENEFIT_KEYS[i], b),
  }));
  const documents = copy.documents();
  const faqs = copy.faq();

  const settings = await getSettings();
  const consultationMessage =
    t("citizenshipPage.formMessage");

  return (
    <>
      <JsonLd
        schema={[
          /* Kullanıcı talebi: FAQPage — AI ve Google'ın soru-cevap eşlemesi için. */
          faqSchema(faqs),
          howToSchema({
            name: "How to obtain Turkish citizenship through property investment",
            /* Schema açıklaması sayfa diliyle aynı. */
            description: t("citizenshipPage.metaDescription", {
              threshold: CITIZENSHIP_THRESHOLD_LABEL,
              years: CITIZENSHIP_HOLD_YEARS,
            }),
            path: PATH,
            steps: steps.map((step) => ({
              title: step.title,
              body: step.summary,
            })),
          }),
          breadcrumbSchema(CRUMBS),
        ]}
      />

      <main id="main">
        <PageHero
          eyebrow={t("citizenshipPage.heroEyebrow")}
          title={t("citizenshipPage.heroTitle")}
          lede={t("citizenshipPage.heroLede")}
          crumbs={CRUMBS}
          image={{
            ...imagery.citizenship,
            /* Alt metni çeviriden: erişilebilirlik ve görsel arama
               sinyali sayfanın diliyle aynı olmalı. */
            alt: t("imagery.named.citizenship"),
          }}
        >
          <dl className="grid grid-cols-2 gap-x-8 gap-y-6 sm:gap-y-10 border-t border-line pt-6 sm:pt-10 sm:grid-cols-4">
            {AT_A_GLANCE.map((item) => (
              <div key={item.key}>
                <dt className="sr-only">{t(item.key)}</dt>
                <dd>
                  <span className="block font-display text-4xl text-sea-deep">
                    {item.value}
                  </span>
                  <span className="mt-2 block text-xs leading-relaxed text-ink-40">
                    {t(item.key)}
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
              <p className="eyebrow text-sea">{t("citizenshipPage.condEyebrow")}</p>
              <h2
                id="requirements-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                {t("citizenshipPage.condHeading")}
              </h2>
              <p className="mt-4 sm:mt-5 text-ink-70">
                {t("citizenshipPage.condLede", {
                  threshold: CITIZENSHIP_THRESHOLD_LABEL,
                })}
              </p>
            </header>

            <ul className="mt-8 sm:mt-16 grid gap-x-12 gap-y-8 sm:gap-y-14 sm:grid-cols-2">
              {REQUIREMENT_KEYS.map((reqKey, index) => (
                <li
                  key={reqKey}
                  className="border-t border-line pt-6 sm:pt-8"
                >
                  <p className="font-display text-sm text-ink-40">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-4 font-display text-xl leading-snug text-sea-deep">
                    {t(`citizenshipPage.${reqKey}Title`)}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-ink-70">
                    {t(`citizenshipPage.${reqKey}Body`)}
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
                <p className="eyebrow text-sea">{t("citizenshipPage.stagesEyebrow")}</p>
                <h2
                  id="process-heading"
                  className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
                >
                  {t("citizenshipPage.stagesHeading")}
                </h2>
                <p className="mt-4 sm:mt-5 text-ink-70">
                  {t("citizenshipPage.stagesLede")}
              </p>
              </header>

              <div className="mt-8 sm:mt-16">
                <ProcessTimeline steps={steps} />
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
                    {t("citizenshipPage.consultEyebrow")}
                  </p>

                  <h2
                    id="consultation-heading"
                    className="mt-4 sm:mt-6 font-display text-2xl leading-snug text-sea-deep"
                  >
                    {t("citizenshipPage.consultHeading")}
                  </h2>

                  <p className="mt-4 text-sm leading-relaxed text-ink-70">
                    {t("citizenshipPage.consultBody")}
              </p>

                  <div className="mt-5 sm:mt-7 flex flex-col gap-3">
                    <a
                      href={whatsappHref(settings.contact.whatsappNumber, consultationMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-sea px-6 py-3.5 text-sm font-medium text-shell transition-colors hover:bg-sea"
                    >
                      <MessageCircle className="size-4" aria-hidden="true" />
                      {t("citizenshipPage.consultWhatsapp")}
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
                      submitLabel={t("citizenshipPage.formSubmit")}
                      showBudget
                      defaultMessage={t("citizenshipPage.formMessage")}
                      whatsappMessage={consultationMessage}
                    />
                  </div>
                </div>

                <p className="mt-4 sm:mt-6 inline-flex items-start gap-2 text-xs leading-relaxed text-ink-40">
                  <Globe
                    className="mt-0.5 size-4 shrink-0 text-sea"
                    aria-hidden="true"
                  />
                  {t("citizenshipPage.consultNote")}
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
              <p className="eyebrow text-sea">{t("citizenshipPage.benefitsEyebrow")}</p>
              <h2
                id="benefits-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight sm:text-4xl"
              >
                {t("citizenshipPage.benefitsHeading")}
              </h2>
            </header>

            <ul className="mt-8 sm:mt-16 grid gap-x-12 gap-y-8 sm:gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {benefits.map((benefit) => (
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
              {t("citizenshipPage.benefitsDisclaimer")}
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
                {t("citizenshipPage.docsHeading")}
              </h2>
              <p className="mt-4 sm:mt-6 leading-relaxed text-ink-70">
                {t("citizenshipPage.docsNote")}
              </p>
            </div>

            <ul className="lg:col-span-6 lg:col-start-7">
              {documents.map((document) => (
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
              <p className="eyebrow text-sea">{t("citizenshipPage.faqEyebrow")}</p>
              <h2
                id="faq-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                {t("citizenshipPage.faqHeading")}
              </h2>
              <p className="mt-4 sm:mt-5 text-ink-70">
                {t("citizenshipPage.faqFooter")}
              </p>
            </div>

            <div className="lg:col-span-6 lg:col-start-7">
              <FaqAccordion faqs={faqs} groupName="citizenship-faq" />
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
                  {t("citizenshipPage.importantLabel")}
                </strong>{" "}
                {t("citizenshipPage.disclaimer", {
                  threshold: CITIZENSHIP_THRESHOLD_LABEL,
                })}
              </span>
            </p>

            <div className="grid gap-8 sm:gap-12 bg-sea px-8 py-10 sm:py-16 text-shell sm:px-14 lg:grid-cols-12 lg:items-center lg:px-20 lg:py-24">
              <div className="lg:col-span-7">
                <h2
                  id="citizenship-cta"
                  className="font-display text-3xl leading-tight sm:text-4xl"
                >
                  {t("citizenshipPage.ctaHeading")}
                </h2>
                <p className="mt-4 sm:mt-6 max-w-xl leading-relaxed text-shell/85">
                  {t("citizenshipPage.ctaBody")}
              </p>
              </div>

              <div className="flex flex-col gap-4 lg:col-span-4 lg:col-start-9">
                <Link
                  href="/properties"
                  className="inline-flex items-center justify-center gap-2 bg-shell px-8 py-4 text-sm font-medium text-sea transition-colors hover:bg-white"
                >
                  {t("citizenshipPage.ctaPrimary")}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/buying-process"
                  className="inline-flex items-center justify-center gap-2 border border-shell/40 px-8 py-4 text-sm font-medium transition-colors hover:bg-shell/10"
                >
                  {t("citizenshipPage.ctaSecondary")}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
