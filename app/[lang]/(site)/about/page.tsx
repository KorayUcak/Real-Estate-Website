import type { Metadata } from "next";
import Image from "next/image";
import { LocaleLink as Link } from "@/components/locale-link";
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
 * Hakkımızda banner görseli — KURUCULAR.
 *
 * `lib/imagery.ts` içindeki Unsplash havuzunda DEĞİL: bu marka fotoğrafı,
 * stok görsel değil. Havuza koymak onu diğer sayfaların da çekebileceği
 * genel bir görsel gibi gösterirdi.
 *
 * Dosya kaynaktan BAYT BAYT kopyalandı, yeniden kodlanmadı. Kaynak
 * WhatsApp üzerinden geldiği için zaten sıkıştırılmış (1528×1028, 163 KB,
 * progressive, EXIF/ICC yok); mozjpeg ile q88–92 arası her deneme dosyayı
 * 233–262 KB'a BÜYÜTÜYOR ve üstüne ikinci bir kayıp katmanı ekliyordu.
 * Yani yeniden kodlamak burada hem daha büyük hem daha bozuk demekti.
 * Boyut optimizasyonunu `next/image` zaten yapıyor: WebP/AVIF türevlerini
 * `sizes` ile birlikte kendisi üretiyor.
 *
 * ALT METNİ İSİM İÇERİYOR: "Coast 2 Coast Properties Turkey" jenerikti ve
 * karede ne olduğunu söylemiyordu. Görsel artık iki kurucunun portresi.
 */
