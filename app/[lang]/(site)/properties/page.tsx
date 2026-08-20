import type { Metadata } from "next";
import Image from "next/image";
import { LocaleLink as Link } from "@/components/locale-link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { PropertyExplorer } from "@/components/property-explorer";
import { Reveal } from "@/components/reveal";
import { toPropertyCardList } from "@/lib/property-card-data";
import { getSettings, whatsappHref } from "@/lib/settings";
import { imagery } from "@/lib/imagery";
import { breadcrumbSchema, itemListSchema } from "@/lib/schema";
import { currentLocale } from "@/lib/current-locale";
import { getT } from "@/lib/i18n/server";
import { HOME_CRUMB, pageMetadata, type Crumb } from "@/lib/seo";
import { isAreaVisibleInGuide } from "@/lib/turkey";
import { serviceAreas } from "@/lib/site";
import { getAllVillas, getAreaCounts } from "@/lib/villas";

const PAGE_TITLE = "Villas for Sale in Fethiye, Ölüdeniz & Göcek";
const PAGE_DESCRIPTION =
  "Browse every luxury villa and apartment for sale in Fethiye, Ölüdeniz, Hisarönü, Ovacık, Çalış, Üzümlü and Göcek. Each property is walked by us in person, with a clean individual title deed and prices in GBP.";

const CRUMBS: Crumb[] = [HOME_CRUMB, { name: "Properties", path: "/properties" }];

export async function generateMetadata(): Promise<Metadata> {
  const locale = await currentLocale();

  return pageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: "/properties",
    locale,
    keywords: [
      "villas for sale Fethiye",
      "property for sale Ölüdeniz",
      "Turkey property for sale",
      "Göcek villas",
      "Fethiye real estate",
      "buy property Turkey foreigners",
    ],
  });
}

