import type { Metadata } from "next";
import { LocaleLink as Link } from "@/components/locale-link";
import { CtaSurface } from "@/components/cta-surface";
import { ArrowRight, MessageCircle } from "lucide-react";
import { FeaturedProperties } from "@/components/featured-properties";
import { HomeHero } from "@/components/home-hero";
import { JsonLd } from "@/components/json-ld";
import { Reveal } from "@/components/reveal";
import { RevealWindow } from "@/components/reveal-window";
import { currentLocale, currentLanguage } from "@/lib/current-locale";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { imagery } from "@/lib/imagery";
import { getSettings, whatsappHref } from "@/lib/settings";
import { faqSchema, featuredListSchema } from "@/lib/schema";
import {
  FEATURED_AREA_SLUGS,
  getServiceArea,
  siteConfig,
} from "@/lib/site";
import { getFeaturedVillas } from "@/lib/villas";

/**
 * Ana sayfa başlığında `absolute` kullanıyoruz: layout'taki
 * "%s | Coast 2 Coast Properties Turkey" şablonu marka adını ikinci kez
 * eklemesin diye. Başlık 60 karakter civarında tutuldu ki SERP'te kırpılmasın.
 */
const PAGE_TITLE = "Luxury Villas for Sale in Fethiye, Ölüdeniz & Göcek";
const PAGE_DESCRIPTION =
  "Hand-picked luxury villas for sale in Fethiye, Ölüdeniz, Hisarönü, Ovacık, Çalış, Üzümlü and Göcek. An international consultancy guiding buyers from viewing trip to title deed.";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await currentLocale();

  /*
    Ana sayfa `pageMetadata()`nin TAMAMINI kullanmıyor — başlığı `absolute`,
    yani marka şablonundan geçmiyor (gerekçe yukarıda). Ama canonical ve
    hreflang kümesi diğer sayfalarla AYNI kaynaktan gelmeli; kopyalanmış bir
    hreflang listesi er ya da geç ayrışır ve karşılıklılık kuralını bozar.
  */
  const { alternates, openGraph } = pageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: "/",
    locale,
  });

  return {
    title: { absolute: `${PAGE_TITLE} | ${siteConfig.name}` },
    description: PAGE_DESCRIPTION,
    alternates,
    openGraph: {
      ...openGraph,
      type: "website",
      title: `${PAGE_TITLE} | ${siteConfig.name}`,
      description: PAGE_DESCRIPTION,
      siteName: siteConfig.name,
    },
    twitter: {
      card: "summary_large_image",
      title: `${PAGE_TITLE} | ${siteConfig.name}`,
      description: PAGE_DESCRIPTION,
    },
  };
}

/**
 * SSS artık modül sabiti DEĞİL, dile göre kurulan bir liste.
 *
 * Sabit kalsaydı /tr sayfasında İngilizce sorular görünürdü — ve daha
 * kötüsü, `faqSchema()` Google'a İngilizce SSS bildirirdi: sayfa Türkçe,
 * yapılandırılmış veri İngilizce. Zengin sonuçta görünen metin sayfadaki
 * metinle çelişince Google bloğu tamamen düşürür.
 */
function buildFaqs(t: (key: TranslationKey) => string) {
  return [1, 2, 3, 4, 5].map((n) => ({
    question: t(`faq.q${n}` as TranslationKey),
    answer: t(`faq.a${n}` as TranslationKey),
  }));
}

