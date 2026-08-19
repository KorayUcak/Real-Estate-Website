import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, MessageCircle } from "lucide-react";
import { FeaturedProperties } from "@/components/featured-properties";
import { HomeHero } from "@/components/home-hero";
import { JsonLd } from "@/components/json-ld";
import { Reveal } from "@/components/reveal";
import { RevealWindow } from "@/components/reveal-window";
import { imagery } from "@/lib/imagery";
import { getSettings, whatsappHref } from "@/lib/settings";
import { faqSchema, featuredListSchema } from "@/lib/schema";
import { serviceAreas, siteConfig } from "@/lib/site";
import { getAreaCounts, getFeaturedVillas } from "@/lib/villas";

/**
 * Ana sayfa başlığında `absolute` kullanıyoruz: layout'taki
 * "%s | Coast 2 Coast Properties Turkey" şablonu marka adını ikinci kez
 * eklemesin diye. Başlık 60 karakter civarında tutuldu ki SERP'te kırpılmasın.
 */
const PAGE_TITLE = "Luxury Villas for Sale in Fethiye, Ölüdeniz & Göcek";
const PAGE_DESCRIPTION =
  "Hand-picked luxury villas for sale in Fethiye, Ölüdeniz, Hisarönü, Ovacık, Çalış, Üzümlü and Göcek. An international consultancy guiding buyers from viewing trip to title deed.";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: { absolute: `${PAGE_TITLE} | ${siteConfig.name}` },
    description: PAGE_DESCRIPTION,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      url: "/",
      title: `${PAGE_TITLE} | ${siteConfig.name}`,
      description: PAGE_DESCRIPTION,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
    },
    twitter: {
      card: "summary_large_image",
      title: `${PAGE_TITLE} | ${siteConfig.name}`,
      description: PAGE_DESCRIPTION,
    },
  };
}

const FAQS = [
  {
    question: "Can foreign citizens buy property in Fethiye?",
    answer:
      "Yes. Foreign nationals can buy freehold property in Turkey in their own name. Purchases sit outside restricted military zones in Fethiye, Ölüdeniz, Hisarönü, Ovacık, Çalış, Üzümlü and Göcek, and the title deed (TAPU) is registered directly to you.",
  },
  {
    question: "What are the total buying costs on top of the villa price?",
    answer:
      "Budget roughly 6–8% of the purchase price. That typically covers the 4% property transfer tax, the mandatory valuation report, notary and translation fees, DASK earthquake insurance, and independent legal representation.",
  },
  {
    question: "How long does buying a villa in Turkey take?",
    answer:
      "From accepted offer to title deed transfer, most purchases in the Fethiye area complete within the same week, assuming the funds are awailable.",
  },
  {
    question: "Does buying a villa in Fethiye qualify me for Turkish citizenship?",
    answer:
      "Property purchases at or above the current government investment threshold can qualify for Turkish citizenship, provided the property is held for three years. We flag eligible listings and refer you to a specialist immigration lawyer before you commit.",
  },
  {
    question: "Can you rent the villa out when we are not using it?",
    answer:
      "Yes. Short-let demand in Ölüdeniz and Hisarönü is strong from May to October. We introduce vetted local management companies and can share realistic occupancy and yield figures for each property before you buy.",
  },
];

