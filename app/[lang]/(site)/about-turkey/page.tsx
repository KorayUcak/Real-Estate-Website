import type { Metadata } from "next";
import Image from "next/image";
import { LocaleLink as Link } from "@/components/locale-link";
import { CtaSurface } from "@/components/cta-surface";
import { ArrowRight, Check, MapPin, MessageCircle } from "lucide-react";
import { FaqAccordion } from "@/components/faq-accordion";
import { JsonLd } from "@/components/json-ld";
import { imagery } from "@/lib/imagery";
import { getSettings, whatsappHref } from "@/lib/settings";
import { PageHero } from "@/components/page-hero";
import { areaPlaceSchema, breadcrumbSchema, faqSchema } from "@/lib/schema";
import { currentLocale } from "@/lib/current-locale";
import { HOME_CRUMB, pageMetadata, type Crumb } from "@/lib/seo";
import {
  getAreaCopy,
  getT,
  getTurkeyCopy,
} from "@/lib/i18n/server";
import { serviceAreas } from "@/lib/site";
import {
  AREA_DETAIL,
  isAreaVisibleInGuide,
  INVESTMENT_KEYS,
  INVESTMENT_REASONS,
  LIFESTYLE_FACTS,
  LIFESTYLE_KEYS,
} from "@/lib/turkey";
import { getAreaCounts } from "@/lib/villas";


const PATH = "/about-turkey";
const CRUMBS: Crumb[] = [HOME_CRUMB, { name: "About Turkey", path: PATH }];

export async function generateMetadata(): Promise<Metadata> {
  const locale = await currentLocale();
  const t = await getT();

  return pageMetadata({
    title: t("aboutTurkey.metaTitle"),
    description: t("aboutTurkey.metaDescription"),
    path: PATH,
    locale,
    keywords: [
      "living in Fethiye",
      "moving to Turkey from abroad",
      "expat life Fethiye",
      "why invest in Turkish property",
      "Fethiye climate and lifestyle",
      "best areas Fethiye Turkey",
      "retiring to Turkey",
      "Turkey turquoise coast property",
    ],
    type: "article",
  });
}