export default async function HomePage() {
  /* Sunucu tarafı çeviri: metin HTML'e girer, istemciye JS inmez
     (gerekçe lib/i18n/server.ts). */
  const t = await getT();

  const settings = await getSettings();
  const featuredVillas = await getFeaturedVillas(6);

  const FAQS = buildFaqs(t);

  /**
   * Vitrin bölgeleri — `FEATURED_AREA_SLUGS` sırasıyla (bkz. lib/site.ts).
   *
   * `flatMap` + boş dizi, `map` + `!` yerine: slug listesinde bir yazım
   * hatası olursa blok hiç basılmıyor. `map` kullansaydık `undefined` bir
   * kayıt ızgaraya girer ve sayfa `area.name` okurken çökerdi.
   *
   * ⚠️ ARTIK YALNIZCA SLUG VE AD OKUNUYOR. Blok tipografik hâle gelince
   * (bkz. aşağıdaki ızgara notu) üç veri kaynağı gereksizleşti ve
   * kaldırıldı: `getAreaCounts` (ilan sayacı), `getAreaCopy` (başlık/
   * tanıtım metni) ve `area.image`. İkisi de sunucuda ekstra iş yapıyordu;
   * sayaç için 57 ilan bölgeye göre gruplanıyordu.
   *
   * İSİM ÇEVRİLMİYOR: "Ölüdeniz" her dilde Ölüdeniz. Bölümdeki çevrilen
   * metinler (eyebrow, başlık, CTA) sözlükten geliyor.
   */
  const areas = FEATURED_AREA_SLUGS.flatMap((slug) => {
    const area = getServiceArea(slug);
    return area ? [{ slug: area.slug, name: area.name }] : [];
  });

  return (
    <>
      {/*
        Sayfaya özgü schema. Organization/WebSite kök layout'ta bir kez basıldığı
        için burada tekrarlanmaz — sadece bu sayfaya ait ItemList ve FAQPage eklenir.
      */}
      <JsonLd schema={[featuredListSchema(featuredVillas, await currentLanguage()), faqSchema(FAQS)]} />

      <main id="main">
        <HomeHero />

        <FeaturedProperties />

        {/*
          PENCERE — "Bölge zekâsı" bölümüne geçiş.
          Üstteki beyaz bölüm bu bandın üzerinden kayıyor; manzara ekrana
          sabit olduğu için bir pencereden bakıyormuş hissi doğuyor.

          Üstündeki cam panel metni KALDIRILDI. Bant metinsiz duruyor:
          `RevealWindow` çocuk almadığında panel sarmalayıcısını hiç
          basmıyor ve kendini `aria-hidden` işaretliyor — yani geriye boş
          bir kutu değil, saf bir geçiş görseli kalıyor.
        */}
        <RevealWindow image={{
            ...imagery.revealAreas,
            /* Alt metni çeviriden: erişilebilirlik ve görsel arama
               sinyali sayfanın diliyle aynı olmalı. */
            alt: t("imagery.named.revealAreas"),
          }} height="md" />

        {/* ------------------------------------------------- 03 — BÖLGELER */}
        <section
          aria-labelledby="locations-heading"
          className="relative border-t border-line bg-shell-deep py-16 sm:py-24 lg:py-section"
        >
          <div className="container-page">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="eyebrow flex items-center justify-center gap-4 text-sea">
                <span aria-hidden="true" className="block h-px w-8 bg-gold" />
                {t("home.areasEyebrow")}
                <span aria-hidden="true" className="block h-px w-8 bg-gold" />
              </p>
              <h2
                id="locations-heading"
                className="mt-6 text-2xl uppercase leading-[1.1] text-sea-deep sm:text-4xl"
              >
                {t("home.areasHeading")}
              </h2>
            </Reveal>

            {/*
              TİPOGRAFİK IZGARA — FOTOĞRAF YOK, MİKRO METİN YOK.

              ⚠️ GÖRSELLER NEDEN KALDIRILDI. Kartlar bölge başına bir
              fotoğraf basıyordu, ama elimizde bölgeye ÖZGÜ fotoğraf yok:
              aynı kıyı şeridinin birbirinin yerine geçebilecek kareleriydi.
              Ölüdeniz'in altında Ölüdeniz olmayan bir koy göstermek, lüks
              bir markada "stok görsel" hissi veren tek şey — ve bir emlak
              sayfasında doğrudan güven kaybı. Yanlış fotoğraf yerine HİÇ
              fotoğraf göstermek daha dürüst ve daha pahalı duruyor.

              ⚠️ SAYAÇ VE BAŞLIK DA GİTTİ ("11 İLAN", "Marina hayatı…").
              Bölüm artık bir vitrin değil, bir İÇİNDEKİLER TABLOSU: tek işi
              /about-turkey'e yönlendirmek. Kartın üstünde üç ayrı metin
              varken göz nereye bakacağını seçmek zorunda kalıyordu; tek
              kelime kalınca bölge adı afiş gibi okunuyor.

              Sayaç ayrıca bir BAKIM YÜKÜYDÜ: ilan sayısı değiştikçe
              değişen bir sayıyı ana sayfada göstermek, portföy küçüldüğünde
              "3 ilan" gibi zayıf bir sinyal basmak demekti.

              YÜKSEKLİK KORUNDU (14rem/18rem değil, 11rem/15rem): fotoğraf
              gidince aynı yükseklik tek bir kelimenin etrafında fazla boşluk
              bırakıyordu. Yine de cömert — daralttıkça ızgara "düğme sırası"
              gibi görünmeye başlıyor, afiş gibi değil.

              Mobilde de iki sütun: dört bloğu alt alta dizmek bu bölümü
              telefonda dört ekran boyu uzatıyordu.
            */}
            <ul className="mt-12 grid auto-rows-[11rem] grid-cols-2 gap-px border border-line bg-line sm:auto-rows-[15rem] lg:grid-cols-4">
              {areas.map((area, index) => (
                <li key={area.slug}>
                  <Reveal
                    className="h-full"
                    delay={index * 0.06}
                    y={20}
                    amount={0.15}
                  >
                    {/*
                      ⚠️ HEDEF HÂLÂ ÇAPALI (`#area-<slug>`), düz
                      /about-turkey değil. Blok artık yalnızca bölge adını
                      taşıyor; "ÖLÜDENİZ"e basan kişi Ölüdeniz bölümünü
                      görmek istiyor, sayfanın başını değil. Aynı sayfaya
                      gidiyor, doğru yerinde açılıyor.

                      RENK TERSİNMESİ — hover'ın tamamı bu. Fotoğraf yokken
                      "tıklanabilir" sinyalini taşıyacak tek şey renk ve
                      hareket. Koyu yeşilden kreme dönmek, dört blok
                      arasında hangisinin altında olduğunuzu bir metrelik
                      mesafeden bile belli ediyor.

                      `focus-visible` hover ile AYNI durumu veriyor: klavye
                      kullanıcısı da aynı geri bildirimi almalı, yoksa
                      sekmeyle gezerken seçili blok görünmez olurdu.
                    */}
                    <Link
                      href={`/about-turkey#area-${area.slug}`}
                      className="group flex h-full flex-col items-center justify-center gap-3 bg-sea-deep px-4 text-center text-shell transition-colors duration-500 ease-out hover:bg-shell hover:text-sea-deep focus-visible:bg-shell focus-visible:text-sea-deep"
                    >
                      <span className="font-display text-lg uppercase leading-tight tracking-[0.06em] sm:text-2xl lg:text-[1.6rem]">
                        {area.name}
                      </span>

                      {/*
                        OK ADIN ALTINDA, YANINDA DEĞİL — ve her zaman akışta.

                        Önce ad ile ok yan yanaydı (`inline-flex … gap`). O
                        dizilimde ok görünmez olsa bile yer kapladığı için
                        bölge adı blok merkezinin ~13px SOLUNA kayıyordu:
                        boşluğun yarısı kadar. Dört blok yan yana dizilince
                        bu kayma göze çarpıyor — tek işi tipografi olan bir
                        ızgarada adın optik merkezde olmaması kabul edilemez.

                        Dikey dizilimde ad yatayda TAM ORTADA kalıyor, ok
                        altında ortalanıyor. Ok yine akışta duruyor
                        (`opacity-0`), yani belirdiğinde hiçbir şey zıplamıyor:
                        yalnızca opaklık ve 4px'lik bir yükselme değişiyor.
                      */}
                      <ArrowRight
                        aria-hidden="true"
                        className="size-4 shrink-0 translate-y-1 text-gold opacity-0 transition duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
                      />
                    </Link>
                  </Reveal>
                </li>
              ))}
            </ul>

            {/*
              Vitrinden TAM LİSTEYE geçiş. Dört kart bilinçli bir kırpma
              olduğu için, geri kalanına giden görünür bir yol şart:
              olmadığında bölüm "sadece dört bölgede çalışıyorlar" diye
              okunuyordu. Hedef /about-turkey#areas — harita ve on iki
              bölgenin tamamı orada.

              Biçim `featured-properties.tsx`teki bölüm CTA'sıyla birebir
              aynı: aynı işi yapan iki bağlantı aynı görünmeli.
            */}
            <Reveal className="mt-10 flex justify-center sm:mt-12" y={16}>
              <Link href="/about-turkey#areas" className="btn btn-solid">
                {t("home.areasCta")}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Reveal>
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
                {t("home.faqEyebrow")}
                <span aria-hidden="true" className="block h-px w-8 bg-gold" />
              </p>
              <h2
                id="faq-heading"
                className="mt-6 text-2xl uppercase leading-[1.1] text-sea-deep sm:text-4xl"
              >
                {t("home.faqHeading")}
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
                    t("home.faqWhatsappMessage"),
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-accent"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  {t("home.faqWhatsapp")}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- KAPANIŞ */}
        <section aria-labelledby="cta-heading" className="relative bg-white pb-16 sm:pb-24 lg:pb-section">
          <div className="container-page">
            <Reveal>
              <CtaSurface>

              <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
                <div>
                  <p className="eyebrow flex items-center justify-center gap-4 text-gold">
                    <span
                      aria-hidden="true"
                      className="block h-px w-8 bg-gold"
                    />
                    {t("home.ctaEyebrow")}
                    <span
                      aria-hidden="true"
                      className="block h-px w-8 bg-gold"
                    />
                  </p>
                  <h2
                    id="cta-heading"
                    className="mt-6 text-2xl uppercase leading-[1.1] text-shell sm:text-4xl"
                  >
                    {t("home.ctaHeading")}
                  </h2>
                  {/* CTA açıklama paragrafı KALDIRILDI — bu blokta artık yalnızca
                    başlık ve eylem düğmeleri var (dokuz sayfada birden).
                    Sözlükteki karşılığı da silindi. */}
                </div>

                <div className="mt-9 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
                  <a
                    href={whatsappHref(settings.contact.whatsappNumber, 
                      t("home.ctaWhatsappMessage"),
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-light"
                  >
                    <MessageCircle className="size-4" aria-hidden="true" />
                    WhatsApp {settings.contact.phoneDisplay}
                  </a>
                  <Link href="/contact" className="btn btn-outline-light">
                    {t("home.ctaBookCall")}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </CtaSurface>
            </Reveal>
          </div>
        </section>
      </main>
    </>
  );
}