export default async function HomePage() {
  const settings = await getSettings();
  const featuredVillas = await getFeaturedVillas(6);
  const areaCounts = await getAreaCounts();

  /** Bento ızgarasında ilk bölge büyük gösterilir; sayılar veriden gelir. */
  const areas = serviceAreas.slice(0, 5).map((area) => ({
    ...area,
    count: areaCounts[area.slug] ?? 0,
  }));

  return (
    <>
      {/*
        Sayfaya özgü schema. Organization/WebSite kök layout'ta bir kez basıldığı
        için burada tekrarlanmaz — sadece bu sayfaya ait ItemList ve FAQPage eklenir.
      */}
      <JsonLd schema={[featuredListSchema(featuredVillas), faqSchema(FAQS)]} />

      <main id="main">
        <HomeHero />

        <FeaturedProperties />

        {/*
          PENCERE — "Bölge zekâsı" bölümüne geçiş.
          Üstteki beyaz bölüm bu bandın üzerinden kayıyor; manzara ekrana
          sabit olduğu için bir pencereden bakıyormuş hissi doğuyor.
        */}
        <RevealWindow image={imagery.revealAreas} height="md">
          <p className="glass-panel px-8 py-6 text-center font-sans text-sm font-bold uppercase tracking-[0.22em] text-sea-deep sm:px-12 sm:text-base">
            Eight neighbourhoods. One coast.
          </p>
        </RevealWindow>

        {/* ------------------------------------------------- 03 — BÖLGELER */}
        <section
          aria-labelledby="locations-heading"
          className="relative border-t border-line bg-shell-deep py-16 sm:py-24 lg:py-section"
        >
          <div className="container-page">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="eyebrow flex items-center justify-center gap-4 text-sea">
                <span aria-hidden="true" className="block h-px w-8 bg-gold" />
                Area intelligence
                <span aria-hidden="true" className="block h-px w-8 bg-gold" />
              </p>
              <h2
                id="locations-heading"
                className="mt-6 text-2xl uppercase leading-[1.1] text-sea-deep sm:text-4xl"
              >
                Where to buy on the Fethiye coast
              </h2>
            </Reveal>

            {/*
              Asimetrik bento: ilk bölge iki sütun iki satır kaplar. Eşit
              kutulardan oluşan bir ızgaraya kıyasla göz bir hiyerarşi görür
              ve tıklama ilk karta yönelir.
            */}
            <ul className="mt-12 grid auto-rows-[13rem] gap-px border border-line bg-line sm:grid-cols-3 lg:grid-cols-4">
              {areas.map((area, index) => (
                <li
                  key={area.slug}
                  className={index === 0 ? "sm:col-span-2 sm:row-span-2" : ""}
                >
                  <Reveal
                    className="h-full"
                    delay={index * 0.06}
                    y={20}
                    amount={0.15}
                  >
                    <Link
                      href={`/about-turkey#area-${area.slug}`}
                      className="group relative isolate flex h-full flex-col justify-end overflow-hidden bg-sea-deep p-6 text-shell"
                    >
                      <Image
                        src={area.image}
                        alt={`Property for sale in ${area.name}, Fethiye — ${area.headline}`}
                        fill
                        sizes={
                          index === 0
                            ? "(min-width: 640px) 50vw, 100vw"
                            : "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 100vw"
                        }
                        className="-z-10 object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
                      />
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/45 to-transparent"
                      />

                      <span className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
                        {area.count > 0
                          ? `${area.count} listing${area.count === 1 ? "" : "s"}`
                          : "Area guide"}
                      </span>

                      <span
                        className={`mt-2 font-display font-semibold uppercase leading-tight tracking-[0.02em] ${
                          index === 0 ? "text-2xl sm:text-4xl" : "text-lg"
                        }`}
                      >
                        {area.name}
                      </span>

                      {index === 0 ? (
                        <span className="mt-3 max-w-sm text-sm leading-relaxed text-shell/75">
                          {area.blurb}
                        </span>
                      ) : null}

                      <ArrowUpRight
                        aria-hidden="true"
                        className="absolute right-5 top-5 size-5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      />
                    </Link>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/*
          04 — SÜREÇ bölümü ana sayfadan KALDIRILDI.

          Yorum satırına alınmadı, silindi: yorumlanmış JSX derlenmediği için
          çürür (kullanılmayan import, yeniden adlandırılmış bileşen, değişen
          token) ve geri açıldığında artık çalışmaz. İçeriğin tamamı zaten
          /buying-process sayfasında tam hâliyle yaşıyor ve buradaki CTA'lar
          da oraya işaret ediyordu; kayıp yok.

          Bölümü tanıtan `RevealWindow` (imagery.revealProcess) de birlikte
          gitti — hiçbir yere açılmayan bir geçiş penceresi kalmasın diye.
        */}

        {/* ------------------------------------------------------ 05 — SSS */}
        <section aria-labelledby="faq-heading" className="relative bg-white py-16 sm:py-24 lg:py-section">
          <div className="container-page">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="eyebrow flex items-center justify-center gap-4 text-sea">
                <span aria-hidden="true" className="block h-px w-8 bg-gold" />
                Straight answers
                <span aria-hidden="true" className="block h-px w-8 bg-gold" />
              </p>
              <h2
                id="faq-heading"
                className="mt-6 text-2xl uppercase leading-[1.1] text-sea-deep sm:text-4xl"
              >
                Questions buyers actually ask
              </h2>
            </Reveal>

            {/*
              <details>/<summary> ile açılır-kapanır FAQ: JavaScript gerektirmez,
              içerik HTML kaynağında her zaman görünür durumdadır — Google'ın
              FAQPage schema'sı ile eşleştirmesi için içeriğin sayfada bulunması şart.
            */}
            <div className="mx-auto mt-12 max-w-3xl">
              {FAQS.map((faq) => (
                <details
                  key={faq.question}
                  name="homepage-faq"
                  className="group border-b border-line py-6 first:border-t"
                >
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-sea-deep marker:content-none">
                    <h3 className="text-base uppercase leading-snug tracking-tight">
                      {faq.question}
                    </h3>
                    <span
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 font-display text-lg font-bold text-sea transition-transform duration-300 group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-4 max-w-prose text-sm leading-relaxed text-ink-70">
                    {faq.answer}
                  </p>
                </details>
              ))}

              <div className="mt-10 flex justify-center">
                <a
                  href={whatsappHref(settings.contact.whatsappNumber, 
                    "Hello Coast 2 Coast — I have a question about buying property in Fethiye.",
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-accent"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  Ask us on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- KAPANIŞ */}
        <section aria-labelledby="cta-heading" className="relative bg-white pb-16 sm:pb-24 lg:pb-section">
          <div className="container-page">
            <Reveal className="relative isolate overflow-hidden bg-sea-deep px-8 py-16 text-shell sm:px-14 lg:px-20 lg:py-24">
              <Image
                src={imagery.homeCta.src}
                alt=""
                fill
                sizes="(min-width: 1280px) 78rem, 100vw"
                className="-z-10 object-cover"
              />
              <span
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-gradient-to-r from-sea-deep via-sea-deep/90 to-sea-deep/55"
              />

              <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
                <div>
                  <p className="eyebrow flex items-center justify-center gap-4 text-gold">
                    <span
                      aria-hidden="true"
                      className="block h-px w-8 bg-gold"
                    />
                    Next step
                    <span
                      aria-hidden="true"
                      className="block h-px w-8 bg-gold"
                    />
                  </p>
                  <h2
                    id="cta-heading"
                    className="mt-6 text-2xl uppercase leading-[1.1] text-shell sm:text-4xl"
                  >
                    Start with a conversation, not a brochure
                  </h2>
                  <p className="mx-auto mt-6 max-w-xl leading-relaxed text-shell/85">
                    Tell us the budget and the timeline. We will come back with
                    a shortlist — including the properties we would talk you out
                    of.
                  </p>
                </div>

                <div className="mt-9 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
                  <a
                    href={whatsappHref(settings.contact.whatsappNumber, 
                      "Hello Coast 2 Coast — I'd like to talk about buying a villa in Fethiye.",
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-light"
                  >
                    <MessageCircle className="size-4" aria-hidden="true" />
                    WhatsApp {settings.contact.phoneDisplay}
                  </a>
                  <Link href="/contact" className="btn btn-outline-light">
                    Book a call
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
    </>
  );
}
