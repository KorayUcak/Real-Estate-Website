import type { Metadata } from "next";
import { LocaleLink as Link } from "@/components/locale-link";
import {
  ArrowRight,
  Check,
  MessageCircle,
  Phone,
  X,
} from "lucide-react";
import { FaqAccordion } from "@/components/faq-accordion";
import { JsonLd } from "@/components/json-ld";
import { PageHero } from "@/components/page-hero";
import { imagery } from "@/lib/imagery";
import { getSettings, whatsappHref } from "@/lib/settings";
import { ViewingTripForm } from "@/components/viewing-trip-form";
import { breadcrumbSchema, faqSchema, serviceSchema } from "@/lib/schema";
import { currentLocale } from "@/lib/current-locale";
import { getT, getViewingDayCopy } from "@/lib/i18n/server";
import { HOME_CRUMB, pageMetadata, type Crumb } from "@/lib/seo";

import {
  HOSTS,
} from "@/lib/viewing-trip";


const PATH = "/viewing-day";
const CRUMBS: Crumb[] = [HOME_CRUMB, { name: "Viewing Day", path: PATH }];

export async function generateMetadata(): Promise<Metadata> {
  const locale = await currentLocale();
  const t = await getT();

  return pageMetadata({
    title: t("viewingDay.metaTitle"),
    description: t("viewingDay.metaDescription"),
    path: PATH,
    locale,
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

/* Rakamlar sabit, etiketler çeviriden (modül kapsamında `t()` yok). */
const TRIP_STATS = [
  { value: "2–3", key: "viewingDay.statDays" },
  { value: "6–8", key: "viewingDay.statProperties" },
  { value: "£0", key: "viewingDay.statCost" },
  { value: "1", key: "viewingDay.statConsultant" },
] as const;

export default async function ViewingDayPage() {
  const t = await getT();
  const copy = await getViewingDayCopy();
  const faqs = copy.faq();

  const settings = await getSettings();
  const whatsappMessage =
    t("viewingDay.whatsappMessage");

  return (
    <>
      <JsonLd
        schema={[
          serviceSchema({
            name: t("viewingDay.serviceName"),
            description: t("viewingDay.metaDescription"),
            path: PATH,
            serviceType: "Property viewing and inspection trip",
            /*
              `offers` KALDIRILDI: gün gün itinerer sayfadan çıkınca, onu
              yapılandırılmış veride ilan etmeye devam etmek sayfada
              görünmeyen bir içeriği beyan etmek olurdu. Alan opsiyonel,
              yokluğunda serviceSchema bloğu hiç basmıyor.
            */
          }),
          faqSchema(faqs),
          breadcrumbSchema(CRUMBS),
        ]}
      />

      <main id="main">
        <PageHero
          eyebrow={t("viewingDay.heroEyebrow")}
          title={t("viewingDay.heroTitle")}
          lede={t("viewingDay.heroLede", { host1: HOSTS[0], host2: HOSTS[1] })}
          crumbs={CRUMBS}
          image={{
            ...imagery.viewingDay,
            /* Alt metni çeviriden: erişilebilirlik ve görsel arama
               sinyali sayfanın diliyle aynı olmalı. */
            alt: t("imagery.named.viewingDay"),
          }}
        >
          <div className="flex flex-col gap-8">
            <dl className="grid grid-cols-2 gap-x-8 gap-y-6 sm:gap-y-10 border-t border-line pt-6 sm:pt-10 sm:grid-cols-4">
              {TRIP_STATS.map((stat) => (
                <div key={stat.key}>
                  <dt className="sr-only">{t(stat.key)}</dt>
                  <dd>
                    <span className="block font-display text-4xl text-sea-deep">
                      {stat.value}
                    </span>
                    <span className="mt-2 block text-xs leading-relaxed text-ink-40">
                      {t(stat.key)}
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
                {t("viewingDay.ctaBook")}
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
              <a
                href={whatsappHref(settings.contact.whatsappNumber, whatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 border border-line px-8 py-4 text-sm font-medium text-sea-deep transition-colors hover:bg-shell-deep"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                {t("viewingDay.ctaAsk")}
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
                {t("viewingDay.includedHeading")}
              </h2>
              <ul className="mt-6 sm:mt-10 space-y-5">
                {copy.included.map((item) => (
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
                {t("viewingDay.notDoingHeading")}
              </h2>
              <p className="mt-4 sm:mt-5 text-sm leading-relaxed text-ink-70">
                {t("viewingDay.notDoingLede")}
              </p>
              <ul className="mt-6 sm:mt-10 space-y-5">
                {copy.notDoing.map((item) => (
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

        {/* ------------------------------------------- REZERVASYON */}
        {/*
          BU BÖLÜM ESKİDEN İKİ SÜTUNLUYDU: solda gün gün itinerer, sağda
          yapışkan rezervasyon formu. İtinerer kaldırıldı — form KALDI.

          Formu da silmek kolay olurdu ve yanlış olurdu: sayfanın tek
          dönüşüm noktası bu ve `#book` çapası buraya bakıyor. Ama tek
          başına kalan bir `lg:col-span-4 lg:col-start-9` öğesi, ekranın
          sol üçte ikisi boşken sağa yaslanmış bir form demekti. Bu yüzden
          ızgara çözüldü ve form ortalanmış tek sütuna alındı.

          Yapışkanlık da gitti: yanında kaydırılacak bir metin kalmadığında
          `position: sticky` hiçbir şey yapmaz.
        */}
        <section
          aria-labelledby="book-heading"
          id="book"
          className="scroll-mt-24 border-t border-line bg-shell-deep py-section"
        >
          <div className="container-page">
            <div className="mx-auto max-w-2xl">
              <div className="border border-line bg-shell p-7 sm:p-10">
                <h2
                  id="book-heading"
                  className="font-display text-2xl leading-snug text-sea-deep sm:text-3xl"
                >
                  {t("viewingDay.bookHeading")}
                </h2>
                <p className="mt-4 leading-relaxed text-ink-70">
                  {t("viewingDay.bookBody")}
              </p>

                <div className="mt-5 sm:mt-8">
                  <ViewingTripForm />
                </div>
              </div>

              <div className="mt-4 sm:mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <a
                  href={whatsappHref(settings.contact.whatsappNumber, whatsappMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-sea px-6 py-3.5 text-sm font-medium text-shell transition-colors hover:bg-sea-deep"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  {t("viewingDay.bookWhatsapp")}
                </a>
                <a
                  href={`tel:${settings.contact.phoneE164}`}
                  className="inline-flex items-center justify-center gap-2 border border-line bg-shell px-6 py-3.5 text-sm font-medium text-sea-deep transition-colors hover:border-sea hover:text-sea"
                >
                  <Phone className="size-4" aria-hidden="true" />
                  {settings.contact.phoneDisplay}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- SSS */}
        <section
          aria-labelledby="faq-heading"
          className="border-t border-line bg-shell-deep py-section"
        >
          <div className="container-page grid gap-8 sm:gap-16 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="eyebrow text-sea">{t("viewingDay.faqEyebrow")}</p>
              <h2
                id="faq-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                {t("viewingDay.faqHeading")}
              </h2>
              <p className="mt-4 sm:mt-5 text-ink-70">
                {t("viewingDay.faqLede")}
              </p>
            </div>

            <div className="lg:col-span-6 lg:col-start-7">
              <FaqAccordion faqs={faqs} groupName="viewing-faq" />
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
                  {t("viewingDay.finalHeading")}
                </h2>
                <p className="mt-4 sm:mt-6 max-w-xl leading-relaxed text-shell/85">
                  {t("viewingDay.finalBody")}
              </p>
              </div>

              <div className="flex flex-col gap-4 lg:col-span-4 lg:col-start-9">
                <Link
                  href="/properties"
                  className="inline-flex items-center justify-center gap-2 bg-shell px-8 py-4 text-sm font-medium text-sea transition-colors hover:bg-white"
                >
                  {t("viewingDay.finalPrimary")}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/about-turkey"
                  className="inline-flex items-center justify-center gap-2 border border-shell/40 px-8 py-4 text-sm font-medium transition-colors hover:bg-shell/10"
                >
                  {t("viewingDay.finalSecondary")}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
