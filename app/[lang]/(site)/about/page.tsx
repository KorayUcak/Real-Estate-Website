import type { Metadata } from "next";
import Image from "next/image";
import { LocaleLink as Link } from "@/components/locale-link";
import {
  ArrowRight,
  Compass,
  Eye,
  Handshake,
  MessageCircle,
  Scale,
  ShieldCheck,
  Target,
} from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { imagery } from "@/lib/imagery";
import { getSettings, whatsappHref } from "@/lib/settings";
import { PageHero } from "@/components/page-hero";
import { aboutPageSchema, breadcrumbSchema } from "@/lib/schema";
import { currentLocale } from "@/lib/current-locale";
import { getAboutCopy, getT } from "@/lib/i18n/server";
import { HOME_CRUMB, pageMetadata, type Crumb } from "@/lib/seo";
import { siteConfig } from "@/lib/site";


const CRUMBS: Crumb[] = [HOME_CRUMB, { name: "About", path: "/about" }];

export async function generateMetadata(): Promise<Metadata> {
  const locale = await currentLocale();
  const t = await getT();

  return pageMetadata({
    title: t("about.metaTitle"),
    description: t("about.metaDescription"),
    path: "/about",
    locale,
    keywords: [
      "Fethiye estate agent",
      "English speaking estate agent Turkey",
      "Coast 2 Coast Properties Turkey",
      "buying property in Turkey advice",
    ],
  });
}

/** Metin sözlükte; burada yalnızca sıra için anahtarlar. */
/**
 * İkonlar KODDA kalıyor, metin sözlükte.
 *
 * İkon bir React bileşeni; JSON'a konamaz. Anahtar ile ikonu yan yana
 * tutmak, sıraya güvenen iki ayrı liste tutmaktan güvenli: biri değişirse
 * diğerinin kayması mümkün değil.
 */
const PRINCIPLES = [
  { key: "represent", icon: Scale },
  { key: "language", icon: Eye },
  { key: "contact", icon: Handshake },
  { key: "say-no", icon: ShieldCheck },
] as const;



