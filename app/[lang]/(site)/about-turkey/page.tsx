import type { Metadata } from "next";
import Image from "next/image";
import { LocaleLink as Link } from "@/components/locale-link";
import { CtaSurface } from "@/components/cta-surface";
import { ArrowRight, ArrowUpRight, Check, MapPin, MessageCircle } from "lucide-react";
import { FaqAccordion } from "@/components/faq-accordion";
import { AreaMap, type AreaMapPoint } from "@/components/area-map";
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
  AREA_MAP_LABEL_SIDE,
  areaMapsUrl,
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

  /*
    HARİTA PİNLERİ — kartlarla AYNI listeden.

    ⚠️ `serviceAreas`ten değil `areas`ten türetiliyor ve bu bilinçli:
    `areas` zaten `isAreaVisibleInGuide` süzgecinden geçmiş durumda. Ham
    listeyi kullanmak, sayfada anlatısı OLMAYAN üç bölgeye (Dalaman,
    Seydikemer, Bekçiler) pin basmak olurdu — kullanıcı pini görür, aşağıda
    karşılığını arar, bulamaz.
  */
  const mapPoints: AreaMapPoint[] = areas.map((area) => ({
    slug: area.slug,
    name: area.name,
    lat: area.coordinates.lat,
    lng: area.coordinates.lng,
    href: areaMapsUrl(area.slug, area.name),
    labelSide: AREA_MAP_LABEL_SIDE[area.slug] ?? "right",
    ariaLabel: t("aboutTurkey.mapPinLabel", { area: area.name }),
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
        {/*
          TAM GENİŞLİKTE FOTOĞRAF ZEMİNİ + IZGARA.

          ⚠️ ÖNCEKİ HÂLİ İKİ SÜTUNDU: solda dikey bir görsel, sağda ALT ALTA
          dizilen altı yaşam maddesi. Altı maddelik dikey bir liste tek
          başına ekranın iki katı yükseklik kaplıyordu ve sayfa zaten bölge
          rehberleriyle uzun. Izgara aynı içeriği üçte bir yükseklikte
          veriyor.

          `isolate` + negatif z-index: zemin ve örtü akıştan çıkıyor, metin
          normal akışta kalıyor. Bölüm `overflow-hidden` çünkü `fill` görsel
          kabın dışına taşar.
        */}
        <section
          aria-labelledby="lifestyle-heading"
          className="relative isolate overflow-hidden border-y border-line py-section"
        >
          <Image
            src={imagery.aboutTurkeyDailyLife.src}
            alt={t("imagery.named.aboutTurkeyDailyLife")}
            fill
            sizes="100vw"
            className="-z-20 object-cover"
            /* Sayfanın ilk ekranında değil — hero altında. Tembel yükleme
               varsayılanı doğru davranış, `priority` VERİLMEDİ. */
          />

          {/*
            ⚠️ ÖRTÜ WCAG İÇİN, DEKORASYON İÇİN DEĞİL — ve %65 bir tahmin
            değil, ÖLÇÜM sonucu.

            Metin kutularının ARKASINDAKİ en parlak piksel tarayıcıda
            örneklendi ve dört opaklık karşılaştırıldı (kontrast, o en kötü
            piksele karşı):

              %80 → başlık 8.25 · gövde 7.17   (fotoğraf neredeyse kayboluyor)
              %70 → başlık 6.49 · gövde 6.07
              %65 → başlık 5.80 · gövde 5.55   ← seçilen
              %60 → başlık 5.19 · gövde 5.15

            Hepsi AA eşiğini (4.5:1) geçiyor. %80 fotoğrafı düz bir yeşil
            zemine çeviriyordu — "sürükleyici arka plan" isteğinin tam
            tersi. %65 limanı, tekneleri ve tepeleri geri getiriyor ve
            gövde metninde hâlâ 5.55:1 bırakıyor; üstelik bu değer EN KÖTÜ
            pikselden, ortalamadan değil.

            Maddelerin kendi panelleri ayrıca `bg-sea-deep/40` taşıyor,
            yani panel içindeki metnin altında etkin örtü ~%79.

            Marka tonu (`sea-deep`) düz siyaha tercih edildi: siyah örtü
            fotoğrafı griye çeviriyor, lacivert-yeşil ton denizi koruyor.
          */}
          <span
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-sea-deep/65"
          />

          <div className="container-page">
            <header className="mx-auto max-w-2xl text-center">
              <p className="eyebrow text-gold">
                {/* Bu satır ÖNCEDEN SABİT İNGİLİZCEYDİ ("Daily life") ve
                    Türkçe/Rusça sayfada da öyle görünüyordu. */}
                {t("aboutTurkey.livingEyebrow")}
              </p>
              <h2
                id="lifestyle-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-shell sm:text-4xl"
              >
                {t("aboutTurkey.livingHeading")}
              </h2>
              {/*
                Açıklama paragrafı KALDIRILDI. Bölümün işi artık fotoğrafı
                göstermek ve altı maddeyi taramaya açmak; başlıkla maddeler
                arasına giren üç satırlık metin, zeminin en okunur şeridini
                kaplıyordu. Sözlükteki `livingLede` de birlikte gitti —
                başka hiçbir yerde okunmuyordu.
              */}
            </header>

            <dl className="mt-10 grid grid-cols-1 gap-8 sm:mt-14 lg:gap-10 md:grid-cols-2 lg:grid-cols-3">
              {LIFESTYLE_FACTS.map((source, index) => {
                const fact = {
                  ...source,
                  ...copy.lifestyle(LIFESTYLE_KEYS[index], source),
                };

                return (
                  /*
                    Her madde kendi cam panelinde. Fotoğrafın üstünde çıplak
                    metin, arkasındaki detay değiştikçe okunabilirliğini
                    kaybediyordu; hafif bir panel metni zeminden bağımsız
                    hâle getiriyor. Köşeler keskin — bkz. globals.css.
                  */
                  <div
                    key={LIFESTYLE_KEYS[index]}
                    /*
                      CAM PANEL — %40 yerine %30 zemin, `blur-sm` yerine
                      `blur-md`.

                      ⚠️ İKİSİ BİRLİKTE DEĞİŞTİ ve bu tesadüf değil: zemin
                      şeffaflaşınca fotoğrafın yüksek frekanslı detayı
                      (direkler, tekneler, pencereler) metnin altından
                      geçmeye başlıyor ve kontrast ORTALAMASI iyi olsa bile
                      okuma bozuluyor. `blur-md` o detayı düzleştiriyor;
                      panel daha şeffaf ama altındaki zemin daha tekdüze.

                      Kontrast tarayıcıda ölçüldü — bkz. örtü yorumundaki
                      tablo; panel içi gövde metni AA eşiğinin üstünde.
                    */
                    className="h-full border border-shell/25 bg-sea-deep/30 p-6 backdrop-blur-md sm:p-7"
                  >
                    <dt className="flex items-center gap-3 font-display text-lg text-shell">
                      <fact.icon
                        className="size-5 shrink-0 text-gold"
                        aria-hidden="true"
                      />
                      {fact.title}
                    </dt>
                    <dd className="mt-3 text-sm leading-relaxed text-shell/85">
                      {fact.body}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        </section>

        {/* ------------------------------------------------------ BÖLGELER */}
        <section
          aria-labelledby="areas-heading"
          id="areas"
          className="scroll-mt-24 bg-shell py-section"
        >
          <div className="container-page">
            <header className="mx-auto max-w-2xl text-center">
              <h2
                id="areas-heading"
                className="font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                {t("aboutTurkey.areasHeading")}
              </h2>
              <p className="mt-4 sm:mt-5 text-ink-70">
                {t("aboutTurkey.mapLede")}
              </p>
            </header>

            {/*
              HARİTA — bölge kartlarındaki stok fotoğrafların yerine geçti.
              Gerekçesi (telif + pinin doğrudan Google Haritalar'a gitmesi)
              lib/turkey.ts içindeki "BÖLGE HARİTASI" başlığında yazılı.

              `isolate` ZORUNLU: Leaflet kendi katmanlarına yüksek `z-index`
              veriyor (kontroller 1000'de). Yalıtım olmadan bu değerler
              sayfanın yapışkan başlığının önüne geçiyor.
            */}
            <div className="mt-8 sm:mt-12">
              <div
                role="region"
                aria-label={t("aboutTurkey.mapLabel")}
                className="area-map relative isolate h-[400px] w-full overflow-hidden border border-line shadow-lg md:h-[600px]"
              >
                <AreaMap points={mapPoints} />
              </div>

              <p className="mt-3 text-center text-xs text-ink-40">
                {t("aboutTurkey.mapHint")}
              </p>
            </div>
          </div>

          {/*
            BÖLGE ANLATILARI — artık görselsiz.

            Eski yerleşim dönüşümlü bir görsel/metin ızgarasıydı. Görsel
            gidince metin sütunu tek başına sayfanın yarısında asılı
            kalıyordu; iki sütunlu ızgara aynı içeriği yarı yükseklikte
            veriyor ve haritanın hemen ardından bir lejant gibi okunuyor.

            ⚠️ `area-${slug}` ÇAPALARI KORUNDU. Sayfanın Place şeması bu
            çapalara `@id` veriyor ve dışarıdan gelen bağlantılar buraya
            iniyor — kaldırılırsa ikisi birden kırılır.
          */}
          <div className="container-page mt-12 sm:mt-20">
            <div className="grid gap-x-12 gap-y-10 sm:gap-y-14 lg:grid-cols-2 lg:gap-x-16">
              {areas.map((area) => (
                <article
                  key={area.slug}
                  id={`area-${area.slug}`}
                  className="scroll-mt-28 border-t border-line pt-6 sm:pt-8"
                >
                  <p className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-sea">
                    <MapPin className="size-3.5" aria-hidden="true" />
                    {area.headline}
                  </p>

                  <h3 className="mt-4 font-display text-2xl leading-tight text-sea-deep sm:text-3xl">
                    {area.name}
                  </h3>

                  <p className="mt-4 leading-relaxed text-ink-70">
                    {area.detail?.intro ?? area.blurb}
                  </p>

                  {/*
                    Madde listesi olmayan bölgede `<ul>` HİÇ basılmıyor.
                    Yanıklar ve Kalkan'ın `points` dizisi boş (bkz.
                    lib/turkey.ts): boş bir liste ekranda yalnızca fazladan
                    bir boşluk bırakır, ekran okuyucuya da "liste, 0 öğe"
                    diye duyurulurdu.
                  */}
                  {area.detail?.points.length ? (
                    <ul className="mt-5 space-y-4">
                      {area.detail.points.map((point) => (
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
                  ) : null}

                  {/*
                    ⚠️ VERİ YOKSA BLOK HİÇ BASILMIYOR — tire DEĞİL.

                    Yanıklar ve Kalkan'ın `AREA_DETAIL` karşılığı henüz yok
                    (bkz. lib/turkey.ts). Eski görselli yerleşimde kartın
                    yükünü fotoğraf taşıdığı için "Best for: —" göze
                    batmıyordu; iki sütunlu ızgarada ise boş bir tanım
                    listesi kartın en altında asılı kalıyor. Etiketi
                    doldurulacak bir söz gibi göstermektense hiç
                    göstermemek doğru: metin yazıldığında blok kendiliğinden
                    geri gelir.
                  */}
                  {area.detail?.bestFor ? (
                    <dl className="mt-6 flex flex-wrap items-center gap-x-10 gap-y-4 border-t border-line pt-5">
                      <div>
                        <dt className="eyebrow text-ink-40">
                          {t("aboutTurkey.bestForLabel")}
                        </dt>
                        <dd className="mt-2 text-sm text-sea-deep">
                          {area.detail.bestFor}
                        </dd>
                      </div>
                    </dl>
                  ) : null}

                  {/*
                    Pinin METİN KARŞILIĞI — süs değil, erişim yolu.

                    Haritada ad etiketleri yalnızca yakınlaştırıldığında
                    beliriyor ve pin küçük bir dokunma hedefi. Klavyeyle
                    gezen ya da telefondan bakan biri aynı yere buradan tek
                    adımda ulaşıyor; JavaScript hiç çalışmasa bile bağlantı
                    yerinde duruyor.
                  */}
                  <a
                    href={areaMapsUrl(area.slug, area.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center gap-2 text-sm text-sea transition-colors hover:text-sea-deep"
                  >
                    <MapPin className="size-3.5" aria-hidden="true" />
                    {t("aboutTurkey.mapOpenLink")}
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </a>
                </article>
              ))}
            </div>
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
                {/* CTA açıklama paragrafı KALDIRILDI — bu blokta artık yalnızca
                    başlık ve eylem düğmeleri var (dokuz sayfada birden).
                    Sözlükteki karşılığı da silindi. */}
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
