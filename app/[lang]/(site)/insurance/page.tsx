import type { Metadata } from "next";
import { LocaleLink as Link } from "@/components/locale-link";
import { CtaSurface } from "@/components/cta-surface";
import {
  ArrowRight,
  Check,
  MessageCircle,
  Phone,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import { FaqAccordion } from "@/components/faq-accordion";
import { JsonLd } from "@/components/json-ld";
import { LeadForm } from "@/components/lead-form";
import { PageHero } from "@/components/page-hero";
import { imagery } from "@/lib/imagery";
import { getSettings, whatsappHref } from "@/lib/settings";
import {
  DASK_COVERAGE_CAP,
  POLICY_TYPES,
  QUOTE_CHECKLIST,
  QUOTE_CHECKLIST_KEYS,
} from "@/lib/insurance";
import { breadcrumbSchema, faqSchema, serviceSchema } from "@/lib/schema";
import { currentLocale } from "@/lib/current-locale";
import { getInsuranceCopy, getT } from "@/lib/i18n/server";
import { HOME_CRUMB, pageMetadata, type Crumb } from "@/lib/seo";


const PATH = "/insurance";
const CRUMBS: Crumb[] = [HOME_CRUMB, { name: "Insurance", path: PATH }];

export async function generateMetadata(): Promise<Metadata> {
  const locale = await currentLocale();
  const t = await getT();

  return pageMetadata({
    title: t("insurancePage.metaTitle"),
    description: t("insurancePage.metaDescription"),
    path: PATH,
    locale,
    keywords: [
      "DASK insurance Turkey",
      "property insurance Turkey",
      "earthquake insurance Turkey",
      "home insurance Fethiye",
      "contents insurance Turkey villa",
      "buildings insurance Turkish property",
    ],
    type: "article",
  });
}

export default async function InsurancePage() {
  const t = await getT();
  const copy = await getInsuranceCopy();

  /*
    `status` İKİ KEZ taşınıyor ve bu bilinçli.

    `statusLabel` ekranda görünen çevrilmiş rozet; `policy.status` ise
    İngilizce kalıyor çünkü aşağıdaki koşul onunla karşılaştırma yapıyor
    ("Compulsory by law" ise koyu rozet). Karşılaştırmayı çevrilmiş metne
    bağlamak, rozetin rengini DİLE bağlamak olurdu: Türkçe sayfada zorunlu
    poliçe sessizce diğerleriyle aynı görünürdü.
  */
  const policies = POLICY_TYPES.map((policy) => ({
    ...policy,
    ...copy.policy(policy.id, policy),
    statusKey: policy.status,
  }));

  const faqs = copy.faq();

  const settings = await getSettings();
  const quoteMessage =
    "Hello Coast 2 Coast — I'd like a quote for property insurance in Fethiye.";

  return (
    <>
      <JsonLd
        schema={[
          serviceSchema({
            name: "Property insurance guidance for Turkish property owners",
            /* Schema açıklaması sayfa diliyle aynı. */
            description: t("insurancePage.metaDescription"),
            path: PATH,
            serviceType: "Property insurance advisory",
            offers: policies.map((policy) => ({
              name: policy.name,
              description: policy.summary,
            })),
          }),
          faqSchema(faqs),
          breadcrumbSchema(CRUMBS),
        ]}
      />

      <main id="main">
        <PageHero
          title={t("insurancePage.heroTitle")}
          crumbs={CRUMBS}
          image={{
            ...imagery.insurance,
            /* Alt metni çeviriden: erişilebilirlik ve görsel arama
               sinyali sayfanın diliyle aynı olmalı. */
            alt: t("imagery.named.insurance"),
          }}
        />

        {/* --------------------------------------------- ÜÇ POLİÇE TÜRÜ */}
        <section
          aria-labelledby="policies-heading"
          className="bg-shell py-section"
        >
          <div className="container-page">
            <header className="max-w-2xl">
              <p className="eyebrow text-sea">{t("insurancePage.policiesEyebrow")}</p>
              <h2
                id="policies-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                {t("insurancePage.policiesHeading")}
              </h2>
              <p className="mt-4 sm:mt-5 text-ink-70">
                {t("insurancePage.policiesLede")}
              </p>
            </header>

            <ul className="mt-8 sm:mt-16 grid gap-6 sm:gap-10 lg:grid-cols-3">
              {policies.map((policy) => (
                <li key={policy.id}>
                  <article className="flex h-full flex-col border border-line bg-shell-deep p-8 sm:p-10">
                    <policy.icon
                      className="size-6 text-sea"
                      aria-hidden="true"
                    />

                    <p
                      className={`mt-5 sm:mt-7 inline-flex self-start px-3 py-1 text-[11px] uppercase tracking-widest ${
                        policy.statusKey === "Compulsory by law"
                          ? "bg-sea-deep text-shell"
                          : "bg-sea/15 text-sea"
                      }`}
                    >
                      {policy.status}
                    </p>

                    <h3 className="mt-4 sm:mt-5 font-display text-2xl leading-snug text-sea-deep">
                      {policy.name}
                    </h3>

                    <p className="mt-4 sm:mt-5 text-sm leading-relaxed text-ink-70">
                      {policy.summary}
                    </p>

                    <ul className="mt-5 sm:mt-7 space-y-4 border-t border-line pt-5 sm:pt-7">
                      {policy.detail.map((line) => (
                        <li
                          key={line}
                          className="flex gap-3 text-sm leading-relaxed text-ink-70"
                        >
                          <span
                            aria-hidden="true"
                            className="mt-2 size-1.5 shrink-0 bg-sea"
                          />
                          {line}
                        </li>
                      ))}
                    </ul>
                  </article>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ------------------------------- KAPSAM KARŞILAŞTIRMASI + TEKLİF */}
        <section
          aria-labelledby="coverage-heading"
          className="border-t border-line bg-shell-deep py-section"
        >
          <div className="container-page grid gap-8 sm:gap-16 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <header className="max-w-2xl">
                <p className="eyebrow text-sea">{t("insurancePage.coverEyebrow")}</p>
                <h2
                  id="coverage-heading"
                  className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
                >
                  {t("insurancePage.coverHeading")}
                </h2>
                <p className="mt-4 sm:mt-5 text-ink-70">
                  {t("insurancePage.coverLede")}
              </p>
              </header>

              {/* ------------------------------------------------------ DASK */}
              <article className="mt-8 sm:mt-16 border border-line bg-shell p-8 sm:p-10">
                <h3 className="inline-flex items-center gap-3 font-display text-2xl text-sea-deep">
                  <TriangleAlert
                    className="size-5 text-sea"
                    aria-hidden="true"
                  />
                  {t("insurancePage.daskHeading")}
                </h3>

                {DASK_COVERAGE_CAP ? (
                  <p className="mt-4 sm:mt-5 text-sm text-ink-70">
                    Current maximum sum insured:{" "}
                    <strong className="font-medium text-sea-deep">
                      {DASK_COVERAGE_CAP}
                    </strong>
                    .
                  </p>
                ) : (
                  /*
                    Teyit edilmemiş bir tavan rakamı yayımlamak, okuyucunun
                    eksik sigortalı olduğunu fark etmemesine yol açar.
                    Rakam lib/insurance.ts içine girilene kadar bu satır görünür.
                  */
                  <p className="mt-4 sm:mt-5 text-sm text-ink-70">
                    {t("insurancePage.daskCapNote")}
              </p>
                )}

                <div className="mt-6 sm:mt-10 grid gap-6 sm:gap-10 sm:grid-cols-2">
                  <div>
                    <h4 className="eyebrow border-b border-line pb-4 text-sea">
                      {t("insurancePage.daskCoversLabel")}
                    </h4>
                    <ul className="mt-4 sm:mt-6 space-y-4">
                      {copy.daskCovered.map((item) => (
                        <li
                          key={item}
                          className="flex gap-3 text-sm leading-relaxed text-ink-70"
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

                  <div>
                    <h4 className="eyebrow border-b border-line pb-4 text-ink-40">
                      {t("insurancePage.daskNotCoversLabel")}
                    </h4>
                    <ul className="mt-4 sm:mt-6 space-y-4">
                      {copy.daskNotCovered.map((item) => (
                        <li
                          key={item}
                          className="flex gap-3 text-sm leading-relaxed text-ink-70"
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
              </article>

              {/* ----------------------------------------- ÖZEL SİGORTA */}
              <article className="mt-6 sm:mt-10 border border-line bg-shell p-8 sm:p-10">
                <h3 className="inline-flex items-center gap-3 font-display text-2xl text-sea-deep">
                  <ShieldCheck className="size-5 text-sea" aria-hidden="true" />
                  {t("insurancePage.privateHeading")}
                </h3>

                <div className="mt-6 sm:mt-10 grid gap-6 sm:gap-10 sm:grid-cols-2">
                  <div>
                    <h4 className="eyebrow border-b border-line pb-4 text-sea">
                      {t("insurancePage.privateCoversLabel")}
                    </h4>
                    <ul className="mt-4 sm:mt-6 space-y-4">
                      {copy.privateCovered.map((item) => (
                        <li
                          key={item}
                          className="flex gap-3 text-sm leading-relaxed text-ink-70"
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

                  <div>
                    <h4 className="eyebrow border-b border-line pb-4 text-ink-40">
                      {t("insurancePage.privateNotCoversLabel")}
                    </h4>
                    <ul className="mt-4 sm:mt-6 space-y-4">
                      {copy.privateNotCovered.map((item) => (
                        <li
                          key={item}
                          className="flex gap-3 text-sm leading-relaxed text-ink-70"
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
              </article>
            </div>

            {/* -------------------------------------- CRO: STICKY TEKLİF */}
            <aside
              aria-labelledby="quote-heading"
              className="lg:col-span-4 lg:col-start-9"
            >
              <div className="lg:sticky lg:top-24 lg:max-h-[calc(100svh-7rem)] lg:overflow-y-auto">
                <div className="border border-line bg-shell p-7 sm:p-8">
                  <h2
                    id="quote-heading"
                    className="font-display text-2xl leading-snug text-sea-deep"
                  >
                    {t("insurancePage.quoteHeading")}
                  </h2>

                  <p className="mt-4 text-sm leading-relaxed text-ink-70">
                    {t("insurancePage.quoteBody")}
              </p>

                  <div className="mt-5 sm:mt-7 flex flex-col gap-3">
                    <a
                      href={whatsappHref(settings.contact.whatsappNumber, quoteMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-sea px-6 py-3.5 text-sm font-medium text-shell transition-colors hover:bg-sea"
                    >
                      <MessageCircle className="size-4" aria-hidden="true" />
                      {t("insurancePage.quoteWhatsapp")}
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
                      enquiryType="Insurance"
                      submitLabel={t("insurancePage.formSubmit")}
                      showBudget={false}
                      defaultMessage={t("insurancePage.formMessage")}
                      whatsappMessage={quoteMessage}
                    />
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* ------------------------------------------------- HAZIRLIK LİSTESİ */}
        <section
          aria-labelledby="checklist-heading"
          className="bg-shell py-section"
        >
          <div className="container-page">
            <header className="max-w-2xl">
              <p className="eyebrow text-sea">{t("insurancePage.checklistEyebrow")}</p>
              <h2
                id="checklist-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                {t("insurancePage.checklistHeading")}
              </h2>
              <p className="mt-4 sm:mt-5 text-ink-70">
                {t("insurancePage.checklistLede")}
              </p>
            </header>

            <ul className="mt-8 sm:mt-16 grid gap-x-12 gap-y-8 sm:gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {QUOTE_CHECKLIST.map((source, index) => {
                const item = copy.checklistItem(QUOTE_CHECKLIST_KEYS[index], source);
                return (
                <li key={QUOTE_CHECKLIST_KEYS[index]} className="border-t border-line pt-6 sm:pt-8">
                  <p className="font-display text-sm text-ink-40">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-4 font-display text-xl leading-snug text-sea-deep">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-ink-70">
                    {item.body}
                  </p>
                </li>
                );
              })}
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
              <p className="eyebrow text-sea">{t("insurancePage.faqEyebrow")}</p>
              <h2
                id="faq-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                {t("insurancePage.faqHeading")}
              </h2>
              <p className="mt-4 sm:mt-5 text-ink-70">
                {t("insurancePage.daskBuyingNote")}
                <Link
                  href="/buying-process"
                  className="text-sea-deep underline underline-offset-4"
                >
                  {t("insurancePage.buyingProcessLink")}
                </Link>
                .
              </p>
            </div>

            <div className="lg:col-span-6 lg:col-start-7">
              <FaqAccordion faqs={faqs} groupName="insurance-faq" />
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- UYARI + CTA */}
        <section aria-labelledby="insurance-cta" className="bg-shell py-section">
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
                {t("insurancePage.disclaimer")}
              </span>
            </p>

            <CtaSurface className="grid gap-8 sm:gap-12 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-7">
                <h2
                  id="insurance-cta"
                  className="font-display text-3xl leading-tight sm:text-4xl"
                >
                  {t("insurancePage.ctaHeading")}
                </h2>
                {/* CTA açıklama paragrafı KALDIRILDI — bu blokta artık yalnızca
                    başlık ve eylem düğmeleri var (dokuz sayfada birden).
                    Sözlükteki karşılığı da silindi. */}
              </div>

              <div className="flex flex-col gap-4 lg:col-span-4 lg:col-start-9">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-shell px-8 py-4 text-sm font-medium text-sea-deep transition-colors hover:bg-white"
                >
                  {t("insurancePage.ctaPrimary")}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <a
                  href={whatsappHref(settings.contact.whatsappNumber, quoteMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 border border-shell/40 px-8 py-4 text-sm font-medium transition-colors hover:bg-shell/10"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  {t("insurancePage.quoteWhatsapp")}
                </a>
              </div>
            </CtaSurface>
          </div>
        </section>
      </main>
    </>
  );
}