export default async function AboutPage() {
  const t = await getT();
  const copy = await getAboutCopy();

  const settings = await getSettings();
  return (
    <>
      <JsonLd
        schema={[aboutPageSchema(t("about.metaDescription")), breadcrumbSchema(CRUMBS)]}
      />

      <main id="main">
        <PageHero
          eyebrow={`Boutique consultancy · Fethiye · since ${siteConfig.founded}`}
          title={t("about.heroTitle")}
          lede={t("about.heroLede")}
          crumbs={CRUMBS}
          image={{
            ...imagery.about,
            /* Alt metni çeviriden: erişilebilirlik ve görsel arama
               sinyali sayfanın diliyle aynı olmalı. */
            alt: t("imagery.named.about"),
          }}
        />

        <section aria-labelledby="story-heading" className="bg-shell py-section">
          <div className="container-page grid gap-8 sm:gap-16 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-6">
              <div className="relative aspect-[4/3] sm:aspect-[4/5] overflow-hidden bg-shell-deep">
                <Image
                  src={imagery.about.src}
                  alt={t("about.imageAlt")}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="lg:col-span-5 lg:col-start-8">
              <p className="eyebrow text-sea">{t("about.storyEyebrow")}</p>
              <h2
                id="story-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                {t("about.storyHeading")}
              </h2>

              <div className="mt-5 sm:mt-8 space-y-5 sm:space-y-6 leading-relaxed text-ink-70">
                <p>
                  {t("about.storyP1")}
              </p>
                <p>
                  {t("about.storyP2")}
              </p>
                <p>
                  {t("about.storyP3")}
              </p>
              </div>

              <Link
                href="/buying-process"
                className="group mt-6 sm:mt-10 inline-flex items-center gap-2 text-sm text-sea-deep underline-offset-4 hover:underline"
              >
                {t("about.storyCta")}
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------- VİZYON & MİSYON */}
        <section
          aria-labelledby="vision-heading"
          className="border-y border-line bg-shell-deep py-section"
        >
          <div className="container-page">
            <h2 id="vision-heading" className="sr-only">
              {t("about.visionEyebrow")}
            </h2>

            <div className="grid gap-8 sm:gap-12 lg:grid-cols-2">
              <article className="flex flex-col bg-shell p-10 sm:p-14">
                <Compass className="size-7 text-sea" aria-hidden="true" />
                <h3 className="mt-5 sm:mt-8 font-display text-2xl text-sea-deep sm:text-3xl">
                  {t("about.visionLabel")}
                </h3>
                <p className="mt-4 sm:mt-6 leading-relaxed text-ink-70">
                  {t("about.visionBody")}
              </p>
              </article>

              <article className="flex flex-col bg-sea-deep p-10 text-shell sm:p-14">
                <Target className="size-7 text-sea" aria-hidden="true" />
                <h3 className="mt-5 sm:mt-8 font-display text-2xl sm:text-3xl">
                  {t("about.missionLabel")}
                </h3>
                <p className="mt-4 sm:mt-6 leading-relaxed text-shell/80">
                  {t("about.missionBody")}
              </p>
              </article>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------- İLKELER */}
        <section
          aria-labelledby="principles-heading"
          className="bg-shell py-section"
        >
          <div className="container-page">
            <header className="max-w-2xl">
              <p className="eyebrow text-sea">{t("about.principlesEyebrow")}</p>
              <h2
                id="principles-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                {t("about.principlesHeading")}
              </h2>
            </header>

            <ul className="mt-8 sm:mt-16 grid gap-x-12 gap-y-8 sm:gap-y-14 sm:grid-cols-2">
              {PRINCIPLES.map((item) => {
                const principle = copy.principle(item.key, {
                  title: "",
                  body: "",
                });

                return (
                  <li key={item.key} className="border-t border-line pt-6 sm:pt-8">
                    <item.icon
                      className="size-6 text-sea"
                      aria-hidden="true"
                    />
                    <h3 className="mt-4 sm:mt-6 font-display text-xl leading-snug text-sea-deep">
                      {principle.title}
                    </h3>
                    <p className="mt-4 text-sm leading-relaxed text-ink-70">
                      {principle.body}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* --------------------------------------------------- NE YAPMAYIZ */}
        <section
          aria-labelledby="not-heading"
          className="border-t border-line bg-shell-deep py-section"
        >
          <div className="container-page grid gap-8 sm:gap-16 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="eyebrow text-sea">{t("about.notDoingEyebrow")}</p>
              <h2
                id="not-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                {t("about.notDoingHeading")}
              </h2>
              <p className="mt-4 sm:mt-6 leading-relaxed text-ink-70">
                {t("about.notDoingLede")}
              </p>
            </div>

            <ul className="space-y-5 sm:space-y-8 lg:col-span-6 lg:col-start-7">
              {copy.notDoing.map((line) => (
                <li
                  key={line}
                  className="border-b border-line pb-6 sm:pb-8 text-base leading-relaxed text-ink-70"
                >
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/*
          TODO: Ekip bölümü. Gerçek isim, fotoğraf ve rol bilgileri hazır olduğunda
          buraya bir "Meet the team" bloğu ekleyin ve schema.ts içindeki
          organizationSchema'ya `employee` alanını bağlayın. Uydurma isim veya
          stok fotoğraf KOYMAYIN — bu sayfanın tek işi güven inşa etmek.
        */}

        {/* ------------------------------------------------------------ CTA */}
        <section aria-labelledby="about-cta" className="bg-shell py-section">
          <div className="container-page">
            <div className="grid gap-8 sm:gap-12 bg-sea px-8 py-10 sm:py-16 text-shell sm:px-14 lg:grid-cols-12 lg:items-center lg:px-20 lg:py-24">
              <div className="lg:col-span-7">
                <h2
                  id="about-cta"
                  className="font-display text-3xl leading-tight sm:text-4xl"
                >
                  {t("about.ctaHeading")}
                </h2>
                <p className="mt-4 sm:mt-6 max-w-xl leading-relaxed text-shell/85">
                  {t("about.ctaBody")}
              </p>
              </div>

              <div className="flex flex-col gap-4 lg:col-span-4 lg:col-start-9">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-shell px-8 py-4 text-sm font-medium text-sea transition-colors hover:bg-white"
                >
                  {t("about.ctaPrimary")}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <a
                  href={whatsappHref(settings.contact.whatsappNumber, 
                    t("about.whatsappMessage"),
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 border border-shell/40 px-8 py-4 text-sm font-medium transition-colors hover:bg-shell/10"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  {t("about.ctaWhatsapp")}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
