import type { Metadata } from "next";
import { LocaleLink as Link } from "@/components/locale-link";
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
  PAIN_POINT_KEYS,
  SELLER_PAIN_POINTS,
  SELLING_STEPS,
} from "@/lib/process";
import {
  getProcessCopy,
  getSellingDocuments,
  getT,
} from "@/lib/i18n/server";
import { breadcrumbSchema, faqSchema, howToSchema } from "@/lib/schema";
import { currentLocale } from "@/lib/current-locale";
import { HOME_CRUMB, pageMetadata, type Crumb } from "@/lib/seo";


const PATH = "/selling-process";
const CRUMBS: Crumb[] = [HOME_CRUMB, { name: "Selling process", path: PATH }];

export async function generateMetadata(): Promise<Metadata> {
  const locale = await currentLocale();
  const t = await getT();

  return pageMetadata({
    title: t("sellingProcess.metaTitle"),
    description: t("sellingProcess.metaDescription"),
    path: PATH,
    locale,
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

/* Rakamlar sabit, etiketler çeviriden — gerekçe /buying-process ile aynı. */
const AT_A_GLANCE = [
  { value: "48h", key: "sellingProcess.statAppraisal" },
  { value: "3–6", key: "sellingProcess.statMonths" },
  { value: "8", key: "sellingProcess.statStages" },
  { value: "0", key: "sellingProcess.statTrips" },
] as const;

/**
 * Satıştan önce hazır olması gereken evraklar. İlan yayına girmeden bunlar
 * toplanmazsa süreç kabul edilen teklif AŞAMASINDA durur — bu liste, sayfanın
 * en pratik bölümü.
 */
/**
 * Evrak listesi ARTIK SÖZLÜKTE (`sellingProcess.documents`).
 *
 * Burada yalnızca sıra ve ikon eşlemesi için anahtarlar kaldı; başlık ve
 * açıklama üç dilde tek kaynaktan geliyor.
 */
const DOCUMENT_KEYS = [
  "tapu",
  "iskan",
  "energy",
  "dask",
  "tax",
  "passport",
] as const;

export default async function SellingProcessPage() {
  /* Çeviri katmanı — gerekçe /buying-process sayfasıyla aynı. */
  const t = await getT();
  const copy = await getProcessCopy();
  const documents = await getSellingDocuments();

  const steps = SELLING_STEPS.map((step) => ({
    ...step,
    ...copy.sellingStep(step.id, step),
  }));

  const painPoints = SELLER_PAIN_POINTS.map((item, index) => ({
    ...item,
    ...copy.painPoint(PAIN_POINT_KEYS[index], item),
  }));

  const faqs = copy.sellingFaq();
  const marketing = copy.marketing;
  const soleAgentPoints = copy.soleAgent;

  const settings = await getSettings();
  return (
    <>
      <JsonLd
        schema={[
          howToSchema({
            name: "How to sell a property in Fethiye, Türkiye",
            /* Schema açıklaması sayfa diliyle aynı — yapılandırılmış
               veri ile görünen içerik çelişmemeli. */
            description: t("sellingProcess.metaDescription"),
            path: PATH,
            steps: steps.map((step) => ({
              title: step.title,
              body: step.summary,
            })),
          }),
          faqSchema(faqs),
          breadcrumbSchema(CRUMBS),
        ]}
      />

      <main id="main">
        <PageHero
          eyebrow={t("sellingProcess.heroEyebrow")}
          title={t("sellingProcess.heroTitle")}
          lede={t("sellingProcess.heroLede")}
          crumbs={CRUMBS}
          image={{
            ...imagery.sellingProcess,
            /* Alt metni çeviriden: erişilebilirlik ve görsel arama
               sinyali sayfanın diliyle aynı olmalı. */
            alt: t("imagery.named.sellingProcess"),
          }}
        >
          <div className="flex flex-col gap-6 sm:gap-10">
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

            <a
              href="#valuation"
              className="inline-flex items-center justify-center gap-2 self-start bg-sea-deep px-8 py-4 text-sm font-medium text-shell transition-colors hover:bg-sea"
            >
              {t("sellingProcess.heroCta")}
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
              <p className="eyebrow text-sea">{t("sellingProcess.painEyebrow")}</p>
              <h2
                id="problems-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                {t("sellingProcess.painHeading")}
              </h2>
            </header>

            <dl className="mt-8 sm:mt-16 grid gap-x-12 gap-y-8 sm:gap-y-14 lg:grid-cols-3">
              {painPoints.map((item, index) => (
                <div key={PAIN_POINT_KEYS[index]} className="border-t border-line pt-6 sm:pt-8">
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
              <p className="eyebrow text-sea">{t("sellingProcess.approachEyebrow")}</p>
              <h2
                id="marketing-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight sm:text-4xl"
              >
                {t("sellingProcess.approachHeading")}
              </h2>
              <p className="mt-4 sm:mt-5 leading-relaxed text-shell/70">
                {t("sellingProcess.approachLede")}
              </p>
            </header>

            <div className="mt-8 sm:mt-16 grid gap-6 sm:gap-10 lg:grid-cols-2">
              <article className="border border-shell/15 p-8 sm:p-10">
                <h3 className="font-display text-2xl text-shell/60">
                  {marketing.massTitle}
                </h3>
                <ul className="mt-5 sm:mt-8 space-y-4">
                  {marketing.massTraits.map((trait) => (
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
                  {marketing.targetedTitle}
                </h3>
                <ul className="mt-5 sm:mt-8 space-y-4">
                  {marketing.targetedTraits.map((trait) => (
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
                    {t("sellingProcess.soleHeading")}
                  </h3>
                  <p className="mt-4 sm:mt-6 leading-relaxed text-shell/70">
                    {t("sellingProcess.soleBody")}
              </p>
                </div>

                <ul className="space-y-5 lg:col-span-6 lg:col-start-7">
                  {soleAgentPoints.map((point) => (
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
                <p className="eyebrow text-sea">{t("sellingProcess.stagesEyebrow")}</p>
                <h2
                  id="steps-heading"
                  className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
                >
                  {t("sellingProcess.stagesHeading")}
                </h2>
                <p className="mt-4 sm:mt-5 leading-relaxed text-ink-70">
                  {t("sellingProcess.stagesLede")}
              </p>
              </header>

              <div className="mt-8 sm:mt-16">
                <ProcessTimeline steps={steps} />
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
                    {t("sellingProcess.valuationEyebrow")}
                  </p>

                  <h2
                    id="valuation-heading"
                    className="mt-4 sm:mt-6 font-display text-2xl leading-snug text-sea-deep"
                  >
                    {t("sellingProcess.valuationHeading")}
                  </h2>

                  <p className="mt-4 text-sm leading-relaxed text-ink-70">
                    {t("sellingProcess.valuationBody")}
              </p>

                  <div className="mt-5 sm:mt-7 flex flex-col gap-3">
                    <a
                      href={whatsappHref(settings.contact.whatsappNumber, 
                        t("sellingProcess.whatsappMessage"),
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-sea px-6 py-3.5 text-sm font-medium text-shell transition-colors hover:bg-sea"
                    >
                      <MessageCircle className="size-4" aria-hidden="true" />
                      {t("sellingProcess.valuationWhatsapp")}
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
                      submitLabel={t("sellingProcess.formSubmit")}
                      showBudget={false}
                      defaultMessage={t("sellingProcess.formMessage")}
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
              <p className="eyebrow text-sea">{t("sellingProcess.docsEyebrow")}</p>
              <h2
                id="documents-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                {t("sellingProcess.docsHeading")}
              </h2>
              <p className="mt-4 sm:mt-5 text-ink-70">
                {t("sellingProcess.docsLede")}
              </p>
            </header>

            <ul className="mt-8 sm:mt-16 grid gap-x-12 gap-y-8 sm:gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {DOCUMENT_KEYS.map((key) => (
                <li key={key} className="border-t border-line pt-6 sm:pt-8">
                  <FileCheck2
                    className="size-5 text-sea"
                    aria-hidden="true"
                  />
                  <h3 className="mt-4 sm:mt-6 font-display text-xl leading-snug text-sea-deep">
                    {documents[key].title}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-ink-70">
                    {documents[key].body}
                  </p>
                </li>
              ))}
            </ul>

            <p className="mt-8 sm:mt-14 inline-flex max-w-2xl items-start gap-3 text-xs leading-relaxed text-ink-40">
              <ShieldCheck
                className="mt-0.5 size-4 shrink-0 text-sea"
                aria-hidden="true"
              />
              {t("sellingProcess.docsDisclaimer")}
              </p>
          </div>
        </section>

        {/* -------------------------------------------------------------- SSS */}
        <section aria-labelledby="faq-heading" className="bg-shell py-section">
          <div className="container-page grid gap-8 sm:gap-16 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="eyebrow text-sea">{t("sellingProcess.faqEyebrow")}</p>
              <h2
                id="faq-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                {t("sellingProcess.faqHeading")}
              </h2>
              <p className="mt-4 sm:mt-5 text-ink-70">
                {t("sellingProcess.faqFooter")}
              </p>
            </div>

            <div className="lg:col-span-6 lg:col-start-7">
              <FaqAccordion faqs={faqs} groupName="selling-faq" />
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
                  {t("sellingProcess.ctaHeading")}
                </h2>
                <p className="mt-4 sm:mt-6 max-w-xl leading-relaxed text-shell/85">
                  {t("sellingProcess.ctaBody")}
              </p>
              </div>

              <div className="flex flex-col gap-4 lg:col-span-4 lg:col-start-9">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-shell px-8 py-4 text-sm font-medium text-sea transition-colors hover:bg-white"
                >
                  {t("sellingProcess.ctaPrimary")}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <p className="mt-2 text-xs leading-relaxed text-shell/70">
                  Buying as well?{" "}
                  <Link
                    href="/buying-process"
                    className="underline underline-offset-4 hover:text-shell"
                  >
                    {t("sellingProcess.ctaSecondary")}
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
