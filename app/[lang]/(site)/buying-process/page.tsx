import type { Metadata } from "next";
import { LocaleLink as Link } from "@/components/locale-link";
import { CtaSurface } from "@/components/cta-surface";
import { ArrowRight, MessageCircle, ShieldCheck } from "lucide-react";
import { FaqAccordion } from "@/components/faq-accordion";
import { JsonLd } from "@/components/json-ld";
import { PageHero } from "@/components/page-hero";
import { imagery } from "@/lib/imagery";
import { getSettings, whatsappHref } from "@/lib/settings";
import { ProcessTimeline } from "@/components/process-timeline";
import {
  BUYING_COST_KEYS,
  BUYING_COSTS,
  BUYING_STEPS,
} from "@/lib/process";
import { getProcessCopy, getT } from "@/lib/i18n/server";
import { breadcrumbSchema, faqSchema, howToSchema } from "@/lib/schema";
import { currentLocale } from "@/lib/current-locale";
import { HOME_CRUMB, pageMetadata, type Crumb } from "@/lib/seo";


const PATH = "/buying-process";
const CRUMBS: Crumb[] = [
  HOME_CRUMB,
  { name: "Buying process", path: PATH },
];

export async function generateMetadata(): Promise<Metadata> {
  const locale = await currentLocale();
  const t = await getT();

  return pageMetadata({
    title: t("buyingProcess.metaTitle"),
    description: t("buyingProcess.metaDescription"),
    path: PATH,
    locale,
    keywords: [
      "buying property in Turkey",
      "how to buy a villa in Fethiye",
      "Turkey property buying process",
      "TAPU title deed transfer",
      "buying costs Turkey",
      "foreign buyers Turkey property",
    ],
    type: "article",
  });
}