export default async function AboutTurkeyPage() {
  const settings = await getSettings();
  const areaCounts = await getAreaCounts();

  /** Bölge kartlarında "şu an N ilan" göstermek için — canlı ve dürüst bir sinyal. */
  /*
    Çeviri katmanı: yapısal veri (ikon, slug, sıralama, schema alanları)
    lib/turkey.ts'te kalıyor; insanın okuduğu metin sözlükten geliyor.
  */
  const t = await getT();
  const copy = await getTurkeyCopy();
  /* `headline` ve `blurb` ana sayfayla ORTAK sözlükten geliyor —
     iki sayfada aynı bölgeyi iki farklı çeviriyle anlatmamak için. */
  const areaCopy = await getAreaCopy();
  const faqs = copy.faq();

  const areas = serviceAreas
    .filter((area) => isAreaVisibleInGuide(area.slug))
    .map((area) => ({
      ...area,
      ...areaCopy(area.slug, { headline: area.headline, blurb: area.blurb }),
      detail: AREA_DETAIL[area.slug]
        ? copy.areaDetail(area.slug, AREA_DETAIL[area.slug])
        : undefined,
      count: areaCounts[area.slug] ?? 0,
    }));

  return (
    <>
      <JsonLd
        schema={[
          faqSchema(faqs),
          /*
            Her bölge, sayfadaki kendi bölümüne bağlı bir Place varlığı
            olarak tanımlanır — bu yüzden AYNI süzgeçten geçiyor. Gizlenen
            bir bölge için Place basmak, sayfada var olmayan bir `#area-…`
            çapasına `@id` veren bir varlık beyan etmek olurdu: Google'ın
            "structured data does not match visible content" başlığı altında
            işaretlediği tam olarak bu.
          */
          ...serviceAreas
            .filter((area) => isAreaVisibleInGuide(area.slug))
            .map((area) => areaPlaceSchema(area)),
          breadcrumbSchema(CRUMBS),
        ]}
      />

      <main id="main">
        <PageHero
          title={t("aboutTurkey.heroTitle")}
          crumbs={CRUMBS}
          image={{
            ...imagery.aboutTurkey,
            /* Alt metni çeviriden: erişilebilirlik ve görsel arama
               sinyali sayfanın diliyle aynı olmalı. */
            alt: t("imagery.named.aboutTurkey"),
          }}
        >
          {/*
            İkinci buton fotoğraflı hero üzerinde LACİVERT metinle duruyordu
            (`text-sea-deep`) — koyu bir manzaranın üstünde neredeyse
            görünmezdi. Işıklı zemin varyantına geçirildi; ikisi de artık
            projenin ortak `.btn` diliyle yazılıyor.
          */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <a href="#areas" className="btn btn-light">
              {t("aboutTurkey.jumpToAreas")}
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
            <Link href="/viewing-day" className="btn btn-outline-light">
              {t("aboutTurkey.seeForYourself")}
            </Link>
          </div>
        </PageHero>

        {/* --------------------------------------------------- NEDEN TÜRKİYE */}
        <section
          aria-labelledby="invest-heading"
          className="bg-shell py-section"
        >
          <div className="container-page">
            <header className="max-w-2xl">
              <p className="eyebrow text-sea">{t("aboutTurkey.whyEyebrow")}</p>
              <h2
                id="invest-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                {t("aboutTurkey.whyHeading")}
              </h2>
              <p className="mt-4 sm:mt-5 text-ink-70">
                {t("aboutTurkey.whyLede")}
              </p>
            </header>

            <ul className="mt-8 sm:mt-16 grid gap-x-12 gap-y-8 sm:gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {INVESTMENT_REASONS.map((source, index) => {
                const reason = copy.investment(INVESTMENT_KEYS[index], source);

                return (
                <li key={INVESTMENT_KEYS[index]} className="border-t border-line pt-6 sm:pt-8">
                  <p className="font-display text-sm text-ink-40">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-4 font-display text-xl leading-snug text-sea-deep">
                    {reason.title}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-ink-70">
                    {reason.body}
                  </p>
                </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* ------------------------------------------------ YAŞAM & İKLİM */}
        <section
          aria-labelledby="lifestyle-heading"
          className="border-y border-line bg-shell-deep py-section"
        >
          <div className="container-page grid gap-8 sm:gap-16 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-5">
              <div className="relative aspect-[4/3] sm:aspect-[4/5] overflow-hidden bg-shell">
                <Image
                  src={imagery.aboutTurkey.src}
                  alt={t("common.aboutTurkeyImageAlt")}
                  fill
                  sizes="(min-width: 1024px) 42vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="lg:col-span-6 lg:col-start-7">
              <p className="eyebrow text-sea">Daily life</p>
              <h2
                id="lifestyle-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                {t("aboutTurkey.livingHeading")}
              </h2>
              <p className="mt-4 sm:mt-6 leading-relaxed text-ink-70">
                {t("aboutTurkey.livingLede")}
              </p>

              <dl className="mt-8 sm:mt-14 space-y-6 sm:space-y-10">
                {LIFESTYLE_FACTS.map((source, index) => {
                  const fact = {
                    ...source,
                    ...copy.lifestyle(LIFESTYLE_KEYS[index], source),
                  };

                  return (
                  <div key={LIFESTYLE_KEYS[index]} className="border-t border-line pt-6 sm:pt-8">
                    <dt className="inline-flex items-center gap-3 font-display text-xl text-sea-deep">
                      <fact.icon
                        className="size-5 shrink-0 text-sea"
                        aria-hidden="true"
                      />
                      {fact.title}
                    </dt>
                    <dd className="mt-4 text-sm leading-relaxed text-ink-70">
                      {fact.body}
                    </dd>
                  </div>
                  );
                })}
              </dl>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ BÖLGELER */}
        <section
          aria-labelledby="areas-heading"
          id="areas"
          className="scroll-mt-24 bg-shell py-section"
        >
          <div className="container-page">
            {/*
              Bölüm başlığı tek satıra indirildi: alt metin kaldırıldığı için
              başlık artık sayfanın ortasına hizalanıyor (`text-center`).
            */}
            <header className="mx-auto max-w-2xl text-center">
              <h2
                id="areas-heading"
                className="font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                {t("aboutTurkey.areasHeading")}
              </h2>
            </header>
          </div>

          {/*
            Bölümler dönüşümlü yerleşimle render edilir: tek numaralılarda görsel
            sağda. Uzun bir listede tek düze bir ritmi kırmak, okurun sayfayı
            taramasını kolaylaştırır.
          */}
          <div className="mt-12 sm:mt-24 space-y-12 sm:space-y-24 lg:space-y-32">
            {areas.map((area, index) => {
              const imageRight = index % 2 === 1;

              return (
                <article
                  key={area.slug}
                  id={`area-${area.slug}`}
                  className="container-page scroll-mt-24"
                >
                  <div className="grid gap-8 sm:gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
                    <div
                      className={`lg:col-span-5 ${
                        imageRight ? "lg:order-2 lg:col-start-8" : ""
                      }`}
                    >
                      <div className="relative aspect-[4/3] sm:aspect-[4/5] overflow-hidden bg-shell-deep">
                        <Image
                          src={area.image}
                          alt={`${area.name} near Fethiye, Türkiye — ${area.headline}`}
                          fill
                          sizes="(min-width: 1024px) 40vw, 100vw"
                          className="object-cover"
                        />
                      </div>
                    </div>

                    <div
                      className={`lg:col-span-6 ${
                        imageRight ? "lg:order-1 lg:col-start-1" : "lg:col-start-7"
                      }`}
                    >
                      <p className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-sea">
                        <MapPin className="size-3.5" aria-hidden="true" />
                        {area.headline}
                      </p>

                      <h3 className="mt-4 sm:mt-5 font-display text-3xl leading-tight text-sea-deep sm:text-4xl">
                        {area.name}
                      </h3>

                      <p className="mt-4 sm:mt-6 leading-relaxed text-ink-70">
                        {area.detail?.intro ?? area.blurb}
                      </p>

                      <ul className="mt-5 sm:mt-8 space-y-4">
                        {(area.detail?.points ?? []).map((point) => (
                          <li
                            key={point}
                            className="flex gap-4 text-sm leading-relaxed text-ink-70"
                          >
                            <Check
                              className="mt-0.5 size-4 shrink-0 text-gold-deep"
                              aria-hidden="true"
                            />
                            {point}
                          </li>
                        ))}
                      </ul>

                      <dl className="mt-6 sm:mt-10 flex flex-wrap items-center gap-x-10 gap-y-4 border-t border-line pt-5 sm:pt-7">
                        <div>
                          <dt className="eyebrow text-ink-40">{t("aboutTurkey.bestForLabel")}</dt>
                          <dd className="mt-2 text-sm text-sea-deep">
                            {area.detail?.bestFor ?? "—"}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/*
          "Worth the drive" (yakın çevredeki yerler) bölümü kaldırıldı — sayfa
          bölge rehberlerinden doğrudan SSS'ye geçiyor. Veri kaynağı
          `NEARBY_PLACES` yerinde duruyor; geri istenirse tekrar bağlanabilir.
        */}

        {/* ------------------------------------------------------------- SSS */}
        <section
          aria-labelledby="faq-heading"
          className="border-t border-line bg-shell py-section"
        >
          <div className="container-page grid gap-8 sm:gap-16 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="eyebrow text-sea">{t("aboutTurkey.faqEyebrow")}</p>
              <h2
                id="faq-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                {t("aboutTurkey.faqHeading")}
              </h2>
              <p className="mt-4 sm:mt-5 text-ink-70">
                {t("aboutTurkey.faqLede")}
              </p>
            </div>

            <div className="lg:col-span-6 lg:col-start-7">
              <FaqAccordion faqs={faqs} groupName="turkey-faq" />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- CTA */}
        <section aria-labelledby="turkey-cta" className="bg-shell pb-section">
          <div className="container-page">
            <CtaSurface className="grid gap-8 sm:gap-12 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-7">
                <h2
                  id="turkey-cta"
                  className="font-display text-3xl leading-tight sm:text-4xl"
                >
                  {t("aboutTurkey.ctaHeading")}
                </h2>
                <p className="mt-4 sm:mt-6 max-w-xl leading-relaxed text-shell/80">
                  {t("aboutTurkey.ctaBody")}
                </p>
              </div>

              <div className="flex flex-col gap-4 lg:col-span-4 lg:col-start-9">
                <Link
                  href="/viewing-day"
                  className="inline-flex items-center justify-center gap-2 bg-shell px-8 py-4 text-sm font-medium text-sea-deep transition-colors hover:bg-white"
                >
                  {t("aboutTurkey.ctaPrimary")}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <a
                  href={whatsappHref(settings.contact.whatsappNumber, 
                    "Hello Coast 2 Coast — I'd like to know more about living in the Fethiye area.",
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 border border-shell/40 px-8 py-4 text-sm font-medium transition-colors hover:bg-shell/10"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  {t("aboutTurkey.ctaSecondary")}
                </a>
              </div>
            </CtaSurface>
          </div>
        </section>
      </main>
    </>
  );
}