export default async function PropertiesPage() {
  const t = await getT();
  const settings = await getSettings();
  /**
   * Bütün ilanlar tek seferde istemciye geçer ve filtreleme orada yapılır
   * (bkz. components/property-explorer.tsx) — sayfa bu sayede statik üretilir.
   *
   * IZGARA İLK 12 İLANLA AÇILIYOR, gerisi "Load more" ile geliyor. Yani
   * prerender edilmiş HTML artık tüm portföyü İÇERMİYOR. Tarama tarafı bunu
   * iki kanaldan telafi ediyor ve ikisi de bu sayfanın sözleşmesidir:
   *   1. Aşağıdaki ItemList şeması 57 ilanın tamamını URL'leriyle sayıyor.
   *   2. app/sitemap.ts her `/properties/[slug]` sayfasını ayrı ayrı listeliyor.
   * Bu iki kanaldan biri kaldırılırsa 12'den sonraki ilanlar bu sayfa
   * üzerinden keşfedilemez hâle gelir.
   */
  const villas = await getAllVillas();
  const counts = await getAreaCounts();

  /*
    Bu ızgara /about-turkey#area-<slug> çapalarına bağlanıyor, bu yüzden
    rehberden gizlenen bölgeler burada da görünmüyor — aksi hâlde kart
    kullanıcıyı hiçbir yere kaydırmayan bir bağlantıya götürürdü.

    ⚠️ FİLTRE ÇUBUĞU BUNDAN ETKİLENMİYOR: konum süzgeci `serviceAreas`ın
    TAMAMINI kullanmaya devam ediyor, dolayısıyla Dalaman'daki bir villa
    hâlâ filtrelenip bulunabilir.
  */
  const areaCounts = serviceAreas
    .filter((area) => isAreaVisibleInGuide(area.slug))
    .map((area) => ({ ...area, count: counts[area.slug] ?? 0 }))
    .sort((a, b) => b.count - a.count);

  return (
    <>
      <JsonLd
        schema={[
          itemListSchema(
            "Luxury villas for sale in Fethiye and the surrounding coast",
            villas.map((villa) => ({
              url: `/properties/${villa.slug}`,
              name: villa.title,
            })),
          ),
          breadcrumbSchema(CRUMBS),
        ]}
      />

      <main id="main">
        {/* ------------------------------------------------------------- HERO */}
        {/*
          İç sayfa hero'su bilinçli olarak kısa: kullanıcı buraya okumaya değil,
          ilanlara bakmaya geliyor. Bir ekran dolusu pazarlama metni yerine tek
          cümle + üç rakam, ardından doğrudan filtre çubuğu.
        */}
        {/*
          DAR BAŞLIK.
          Eski hero tam ekran bir görsel + üç kutuluk istatistik bandı
          taşıyordu; ilanlar 900 pikselin altına düşüyordu. Burada tek amaç
          var: kullanıcıya nerede olduğunu söyleyip filtreye geçmek.
          İstatistikler kaldırıldı — bu sayfada satmıyorlar, geciktiriyorlar.
        */}
        <section className="border-b border-line bg-white">
          <div className="container-page py-6 sm:py-8">
            <Breadcrumbs crumbs={CRUMBS} />

            {/*
              SAYAÇ KALDIRILDI ("57 live listings").

              Bir rakam portföyü ölçülebilir bir stok hâline getiriyor;
              butik bir danışmanlıkta 57 sayısı "az mı çok mu" sorusunu
              doğuruyor ve iki cevabı da istemiyoruz. Başlık bloğu artık
              satırın tamamını kullanıyor, sağdaki çapaya gerek kalmadı.
            */}
            <div className="mt-5 sm:mt-6">
              <h1 className="text-2xl uppercase leading-[1.1] tracking-[0.02em] text-sea-deep sm:text-3xl lg:text-4xl">
                Villas for sale in Fethiye
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-70">
                {t("properties.lede")}
            </p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------- FİLTRELER + IZGARA */}
        <PropertyExplorer villas={toPropertyCardList(villas)} />

        {/* ---------------------------------------------------------- BÖLGELER */}
        <section
          aria-labelledby="areas-heading"
          className="border-t border-line bg-shell-deep py-section"
        >
          <div className="container-page">
            <Reveal className="flex flex-col gap-6 border-b border-line pb-10 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-xl">
                <p className="eyebrow flex items-center gap-4 text-sea">
                  <span aria-hidden="true" className="block h-px w-10 bg-sea" />
                  {t("properties.areasEyebrow")}
                </p>
                <h2
                  id="areas-heading"
                  className="mt-7 text-3xl uppercase leading-[1.05] text-sea-deep sm:text-4xl"
                >
                  {t("properties.areasHeading")}
                  <span className="block text-ink-40">{t("properties.areasHeadingSub")}</span>
                </h2>
              </div>

              <Link href="/about-turkey" className="btn btn-outline-dark shrink-0">
                {t("properties.areaGuideCta")}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Reveal>

            <ul className="mt-12 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
              {areaCounts.map((area, index) => (
                <li key={area.slug}>
                  <Reveal delay={index * 0.04} y={20}>
                    <Link
                      href={`/about-turkey#area-${area.slug}`}
                      className="group relative isolate flex aspect-square flex-col justify-end overflow-hidden bg-sea-deep p-5 text-shell"
                    >
                      <Image
                        src={area.image}
                        alt=""
                        fill
                        sizes="(min-width: 640px) 25vw, 50vw"
                        className="-z-10 object-cover opacity-75 transition-all duration-700 ease-out group-hover:scale-110 group-hover:opacity-95"
                      />
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 to-ink/10"
                      />
                      <span className="font-display text-base font-semibold uppercase leading-tight tracking-[0.02em]">
                        {area.name}
                      </span>
                      <span className="mt-1.5 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
                        {area.count > 0
                          ? `${area.count} listing${area.count === 1 ? "" : "s"}`
                          : "Area guide"}
                      </span>
                    </Link>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* --------------------------------------------------------------- CTA */}
        <section aria-labelledby="register-heading" className="bg-shell py-section">
          <div className="container-page">
            <Reveal className="relative isolate overflow-hidden bg-sea-deep px-8 py-16 text-shell sm:px-14 lg:px-20">
              <Image
                src={imagery.propertiesCta.src}
                alt=""
                fill
                sizes="(min-width: 1280px) 78rem, 100vw"
                className="-z-10 object-cover"
              />
              <span
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-gradient-to-r from-sea-deep via-sea-deep/92 to-sea-deep/60"
              />

              <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
                <div className="lg:col-span-7">
                  <h2
                    id="register-heading"
                    className="text-3xl uppercase leading-[1.05] sm:text-4xl"
                  >
                    {t("properties.offMarketHeading")}
                  </h2>
                  <p className="mt-6 max-w-xl leading-relaxed text-shell/75">
                    {t("properties.offMarketBody")}
                  </p>
                </div>

                <div className="flex flex-col gap-3 lg:col-span-4 lg:col-start-9">
                  <Link href="/contact" className="btn btn-light">
                    {t("properties.register")}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                  <a
                    href={whatsappHref(settings.contact.whatsappNumber, 
                      "Hello Coast 2 Coast — I'd like to be told about new villas in Fethiye before they are listed.",
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-light"
                  >
                    <MessageCircle className="size-4" aria-hidden="true" />
                    {t("properties.askWhatsapp")}
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
    </>
  );
}