export default async function BuyingProcessPage() {
  /*
    Çeviri katmanı: ikonlar, id'ler ve sıralama lib/process.ts'te kalıyor;
    okunan metin sözlükten geliyor. Schema ve ekran AYNI çevrilmiş listeden
    besleniyor — yapılandırılmış veri sayfayla çelişmesin diye.
  */
  const t = await getT();
  const copy = await getProcessCopy();

  const steps = BUYING_STEPS.map((step) => ({
    ...step,
    ...copy.buyingStep(step.id, step),
  }));

  const costs = BUYING_COSTS.map((cost, index) => ({
    ...cost,
    ...copy.cost(BUYING_COST_KEYS[index], cost),
  }));

  const faqs = copy.buyingFaq();

  const settings = await getSettings();
  return (
    <>
      <JsonLd
        schema={[
          howToSchema({
            name: "How to buy a property in Fethiye, Türkiye",
            /* Schema açıklaması sayfa diliyle aynı — yapılandırılmış
               veri ile görünen içerik çelişmemeli. */
            description: t("buyingProcess.metaDescription"),
            path: PATH,
            totalTime: "P8W",
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
          title={t("buyingProcess.heroTitle")}
          crumbs={CRUMBS}
          image={{
            ...imagery.buyingProcess,
            /* Alt metni çeviriden: erişilebilirlik ve görsel arama
               sinyali sayfanın diliyle aynı olmalı. */
            alt: t("imagery.named.buyingProcess"),
          }}
        />

        {/* ------------------------------------------------------ ZAMAN ÇİZGİSİ */}
        <section aria-labelledby="steps-heading" className="bg-shell py-section">
          <div className="container-page grid gap-8 sm:gap-16 lg:grid-cols-12">
            {/*
              Sol sütun sticky: kullanıcı sekiz adım boyunca aşağı inerken
              bağlam ve iletişim çağrısı ekranda kalır.
            */}
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-28">
                <p className="eyebrow text-sea">{t("buyingProcess.stagesEyebrow")}</p>
                <h2
                  id="steps-heading"
                  className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
                >
                  {t("buyingProcess.stagesHeading")}
                </h2>
                <p className="mt-4 sm:mt-6 leading-relaxed text-ink-70">
                  {t("buyingProcess.stagesLede")}
              </p>

                <a
                  href={whatsappHref(settings.contact.whatsappNumber, 
                    "Hello Coast 2 Coast — I have a question about the buying process in Fethiye.",
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 sm:mt-10 inline-flex items-center gap-2 bg-sea px-7 py-3.5 text-sm font-medium text-shell transition-colors hover:bg-sea"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  {t("buyingProcess.askStage")}
                </a>
              </div>
            </div>

            <div className="lg:col-span-7 lg:col-start-6">
              <ProcessTimeline steps={steps} />
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- MALİYETLER */}
        <section
          aria-labelledby="costs-heading"
          className="border-y border-line bg-shell-deep py-section"
        >
          <div className="container-page">
            <header className="max-w-2xl">
              <p className="eyebrow text-sea">{t("buyingProcess.costsEyebrow")}</p>
              <h2
                id="costs-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                {t("buyingProcess.costsHeading")}
              </h2>
              <p className="mt-4 sm:mt-5 text-ink-70">
                {t("buyingProcess.costsLede")}
              </p>
            </header>

            {/*
              AYNI VERİ, İKİ SUNUM — kırılma noktasında biri gizleniyor.

              Mobilde 42rem'lik bir tablo yatay kaydırma kutusuna sığdırılıyordu.
              Teknik olarak çalışıyordu (sayfa gövdesi kaymıyordu) ama kullanıcı
              üç sütunu görmek için parmakla kutuyu itiyor, satır başlığı da
              kayarken gözden kayboluyordu — ücretlerin karşılaştırılması
              imkânsız hâle geliyordu. `md`den itibaren tablo geri geliyor:
              geniş ekranda üç sütun aynı anda görülebildiğinde tablo hâlâ en
              iyi sunum.

              `hidden`/`md:hidden` ikilisi kopyalanan metni erişilebilirlik
              ağacına İKİ KEZ sokmaz: `display: none` olan ağaca hiç girmez,
              yani ekran okuyucu her zaman tek bir sunum duyar.
            */}
            <ul className="mt-6 sm:mt-10 space-y-4 md:hidden">
              {costs.map((cost) => (
                <li
                  key={cost.item}
                  className="border border-line bg-shell p-6"
                >
                  <h3 className="font-display text-lg font-normal leading-snug text-sea-deep">
                    {cost.item}
                  </h3>

                  {/*
                    Etiket ÜSTTE, tutar altında — iki uca yaslamak yerine.
                    `justify-between` denendi ve kartlar arasında tutarsız
                    duruyordu: "£150 – £300" sağa yapışıyor, "4% of the
                    declared value" satıra sığmayıp sola dönüyordu. Aynı
                    bilginin kartlar arasında farklı yerde durması listeyi
                    tarayan gözü yavaşlatır.
                  */}
                  <dl className="mt-4 border-t border-line pt-4">
                    <dt className="eyebrow text-ink-40">{t("buyingProcess.colAmount")}</dt>
                    <dd className="mt-1.5 text-sm text-sea-deep">
                      {cost.amount}
                    </dd>
                  </dl>

                  <p className="mt-3 text-sm leading-relaxed text-ink-70">
                    {cost.note}
                  </p>
                </li>
              ))}
            </ul>

            {/*
              `md`den itibaren tablo. `overflow-x-auto` yerinde duruyor: 768px
              ile 800px arasında sütunlar kıl payı sığıyor ve ileride bir
              sütun eklenirse sayfa gövdesi yerine bu kutu kaysın.
            */}
            <div className="mt-8 sm:mt-14 hidden overflow-x-auto md:block">
              <table className="w-full min-w-[42rem] border-collapse text-left">
                <caption className="sr-only">
                  {t("buyingProcess.costsTableCaption")}
              </caption>
                <thead>
                  <tr className="border-b border-sea-deep/20">
                    <th
                      scope="col"
                      className="eyebrow py-4 pr-6 text-ink-40"
                    >
                      {t("buyingProcess.colItem")}
                    </th>
                    <th
                      scope="col"
                      className="eyebrow py-4 pr-6 text-ink-40"
                    >
                      {t("buyingProcess.colAmount")}
                    </th>
                    <th scope="col" className="eyebrow py-4 text-ink-40">
                      {t("buyingProcess.colNotes")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {costs.map((cost) => (
                    <tr key={cost.item} className="border-b border-line">
                      <th
                        scope="row"
                        className="py-6 pr-6 align-top font-display text-lg font-normal leading-snug text-sea-deep"
                      >
                        {cost.item}
                      </th>
                      <td className="py-6 pr-6 align-top text-sm text-sea-deep">
                        {cost.amount}
                      </td>
                      <td className="py-6 align-top text-sm leading-relaxed text-ink-70">
                        {cost.note}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-6 sm:mt-10 inline-flex max-w-2xl items-start gap-3 text-xs leading-relaxed text-ink-40">
              <ShieldCheck
                className="mt-0.5 size-4 shrink-0 text-sea"
                aria-hidden="true"
              />
              {t("buyingProcess.costsDisclaimer")}
            </p>
          </div>
        </section>

        {/* -------------------------------------------------------------- SSS */}
        <section aria-labelledby="faq-heading" className="bg-shell py-section">
          <div className="container-page grid gap-8 sm:gap-16 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="eyebrow text-sea">{t("buyingProcess.faqEyebrow")}</p>
              <h2
                id="faq-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                {t("buyingProcess.faqHeading")}
              </h2>
              <p className="mt-4 sm:mt-5 text-ink-70">
                {t("buyingProcess.faqFooter")}
              </p>
            </div>

            <div className="lg:col-span-6 lg:col-start-7">
              <FaqAccordion faqs={faqs} groupName="buying-faq" />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- CTA */}
        <section aria-labelledby="buying-cta" className="bg-shell pb-section">
          <div className="container-page">
            <CtaSurface className="grid gap-8 sm:gap-12 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-7">
                <h2
                  id="buying-cta"
                  className="font-display text-3xl leading-tight sm:text-4xl"
                >
                  {t("buyingProcess.ctaHeading")}
                </h2>
                <p className="mt-4 sm:mt-6 max-w-xl leading-relaxed text-shell/80">
                  {t("buyingProcess.ctaBody")}
              </p>
              </div>

              <div className="flex flex-col gap-4 lg:col-span-4 lg:col-start-9">
                <Link
                  href="/properties"
                  className="inline-flex items-center justify-center gap-2 bg-shell px-8 py-4 text-sm font-medium text-sea-deep transition-colors hover:bg-white"
                >
                  {t("buyingProcess.ctaBrowse")}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 border border-shell/40 px-8 py-4 text-sm font-medium transition-colors hover:bg-shell/10"
                >
                  {t("buyingProcess.ctaTrip")}
                </Link>
                <p className="mt-2 text-xs leading-relaxed text-shell/60">
                  Selling instead?{" "}
                  <Link
                    href="/selling-process"
                    className="underline underline-offset-4 hover:text-shell"
                  >
                    {t("buyingProcess.ctaSelling")}
                  </Link>
                  .
                </p>
              </div>
            </CtaSurface>
          </div>
        </section>
      </main>
    </>
  );
}
