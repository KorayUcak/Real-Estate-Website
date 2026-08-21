import type { Metadata } from "next";
import Image from "next/image";
import { LocaleLink as Link } from "@/components/locale-link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CtaSurface } from "@/components/cta-surface";
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
import { getSettings, whatsappHref } from "@/lib/settings";
import { aboutPageSchema, breadcrumbSchema } from "@/lib/schema";
import { currentLocale } from "@/lib/current-locale";
import { getAboutCopy, getT } from "@/lib/i18n/server";
import { HOME_CRUMB, pageMetadata, type Crumb } from "@/lib/seo";


/**
 * Hakkımızda banner görseli.
 *
 * `lib/imagery.ts` içindeki Unsplash havuzunda DEĞİL: bu marka fotoğrafı,
 * stok görsel değil. Havuza koymak onu diğer sayfaların da çekebileceği
 * genel bir görsel gibi gösterirdi.
 */
const ABOUT_BANNER = {
  src: "/images/about/about-hero.jpeg",
  alt: "Coast 2 Coast Properties Turkey",
} as const;

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
        {/*
          HAKKIMIZDA BANNER'I — GÖRSEL, METİN YOK.

          `PageHero` yerine bu sayfaya özel bir blok kullanılıyor: brief
          banner'ın üstündeki tüm metnin kalkmasını istiyor, PageHero ise
          eyebrow + h1 + lede üçlüsünü basmak için var. Ona bir "metni gizle"
          anahtarı eklemek, dokuz sayfanın paylaştığı bileşeni tek sayfanın
          istisnası için dallandırmak olurdu.

          ⚠️ <h1> SİLİNMEDİ, GÖRÜNMEZ HÂLE GETİRİLDİ. Sayfadaki tek h1 buydu;
          tamamen kaldırmak sayfayı başlıksız bırakır — ekran okuyucu
          kullanıcısı için belge yapısı, arama motoru için ise sayfanın ne
          hakkında olduğunu söyleyen ana sinyal kaybolurdu. `sr-only` ikisini
          de korurken görsel isteği birebir karşılıyor: ekranda yalnızca
          fotoğraf var.

          Breadcrumb görselin ÜSTÜNDE değil, ÜZERİNDE değil — bandın önünde,
          krem zeminde duruyor. Böylece fotoğrafın önünde hiçbir şey yok ama
          gezinme de kaybolmuyor.
        */}
        {/*
          HAKKIMIZDA BANNER'I — TAM GENİŞLİK, METİNSİZ.

          Diğer iç sayfalarla AYNI aile: `PageHero`nun görselli varyantıyla
          birebir aynı kabuk (tam genişlik, `object-cover`, üstünde tül,
          altında `border-line`). Tek fark, üzerinde metin olmaması.

          ⚠️ YÜKSEKLİK NEDEN ELLE VERİLİYOR: `PageHero` bandın yüksekliğini
          İÇERİKTEN alıyor — eyebrow + h1 + lede bloğu onu ~680px'e itiyor.
          Bu banner'da metin yok, dolayısıyla aynı kabuk kullanılsaydı bant
          yalnızca breadcrumb yüksekliğinde, ~60px'lik bir şeride çökerdi.
          `min-h-*` değerleri o yüzden ölçülerek seçildi: /buying-process
          ve /insurance hero'ları masaüstünde 681–712px arasında oturuyor,
          buradaki 42rem (672px) o aralığa denk geliyor.

          MASAÜSTÜNDE 70vh. Önce 42rem'den 60vh'ye indirildi (metin ilk
          ekranda görünsün diye), sonra 70vh'ye çıkıldı: 60vh kadrajın
          üçte birini kesiyordu — gerekçe aşağıdaki `object-position`
          notunda, ölçümle birlikte. 70vh hâlâ 42rem'in altında, yani
          metin ilk ekranda görünmeye devam ediyor.

          Sabit 672px, 900px'lik bir ekranda
          başlıkla birlikte 770px ediyordu: altındaki metinden yalnızca
          ~130px görünüyor, 800px'lik bir dizüstünde ise hiç görünmüyordu.
          Banner'ın işi sayfayı tanıtmak, sayfanın yerine geçmek değil.
          `vh` tercih edildi çünkü sorun ekran yüksekliğine bağlı: sabit bir
          piksel değeri kısa ekranlarda yine kaplardı.

          MOBİLDE 20rem — ve bu da hesaplanmış bir değer. Kaynak 1.25:1;
          390px genişlikte görselin doğal yüksekliği 312px. Bant bundan
          belirgin şekilde yüksek olursa `object-cover` bu kez YATAYDA
          kırpmaya başlıyor ve kırptığı yer sağ kenar, yani tabelanın
          durduğu taraf oluyordu (26rem'de "Coast2Coast" yarıya iniyordu).
          20rem (320px) doğal yüksekliğe neredeyse eşit; yatay kırpma
          kenar başına ~5px'e düşüyor ve kadraj bütün kalıyor.

          ORAN KISITI YOK: `aspect-*` kaldırıldı çünkü tam genişlikli bir
          bantta oran, yüksekliği viewport genişliğine bağlar — 21:9 bir
          ekranda bant absürt kısalır. Sabit min-yükseklik + `object-cover`
          her genişlikte aynı bandı veriyor.
        */}
        <section
          aria-labelledby="about-heading"
          className="relative isolate overflow-hidden border-b border-line bg-sea-deep text-shell"
        >
          {/*
            `object-[center_48%]` (lg) — KIRPMA ÖLÇÜLEREK SEÇİLDİ.

            Kadrajda korunması gereken üç şey var: yüz, eldeki anahtarlar ve
            "Coast2Coast" tabelası. Tabelanın dikey aralığı görselde
            piksel taramasıyla ölçüldü: turuncu alan %31.3 ile %75.0
            arasında. Yüzün üstü ~%21'de başlıyor. Yani korunması gereken
            bant görselin ~%21–%75 aralığı, kabaca %54'ü.

            60vh (540px) bandı 1440px genişlikte görselin yalnızca %47'sini
            gösteriyordu — %54'lük bir içeriği %47'lik bir pencereye
            sığdırmak mümkün değil. Hangi konum denenirse denensin ya
            gözlüğün üstü ya da "PROPERTIES" satırı kesiliyordu (ikisini de
            ayrı ayrı render edip doğruladık). 65vh de yetmiyor: %51.

            Gereken bant görselin %55'i. Ama bu ORAN, bandın piksel
            karşılığı değil — ve burada `vh` YANLIŞ birim:

              gerekli yükseklik = genişlik ÷ 1.25 × 0.55 = genişlik × 0.44

            Yani kırpma viewport'un YÜKSEKLİĞİNE değil GENİŞLİĞİNE bağlı;
            görsel genişliğe göre ölçekleniyor. 70vh 1440×900'de doğru
            çalışıyordu ama 1440×800'de bant 561px'e düşüp "PROPERTIES"
            satırını yeniden kesiyordu (render edilip görüldü). Sabit bir
            piksel değeri de tek bir genişlikte doğru olurdu: 1920px'te
            gereken bant 845px.

            `44vw` bu ilişkiyi doğrudan ifade ediyor — hangi genişlikte
            olursak olalım kadraj aynı kalıyor.

            Dikey konum yalnızca `lg`de anlamlı: dar ekranlarda görsel
            yüksekliğe göre ölçekleniyor ve dikeyde hiç kırpılmıyor
            (kırpma yatayda oluyor). Mobil kadraj bu yüzden değişmedi.

            Kaynak 2304×1844 (1.25:1). 1440px genişlikte görsel 1152px
            yüksekliğe ölçekleniyor, bant ise 673px; yani yüksekliğin
            ~%58'i görünüyor, 479px'i kırpılıyor.

            %30 ilk denemeydi ve tabelanın ALT YARISINI kesiyordu: "FOR
            SALE" görünüyor ama altındaki "Coast2Coast" kelime işareti
            kadrajın dışında kalıyordu — yani markanın kendi tabelası
            kırpılmış oluyordu. %45'te pencere görselin ~%19–%77 aralığına
            kayıyor: tabela alt kenarıyla birlikte içeride, yüz hâlâ üst
            üçlükte, saçın tepesinden yalnızca birkaç piksel gidiyor.
          */}
          <Image
            src={ABOUT_BANNER.src}
            alt={ABOUT_BANNER.alt}
            fill
            priority
            /* Kaynak sıkıştırılmış geldiği için kalite 85 yerine 90:
               yeniden kodlamanın üstüne ikinci bir kayıp eklememek için. */
            quality={90}
            sizes="100vw"
            className="-z-10 object-cover object-[center_45%] lg:object-[center_48%]"
          />

          {/*
            İKİ KATMANLI TÜL — hem estetik hem teknik.

            1) DİKEY DEGRADE: üstte ve altta koyu, ortada açık. Üst koyuluk
               breadcrumb'ın okunmasını sağlıyor (beyaz metin, `tone="dark"`),
               alt koyuluk bandı bir sonraki bölüme bağlıyor. Orta bölgenin
               açık kalması şart: özne ve tabela orada.

            2) DÜZ MARKA TÜLÜ: ince, tek tonluk bir `sea-deep` katmanı.
               Görevi kontrast değil, GÜRÜLTÜ MASKESİ — kaynaktaki JPEG
               blok artefaktları düz bir renk katmanının altında gözle
               görülür biçimde yumuşuyor. `gray-900` yerine marka lacivertî
               kullanılıyor; nötr gri, sitenin sıcak krem paletinin yanında
               ölü duruyor.

            İkisi birlikte "sinematik" hissi veren şey: tek ve düz bir
            karartma yerine, ışığın ortada toplandığı bir kadraj.
          */}
          <span
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/70 via-ink/15 to-ink/60"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-sea-deep/25"
          />

          {/*
            ⚠️ <h1> GÖRÜNMEZ AMA VAR. Sayfadaki tek h1 bu; banner metinsiz
            olduğu için ekranda görünmüyor, belge yapısında ve arama
            motorunda duruyor.
          */}
          <h1 id="about-heading" className="sr-only">
            {t("about.heroTitle")}
          </h1>

          <div className="container-page flex min-h-[20rem] flex-col pb-14 pt-10 sm:min-h-[34rem] sm:pb-20 sm:pt-12 lg:min-h-[44vw]">
            <Breadcrumbs crumbs={CRUMBS} tone="dark" />
          </div>
        </section>

        <section aria-labelledby="story-heading" className="bg-shell py-section">
          {/*
            İKİNCİ GÖRSEL KALDIRILDI — ve ızgara da onunla birlikte.

            Bölüm 12 sütunluk bir ızgaraydı: solda görsel (6 sütun), sağda
            metin (5 sütun, 8'den başlayarak). Yalnızca görseli silmek
            metni sayfanın sağ yarısında bırakır, solda altı sütunluk bir
            boşlukla — "kaldırılmış bir şeyin yeri" gibi duran, kasıtsız
            bir asimetri.

            Bu yüzden ızgara tamamen çözüldü. Metin artık ölçülü genişlikte
            (`max-w-2xl`) ve ortalanmış tek bir sütun: uzun paragraflar için
            zaten doğru olan biçim, çünkü satır uzunluğu okunabilir
            aralıkta kalıyor. Tam genişliğe yaymak 1440px'te 100+ karakterlik
            satırlar üretirdi.

            Hero'nun hemen altındaki tek görselin kalkması sayfanın açılışını
            da hafifletiyor: banner, ardından metin.
          */}
          <div className="container-page">
            <div className="mx-auto max-w-2xl">
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
            <CtaSurface className="grid gap-8 sm:gap-12 lg:grid-cols-12 lg:items-center">
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
            </CtaSurface>
          </div>
        </section>
      </main>
    </>
  );
}