const ABOUT_BANNER = {
  src: "/images/about/founders-ronnie-nilay.jpg",
  alt: "Ronnie and Nilay, founders of Coast2Coast Properties Turkey, on the seafront in Fethiye",
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



/**
 * HİKÂYE ALT BÖLÜMÜ — başlık + altın kural + paragraf yığını.
 *
 * Dört kez tekrar eden bir kalıp: aynı başlık ölçüsü, aynı üst boşluk,
 * aynı paragraf aralığı. Elle dört kez yazılsaydı biri diğerlerinden
 * sessizce ayrılırdı — uzun bir sayfada gözden kaçan, ama okuma ritmini
 * bozan türden bir kayma.
 *
 * `aria-labelledby` başlığa bağlanıyor: adı olan bir `<section>` erişilebilirlik
 * ağacında `region` olarak görünür, yani ekran okuyucu kullanıcısı bölümler
 * arasında doğrudan gezinebilir. 1.500 kelimelik bir metinde bu, "sayfayı
 * baştan dinle"nin tek alternatifi.
 *
 * ⚠️ `space-y-6` KAPSAYICIDA, çocuklarda değil: alt bölümlerin içeriği
 * paragraf, alıntı ve liste karışımı. Her birine ayrı boşluk sınıfı vermek
 * yerine tek kural, hepsi arasında AYNI aralığı garanti ediyor.
 */
function StoryBlock({
  id,
  heading,
  children,
}: {
  id: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="mt-14 sm:mt-20">
      <h3
        id={id}
        className="font-display text-2xl leading-snug text-sea-deep sm:text-3xl"
      >
        {heading}
      </h3>
      <span aria-hidden="true" className="mt-4 block h-px w-12 bg-gold" />

      <div className="mt-6 space-y-6 leading-relaxed text-ink-70 sm:mt-8">
        {children}
      </div>
    </section>
  );
}

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
          KURUCULAR BANNER'I — TAM KANAMA (FULL-BLEED), METİNSİZ, TÜLSÜZ.

          `PageHero` yerine bu sayfaya özel bir blok: brief banner'ın
          üstündeki tüm metnin kalkmasını istiyor, `PageHero` ise
          eyebrow + h1 + lede üçlüsünü basmak için var. Ona bir "metni gizle"
          anahtarı eklemek, dokuz sayfanın paylaştığı bileşeni tek sayfanın
          istisnası için dallandırmak olurdu.

          ⚠️ ÜSTÜNDE HİÇBİR KATMAN, ÖNÜNDE HİÇBİR BANT YOK.

          İki şey arka arkaya kaldırıldı ve ikisi de aynı amaca hizmet ediyor:

          1) TÜLLER. Önceki banner (bir tabela fotoğrafı) `ink/70 → ink/15 →
             ink/60` degradesi ve düz bir `sea-deep/25` ile kaplıydı. İkisinin
             de tek gerekçesi üstünde duran BEYAZ breadcrumb'ın okunmasıydı.
             Bu kare bir tabela değil, iki İNSAN YÜZÜ; aynı tüller Ronnie ve
             Nilay'ı gri bir perdenin arkasına alıyordu.

          2) BREADCRUMB ŞERİDİ. Tül kalkınca breadcrumb krem bir banda taşındı,
             ama o bant da başlıkla görsel arasına ~60px'lik yatay bir çizgi
             sokup tam kanama etkisini kesiyordu. Şerit tamamen kaldırıldı:
             görsel artık doğrudan navbar'ın altından başlıyor.

          ⚠️ `breadcrumbSchema(CRUMBS)` YUKARIDA DURUYOR ve `CRUMBS` bu yüzden
          silinmedi. Google'ın kendi rehberi görünür breadcrumb'ı ZORUNLU
          tutmuyor (yalnızca öneriyor), yani yapısal veri geçerli kalır —
          fakat components/breadcrumbs.tsx'teki not tersini söylüyordu.
          Sayfa hiyerarşideki yerini bildirmeye devam etsin diye şema
          bilinçli olarak bırakıldı; görsel iz yalnızca ekrandan kalktı.
        */}
        {/*
          ⚠️ <h1> SİLİNMEDİ, GÖRÜNMEZ HÂLE GETİRİLDİ. Sayfadaki tek h1 buydu;
          banner metinsiz olduğu için ekranda görünmüyor, belge yapısında ve
          arama motorunda duruyor. Tamamen kaldırmak sayfayı başlıksız
          bırakırdı — ekran okuyucu kullanıcısı için belge yapısı, arama
          motoru için sayfanın ne hakkında olduğunu söyleyen ana sinyal.

          ⚠️ YÜKSEKLİK ARTTIKÇA KADRAJ "UZAKLAŞIR" — AMA YALNIZCA GENİŞ
          EKRANDA. Bu sayfadaki en ters sezgili nokta bu, o yüzden açıkça:

          `object-cover` ölçeği max(kap_genişliği/görsel_genişliği,
          kap_yüksekliği/görsel_yüksekliği) ile seçer. Hangi terimin
          kazandığı kırpmanın YÖNÜNÜ belirliyor:

          • GENİŞ EKRANDA (≥ ~740px) genişlik kazanıyor. Görsel viewport
            genişliğine ölçekleniyor, artan yükseklik yalnızca kadrajdan DAHA
            FAZLASINI açıyor. 1440×900'de 60vh (540px) görselin boyunun
            %56'sını gösteriyordu — göğse kadar, "vesikalık" hissi buradan
            geliyordu. 75vh (675px) %70'ini gösteriyor: takımlar, kollar ve
            arkadaki çiçek kemeri kadraja giriyor.

          • MOBİLDE İLİŞKİ TERSİNE DÖNÜYOR. 390px genişlikte görselin doğal
            yüksekliği yalnızca 262px; bant bundan yüksek olduğu anda YÜKSEKLİK
            kazanıyor ve kırpma YATAYA geçiyor. Yani mobilde bandı uzatmak
            kadrajı açmaz, KENARLARDAN KIRPAR — çiçek kemerinin durduğu sağ
            kenardan. Bu yüzden mobil değer ölçülü artırıldı (20rem → 22rem):
            352px'te görsel 523px genişliğe ölçekleniyor, kenar başına ~66px
            gidiyor ve özneler (%27–%83) rahatça içeride kalıyor. Daha fazlası
            kemeri kadrajdan atmaya başlıyordu.

          • `sm:h-[30rem]` (480px) ARADAKİ EN GENİŞ KADRAJ: 640px'te görselin
            doğal yüksekliği 430px, yani bant hâlâ yükseklik-baskın ve kırpma
            kenar başına yalnızca ~36px. Kare neredeyse bütün görünüyor.

          `lg:min-h-[28vw]` YALNIZCA ULTRA GENİŞTE DEVREYE GİRİYOR: kırpma
          oranı viewport'un YÜKSEKLİĞİNE değil GENİŞLİĞİNE bağlı olduğu için
          2560×900 gibi geniş-ve-alçak bir ekranda 75vh (675px) yetmiyor;
          28vw orada 717px veriyor. 1440 ve 1920'de 75vh zaten daha büyük,
          yani kural oralarda hiç uygulanmıyor.

          `max-h-[54rem]` (864px) uzun ekranlar için: 2560×1440'ta 75vh 1080px
          ederdi ve bant tek başına tüm ilk ekranı yerdi.
        */}
        <section
          aria-labelledby="about-heading"
          className="relative isolate h-[22rem] overflow-hidden border-b border-line bg-shell-deep sm:h-[30rem] lg:h-[75vh] lg:min-h-[28vw] lg:max-h-[54rem]"
        >
          <h1 id="about-heading" className="sr-only">
            {t("about.heroTitle")}
          </h1>

          {/*
            `object-[center_10%]` — TEK DEĞER, TÜM KIRILMA NOKTALARINDA.

            Korunması gereken bant, karede Ronnie'nin saç tepesinden
            (yüksekliğin ~%5'i) Nilay'ın çenesine (~%46) uzanıyor.

            Değer %12'den %10'a indirildi çünkü bant uzayınca pencere de
            uzadı: 1440×900'de kadraj artık görselin %3–%73 aralığı (önce
            %5–%61 idi). Alt kenarın aşağı inmesi bedava değil — pencere
            aynı oranda yukarıdan da açılıyor ve %12'de saç tepesi kadrajın
            üst kenarına fazla yaklaşıyordu. %10 hem tepede birkaç piksel pay
            bırakıyor hem de alt kenarı belin altına indiriyor.

            NEDEN `lg:` ÖNEKİ YOK: dikey konum yalnızca genişlik-baskın
            kırpmada iş yapar. Mobil ve `sm`de kırpma yatayda olduğu için bu
            değerin oralarda ÖLÇÜLEBİLİR HİÇBİR ETKİSİ YOK — tek bir sınıf
            hem daha okunur hem de 640–1024 arası "genişlik baskın olmaya
            başladığı" ara bölgeyi kapsıyor. Önceki `object-center` tabanı
            tam orada, 1023px'te, pencereyi %15'ten başlatıp Ronnie'nin saç
            tepesini kesiyordu.

            quality={95}: kaynak WhatsApp üzerinden geldiği için zaten bir kez
            sıkıştırılmış. Yeniden kodlamada varsayılan 75'e düşmek, ikinci bir
            kayıp katmanını yüzlerin üstüne bindirirdi.
          */}
          <Image
            src={ABOUT_BANNER.src}
            alt={ABOUT_BANNER.alt}
            fill
            /* Next 16'da `priority` kullanımdan kaldırıldı; `preload`
               aynı işi yapıyor (bkz. node_modules/next/dist/docs →
               image.md, "priority"). */
            preload
            quality={95}
            sizes="100vw"
            className="object-cover object-[center_10%]"
          />
        </section>

        {/* ------------------------------------------------------ HİKÂYEMİZ */}
        {/*
          EDİTORYAL TEK SÜTUN — dergi sayfası, pazarlama bloğu değil.

          Bölüm 1.500 kelimeye yakın kurucu hikâyesi taşıyor; bu uzunlukta
          bir metni kart ızgarasına bölmek okumayı bitirir. Onun yerine tek
          bir okuma sütunu var ve bütün karar o sütunun etrafında dönüyor:

          `max-w-3xl` (48rem) — satır uzunluğu masaüstünde ~75 karaktere
          oturuyor, tipografinin okunabilirlik aralığı olan 60–80'in tam
          içinde. Önceki `max-w-2xl` (42rem) üç paragraf için doğruydu ama
          bu hacimde sayfayı gereksiz uzatıyordu; tam genişlik ise 1440px'te
          110+ karakterlik satır üretir, göz satır başını kaybeder.

          RİTİM ÜÇ KADEMEDE: giriş paragrafı `text-lg` (lede), gövde temel
          punto, ara başlıklar `font-display`. Uzun metinde okuyucuyu
          taşıyan şey bu hiyerarşi — sayfada tutunacak yer bırakıyor.

          ALTIN YALNIZCA YAPISAL İŞARETLERDE: başlık altı çizgileri, alıntı
          kenarı, sütun üstü kuralları. Metnin kendisi `ink-70`de kalıyor;
          altın metin krem zeminde AA'yı geçmiyor (bkz. globals.css
          `--color-gold-deep` notu), o yüzden okunan hiçbir cümle o renkte
          değil — `gold-deep` yalnızca eyebrow'un küçük büyük harfinde.
        */}
        <section aria-labelledby="story-heading" className="bg-shell py-section lg:pt-0">
          <div className="container-page">
            {/*
              YÜZEN KART — YALNIZCA MASAÜSTÜNDE.

              ⚠️ ÇÖZDÜĞÜ SORUN ÖLÇÜLDÜ. 1440×900'de başlık 112px, hero
              `75vh` yani 675px; ikisi 787px ediyor ve geriye 113px kalıyor.
              Bölümün `py-section` üst boşluğu tam 112px (`--spacing-section:
              7rem`) — yani ilk ekranda kalan o şerit BİREBİR boşluktu:
              ziyaretçi kaydırmadan tek bir kelime görmüyordu. Kremin
              üstünde krem, hiçbir şey söylemeyen bir bant.

              İki değişiklik birlikte çalışıyor:
                · bölümde `lg:pt-0` — o 112px'lik boşluk kalkıyor,
                · kartta `lg:-mt-32` (128px) — kart hero'nun son 128px'ine
                  biniyor.

              Sonuç: kart 659px'te başlıyor, `lg:pt-16` sonrası eyebrow
              723'te, `<h2>` ("Coast2Coast Properties Turkey") 763–807
              arasında. İkisi de 900px'lik ekranda, katlamanın üstünde.

              ⚠️ 128px NEDEN GÜVENLİ: hero bandı görselin ~%3–%73 aralığını
              gösteriyor (bkz. yukarıdaki `object-[center_10%]` notu). Son
              128px o bandın ~%19'u, yani görselin ~%60'ından aşağısı —
              karede bel hizası. Yüzler %5–%46 aralığında kalıyor, kart
              onlara yaklaşmıyor bile.

              ⚠️ 36 (144px) DENENDİ VE GERİ ALINDI: kısa bir dizüstünde
              (813px'lik gerçek içerik yüksekliği) kartın üst kenarı
              Nilay'ın çenesine ~24px kalıyordu. Katlama kazancı birkaç
              piksel, risk ise portrenin kesilmesi.

              ⚠️ `relative z-10` ŞART: hero `isolate` ile kendi yığma
              bağlamını kuruyor. Kart konumlandırılmamış bırakılsaydı
              negatif kenar boşluğu onu yukarı taşır ama fotoğrafın ALTINDA
              boyanmasına yol açabilirdi.

              ⚠️ MOBİL VE TABLET DEĞİŞMEDİ. Kenar boşluğu, iç boşluk ve
              gölge yalnızca `lg:` önekli. `bg-shell` bölümün zemini ile
              AYNI renk, `max-w-4xl` de dar ekranlarda kaba kalıyor
              (`container-page` zaten daha dar) — yani `lg` altında bu
              sarmalayıcının ölçülebilir hiçbir etkisi yok.
            */}
            <div className="relative z-10 mx-auto max-w-4xl bg-shell lg:-mt-32 lg:px-16 lg:pt-16 lg:shadow-soft">
            <article className="mx-auto max-w-3xl">
              <header className="text-center">
                <p className="eyebrow text-gold-deep">
                  {t("about.story.eyebrow")}
                </p>
                <h2
                  id="story-heading"
                  className="mt-4 font-display text-3xl leading-tight text-sea-deep sm:mt-6 sm:text-4xl"
                >
                  {t("about.story.heading")}
                </h2>
                {/* Başlığı metinden ayıran ince altın kural — bölüm
                    başlıklarındaki çizgilerle aynı aile, ortalanmış hâli. */}
                <span
                  aria-hidden="true"
                  className="mx-auto mt-6 block h-px w-16 bg-gold sm:mt-8"
                />
              </header>

              {/*
                GİRİŞ PARAGRAFI GÖVDEDEN BÜYÜK VE KOYU.

                `text-lg` + `text-ink`: bu cümle sayfanın ilk sözü ve tek
                başına okunduğunda bile şirketin ne olduğunu söylüyor.
                Gövdeyle aynı puntoda olsaydı metin, girişi olmayan düz bir
                blok gibi başlardı.
              */}
              <p className="mt-8 text-lg leading-relaxed text-ink sm:mt-10 sm:text-xl sm:leading-relaxed">
                {t("about.story.lede")}
              </p>

              <div className="mt-6 space-y-6 leading-relaxed text-ink-70 sm:mt-8">
                {copy.story.intro.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>

              {/* ------------------------------------- RONNIE & NILAY */}
              <StoryBlock id="story-founders" heading={t("about.story.foundersHeading")}>
                {copy.story.founders.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}

                {/*
                  ALINTI, PARAGRAF DEĞİL.

                  "…%100 memnun" cümlesi metnin içinde bir söz veriyor;
                  gövde puntosunda kalsaydı dört paragrafın arasında
                  kaybolurdu. `blockquote` hem görsel duraklama hem doğru
                  semantik.

                  ⚠️ DİKEY BOŞLUK `py-*` İLE, `my-*` İLE DEĞİL: kapsayıcı
                  `space-y-6` kullanıyor ve o kural (`> * + *`) kardeşlerin
                  üst kenar boşluğunu kendisi yazıyor. Buraya `my-8`
                  koymak iki tek-sınıflı yardımcıyı aynı özgüllükte
                  çarpıştırır; sonucu stil sayfasındaki sıra belirler,
                  yani kırılgan. Padding o çatışmanın tamamen dışında.
                */}
                <blockquote className="border-l-2 border-gold py-1 pl-6 font-display text-xl leading-relaxed text-sea-deep sm:pl-8 sm:text-2xl">
                  {t("about.story.foundersQuote")}
                </blockquote>

                <p>{t("about.story.nilay")}</p>
              </StoryBlock>

              {/* --------------------- UYGUN FİYATLIDAN LÜKSE */}
              <StoryBlock id="story-range" heading={t("about.story.rangeHeading")}>
                {copy.story.range.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </StoryBlock>

              {/* ------------------------ DÜNYADAN MÜŞTERİLER */}
              <StoryBlock id="story-clients" heading={t("about.story.clientsHeading")}>
                {copy.story.clients.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}

                <blockquote className="border-l-2 border-gold py-1 pl-6 font-display text-xl leading-relaxed text-sea-deep sm:pl-8 sm:text-2xl">
                  {t("about.story.clientsQuote")}
                </blockquote>
              </StoryBlock>

              {/* ------------------------------ NEDEN COAST2COAST */}
              <StoryBlock id="story-why" heading={t("about.story.whyHeading")}>
                <p>{t("about.story.whyLede")}</p>

                {/*
                  ÜÇ İLKE — üstünde altın kuralla üç sütun.

                  Kaynak metinde tek satırdı ("Honesty. Experience. Personal
                  Service."). Öyle bırakılsaydı sayfanın en çok alıntılanan
                  cümlesi bir paragraf gibi görünürdü. Üç sütun, üç sözcüğü
                  ekranda eşit ağırlıkta duran bir işarete çeviriyor.

                  Mobilde alt alta: 375px'te üç sütun, "Kişisel hizmet"i iki
                  satıra bölüp hizayı bozuyordu.
                */}
                <ul className="grid gap-6 sm:grid-cols-3 sm:gap-8">
                  {copy.story.pillars.map((pillar) => (
                    <li
                      key={pillar}
                      className="border-t-2 border-gold pt-4 font-display text-xl leading-snug text-sea-deep sm:text-2xl"
                    >
                      {pillar}
                    </li>
                  ))}
                </ul>

                <p>{t("about.story.whyBody")}</p>

                {/*
                  "Dinleriz. Anlarız. Yol gösteririz." — üç ayrı satır.

                  Kaynak metinde de üç ayrı satırdı ve bu bilinçli bir ritim:
                  tek paragrafa birleştirmek vurguyu düzleştirirdi. Liste
                  olmasının sebebi görsel değil semantik — ekran okuyucu
                  bunu üç öğelik bir liste olarak duyuruyor.
                */}
                <ul className="space-y-2 font-display text-xl leading-snug text-sea-deep sm:text-2xl">
                  {copy.story.creed.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>

                <p>{t("about.story.creedClose")}</p>

                {/* Kapanış cümlesi gövdeden bir tık koyu: bölümün tezini
                    özetliyor ve okuyucunun ayrıldığı yer burası. */}
                <p className="text-ink">{t("about.story.whyClose")}</p>
              </StoryBlock>

              <Link
                href="/buying-process"
                className="group mt-10 inline-flex items-center gap-2 text-sm text-sea-deep underline-offset-4 hover:underline sm:mt-14"
              >
                {t("about.story.cta")}
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </article>
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
                {/* CTA açıklama paragrafı KALDIRILDI — bu blokta artık yalnızca
                    başlık ve eylem düğmeleri var (dokuz sayfada birden).
                    Sözlükteki karşılığı da silindi. */}
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
