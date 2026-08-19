import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessageCircle, ShieldCheck } from "lucide-react";
import { FaqAccordion } from "@/components/faq-accordion";
import { JsonLd } from "@/components/json-ld";
import { PageHero } from "@/components/page-hero";
import { imagery } from "@/lib/imagery";
import { getSettings, whatsappHref } from "@/lib/settings";
import { ProcessTimeline } from "@/components/process-timeline";
import { BUYING_COSTS, BUYING_FAQS, BUYING_STEPS } from "@/lib/process";
import { breadcrumbSchema, faqSchema, howToSchema } from "@/lib/schema";
import { HOME_CRUMB, pageMetadata, type Crumb } from "@/lib/seo";

const PAGE_TITLE = "The Buying Process in Fethiye, Step by Step";
const PAGE_DESCRIPTION =
  "How buying a property in Fethiye actually works, from the first brief to the title deed. Eight stages, four to eight weeks, and the full 6–8% of purchase costs set out before you commit.";

const PATH = "/buying-process";
const CRUMBS: Crumb[] = [
  HOME_CRUMB,
  { name: "Buying process", path: PATH },
];

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: PATH,
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

const AT_A_GLANCE = [
  { value: "4–8", label: "Weeks from offer to title deed" },
  { value: "6–8%", label: "Purchase costs on top of the price" },
  { value: "8", label: "Stages, all handled for you" },
  { value: "1", label: "Named contact throughout" },
];

export default async function BuyingProcessPage() {
  const settings = await getSettings();
  return (
    <>
      <JsonLd
        schema={[
          howToSchema({
            name: "How to buy a property in Fethiye, Türkiye",
            description: PAGE_DESCRIPTION,
            path: PATH,
            totalTime: "P8W",
            steps: BUYING_STEPS.map((step) => ({
              title: step.title,
              body: step.summary,
            })),
          }),
          faqSchema(BUYING_FAQS),
          breadcrumbSchema(CRUMBS),
        ]}
      />

      <main id="main">
        <PageHero
          eyebrow="The buying process"
          title="Buying a property in Fethiye, one stage at a time"
          lede="Türkiye's land registry is faster and cleaner than most buyers expect. What catches people out is the sequence — the valuation report, the currency certificate, the insurance that must exist before a deed can move. Here is all of it, in order."
          crumbs={CRUMBS}
          image={imagery.buyingProcess}
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

        {/* ------------------------------------------------------ ZAMAN ÇİZGİSİ */}
        <section aria-labelledby="steps-heading" className="bg-shell py-section">
          <div className="container-page grid gap-8 sm:gap-16 lg:grid-cols-12">
            {/*
              Sol sütun sticky: kullanıcı sekiz adım boyunca aşağı inerken
              bağlam ve iletişim çağrısı ekranda kalır.
            */}
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-28">
                <p className="eyebrow text-sea">Stage by stage</p>
                <h2
                  id="steps-heading"
                  className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
                >
                  From first brief to keys in hand
                </h2>
                <p className="mt-4 sm:mt-6 leading-relaxed text-ink-70">
                  Nothing on this list happens without your written sign-off, and
                  every stage has a named person responsible for it.
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
                  Ask about a stage
                </a>
              </div>
            </div>

            <div className="lg:col-span-7 lg:col-start-6">
              <ProcessTimeline steps={BUYING_STEPS} />
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
              <p className="eyebrow text-sea">The real number</p>
              <h2
                id="costs-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                What a purchase costs on top of the price
              </h2>
              <p className="mt-4 sm:mt-5 text-ink-70">
                Budget 6–8% of the purchase price. Percentages below are set by
                statute; cash figures are the market range we see in the Fethiye
                area and are quoted per transaction.
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
              {BUYING_COSTS.map((cost) => (
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
                    <dt className="eyebrow text-ink-40">Typical amount</dt>
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
                  Typical costs of buying a property in Fethiye, in addition to
                  the purchase price
                </caption>
                <thead>
                  <tr className="border-b border-sea-deep/20">
                    <th
                      scope="col"
                      className="eyebrow py-4 pr-6 text-ink-40"
                    >
                      Item
                    </th>
                    <th
                      scope="col"
                      className="eyebrow py-4 pr-6 text-ink-40"
                    >
                      Typical amount
                    </th>
                    <th scope="col" className="eyebrow py-4 text-ink-40">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {BUYING_COSTS.map((cost) => (
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
              Guidance only, current at the time of writing, and not legal or tax
              advice. Rates and thresholds are set by the Turkish government and
              change — we confirm the exact figures for your purchase in writing
              before you commit.
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
                Questions buyers ask us first
              </h2>
              <p className="mt-4 sm:mt-5 text-ink-70">
                Something not covered here? Ask — you will get a person, not a
                form response.
              </p>
            </div>

            <div className="lg:col-span-6 lg:col-start-7">
              <FaqAccordion faqs={BUYING_FAQS} groupName="buying-faq" />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- CTA */}
        <section aria-labelledby="buying-cta" className="bg-shell pb-section">
          <div className="container-page">
            <div className="grid gap-8 sm:gap-12 bg-sea-deep px-8 py-10 sm:py-16 text-shell sm:px-14 lg:grid-cols-12 lg:items-center lg:px-20 lg:py-24">
              <div className="lg:col-span-7">
                <h2
                  id="buying-cta"
                  className="font-display text-3xl leading-tight sm:text-4xl"
                >
                  Ready to see the shortlist?
                </h2>
                <p className="mt-4 sm:mt-6 max-w-xl leading-relaxed text-shell/80">
                  Send us your budget and timeline and we will come back with
                  properties that fit — plus a written breakdown of what the
                  purchase would cost you all in.
                </p>
              </div>

              <div className="flex flex-col gap-4 lg:col-span-4 lg:col-start-9">
                <Link
                  href="/properties"
                  className="inline-flex items-center justify-center gap-2 bg-shell px-8 py-4 text-sm font-medium text-sea-deep transition-colors hover:bg-white"
                >
                  Browse villas for sale
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 border border-shell/40 px-8 py-4 text-sm font-medium transition-colors hover:bg-shell/10"
                >
                  Arrange a viewing trip
                </Link>
                <p className="mt-2 text-xs leading-relaxed text-shell/60">
                  Selling instead?{" "}
                  <Link
                    href="/selling-process"
                    className="underline underline-offset-4 hover:text-shell"
                  >
                    See how we sell property in Fethiye
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
