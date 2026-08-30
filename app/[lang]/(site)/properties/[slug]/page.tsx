import type { Metadata } from "next";
import { LocaleLink as Link } from "@/components/locale-link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Bath,
  BedDouble,
  Check,
  Compass,
  Landmark,
  Layers,
  MapPin,
  Ruler,
} from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CardScroller } from "@/components/card-scroller";
import { cn } from "@/lib/cn";
import { SLIDE_CLASS } from "@/lib/carousel-classes";
import { EnquiryPanel, MobileEnquiryBar } from "@/components/enquiry-panel";
import { JsonLd } from "@/components/json-ld";
import { toPropertyCardData } from "@/lib/property-card-data";
import { Price } from "@/components/price";
import { PropertyGallery } from "@/components/property-gallery";
import { Reveal } from "@/components/reveal";
import { PropertyCard } from "@/components/property-card";
import {
  breadcrumbSchema,
  villaListingSchema,
  villaProductSchema,
} from "@/lib/schema";
import { currentLocale, currentLanguage } from "@/lib/current-locale";
import { getLocalizedField } from "@/lib/localized";
import { getT } from "@/lib/i18n/server";
import { HOME_CRUMB, pageMetadata, type Crumb } from "@/lib/seo";
import type { Villa } from "@/lib/types";
import { formatAreaLabel, getServiceArea } from "@/lib/site";
import { safeMapCoordinates, villaSummaryLine } from "@/lib/villa-format";
import {
  getAllVillaSlugs,
  getVillaBySlug,
  getVillasByArea,
} from "@/lib/villas";

/**
 * ÇAPRAZ SATIŞ SIRALAMASI — küçük olan önce gelir.
 *
 * `off-market` burada geçmiyor: `getVillasByArea` onu zaten eliyor.
 * Yine de haritada duruyor, çünkü eksik bir anahtar `undefined` döndürüp
 * karşılaştırmayı `NaN`e çevirirdi — o durumda sıralama sessizce
 * rastgeleleşir.
 */
const STOCK_ORDER: Record<Villa["status"], number> = {
  "for-sale": 0,
  reserved: 1,
  sold: 2,
  "off-market": 3,
};

/** Tüm ilan sayfaları build anında üretilir — çalışma zamanında veri okuması yok. */
export async function generateStaticParams() {
  const slugs = await getAllVillaSlugs();
  return slugs.map((slug) => ({ slug }));
}

/**
 * Yayından kaldırılmış ilanlar 404 döner. `getAllVillas` off-market kayıtları
 * zaten filtreliyor; burada da aynı kuralı uygulamazsak liste sayfasında
 * görünmeyen bir ilan doğrudan URL ile hâlâ açılabilirdi.
 */
async function findPublishedVilla(slug: string): Promise<Villa | undefined> {
  const villa = await getVillaBySlug(slug);
  return villa && villa.status !== "off-market" ? villa : undefined;
}

export async function generateMetadata(
  props: PageProps<"/[lang]/properties/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const villa = await findPublishedVilla(slug);

  /**
   * Sayfa 404 olacaksa metadata da onu yansıtmalı: aksi hâlde Google
   * "başlığı olan ama içeriği olmayan" bir sayfa görür.
   */
  if (!villa) {
    const locale = await currentLocale();
    const t = await getT();

  return pageMetadata({
      title: t("properties.notFoundTitle"),
      description: t("properties.notFoundBody"),
      path: "/properties",
      locale,
      noIndex: true,
    });
  }

  /*
    SEO METNİ DE AKTİF DİLDEN. `<title>` ve meta açıklaması sayfanın
    GÖRÜNEN içeriğiyle aynı dilde olmalı; /tr sayfasında İngilizce bir
    başlık, arama sonucunda kullanıcıya yanlış dili vaat eder.
  */
  const language = await currentLanguage();

  return pageMetadata({
    title: getLocalizedField(villa.seo.title, language),
    description: getLocalizedField(villa.seo.description, language),
    path: `/properties/${villa.slug}`,
    /* Anahtar kelimeler tek dilde — bkz. lib/types.ts'teki not. */
    keywords: villa.seo.keywords,
    images: villa.images.map((image) => ({
      url: image.src,
      alt: image.alt,
      width: image.width,
      height: image.height,
    })),
    type: "article",
    publishedTime: villa.publishedAt,
    modifiedTime: villa.updatedAt,
  });
}

export default async function PropertyPage(
  props: PageProps<"/[lang]/properties/[slug]">,
) {
  const t = await getT();
  const { slug } = await props.params;
  const villa = await findPublishedVilla(slug);

  if (!villa) notFound();

  /*
    ⚠️ ÜÇ ALAN BURADA, BİR KEZ ÇÖZÜLÜYOR.

    `getLocalizedField` aktif dili dener, çeviri boşsa İngilizceye düşer —
    yani /tr ve /ru sayfaları çevrilmemiş bir ilanda da DOLU görünür.
    Her kullanım yerinde ayrı ayrı çağırmak yerine tepede çözmek, başlığın
    H1'de, galeri etiketinde, breadcrumb'da ve harita alt metninde
    birbirinden ayrışmasını yapısal olarak imkânsız kılıyor.
  */
  const language = await currentLanguage();
  const title = getLocalizedField(villa.title, language);
  const description = getLocalizedField(villa.description, language);
  const whyThisOne = getLocalizedField(villa.whyThisOne, language);

  /** Haritaya verilebilecek koordinat — ya da null. Miami asla dönmez. */
  const mapPoint = safeMapCoordinates(villa);

  /** Panele giden dar model — koordinat ve açıklama sınırı geçmiyor. */
  const enquiryVilla = {
    title,
    reference: villa.reference,
    status: villa.status,
    price: villa.price.gbp,
    bedrooms: villa.bedrooms,
    bathrooms: villa.bathrooms,
    buildSizeSqm: villa.buildSizeSqm,
  };

  const crumbs: Crumb[] = [
    HOME_CRUMB,
    { name: "Properties", path: "/properties" },
    { name: title, path: `/properties/${villa.slug}` },
  ];

  /**
   * BÖLGE ADI KAYITTAN DEĞİL, TAKSONOMİDEN OKUNUYOR.
   *
   * `villa.location.area` kaydın kendi kopyası ve taşımadan geldiği gibi
   * kalabiliyor; `serviceAreas` ise tek kaynak. Bölge bir kez yeniden
   * adlandırıldığında ("Fethiye Merkez" → "Fethiye") kayıtlar
   * güncellenmiş olsa bile bu sıra doğru olanı garanti ediyor. Kartlar
   * (lib/property-card-data.ts) zaten aynı sırayı izliyordu; bu sayfa
   * izlemiyordu ve iki yüzey aynı ilan için farklı ad gösterebiliyordu.
   */
  const areaName =
    getServiceArea(villa.location.areaSlug)?.name ?? villa.location.area;
  /* "Fethiye, Fethiye" olmaz — bkz. lib/site.ts `formatAreaLabel`. */
  const areaLabel = formatAreaLabel(areaName, villa.location.district);

  /**
   * ALAN TEK HÜCREDE — "Internal" ve "Plot" birleştirildi.
   *
   * Neden: altı hücre dört sütunlu bir ızgarada 4 + 2 diziliyordu ve son
   * satırda iki hücrelik boşluk kalıyordu. Boşlukta kap zemini (`bg-line`)
   * göründüğü için bunlar "boş kutu" gibi duruyordu, kasıtlı bir aralık
   * gibi değil.
   *
   * İki ölçü zaten aynı soruya cevap veriyor ("ne kadar yer var"), bu yüzden
   * birleştirmek yalnızca ızgarayı düzeltmiyor, bilgiyi de daha okunur
   * hâle getiriyor: iç alan ile arsa yan yana okunduğunda ancak birbirine
   * göre anlam kazanıyor.
   *
   * SIFIR BİR ÖLÇÜ DEĞİL, "bilinmiyor" demektir — taşınan veride bu alanlar
   * boş olabiliyor. `property-card.tsx` ile aynı kural: 0 basılmaz, satır
   * hiç gösterilmez. İkisi de boşsa hücrenin tamamı düşer.
   */
  const areaLines = [
    villa.buildSizeSqm > 0 && {
      value: `${villa.buildSizeSqm} m²`,
      note: t("properties.internal"),
    },
    villa.plotSizeSqm > 0 && { value: `${villa.plotSizeSqm} m²`, note: t("properties.plot") },
  ].filter(Boolean) as { value: string; note: string }[];

  const keyFacts = [
    villa.bedrooms > 0 && {
      icon: BedDouble,
      label: t("properties.bedrooms"),
      lines: [{ value: String(villa.bedrooms), note: "" }],
    },
    villa.bathrooms > 0 && {
      icon: Bath,
      label: t("properties.bathrooms"),
      lines: [{ value: String(villa.bathrooms), note: "" }],
    },
    areaLines.length > 0 && { icon: Ruler, label: t("properties.area"), lines: areaLines },
    villa.floors > 0 && {
      icon: Layers,
      label: t("properties.floors"),
      lines: [{ value: String(villa.floors), note: "" }],
    },
    villa.propertyType && {
      icon: Compass,
      label: t("properties.type"),
      lines: [{ value: villa.propertyType, note: "" }],
    },
  ].filter(Boolean) as {
    icon: typeof BedDouble;
    label: string;
    lines: { value: string; note: string }[];
  }[];

  /**
   * ÇAPRAZ SATIŞ ARTIK AYNI BÖLGEDEN — ve bu, önceki kararın TERSİ.
   *
   * Eskiden liste `getAllVillas()`ten geliyordu ve notu "aynı bölgeden
   * değil, portföyün geri kalanından" diyordu. O yaklaşım alıcının nasıl
   * karar verdiğini yansıtmıyordu: Hisarönü'nde bir villaya bakan kişi
   * Hisarönü'nü seçmiş demektir; ona Üzümlü'den bir ilan göstermek, aynı
   * kararı baştan aldırmaya çalışmaktır. Bölge sabitken karşılaştırılabilir
   * ilan göstermek, ziyaretçiyi listeye geri döndürmeden ikinci bir sayfaya
   * taşıyor.
   *
   * `getVillasByArea` `getAllVillas` üzerine kurulu, yani `off-market`
   * kayıtlar burada da elenmiş durumda.
   *
   * ⚠️ BÖLÜM TAMAMEN DÜŞEBİLİR. Bölgesinde tek olan ilanlarda liste boş
   * kalıyor ve aşağıdaki `otherVillas.length > 0` kontrolü bölümü hiç
   * basmıyor. Mevcut veride bu 57 ilandan 4'ü (Dalaman, Kalkan, Seydikemer,
   * Bekçiler). Boş bir "portföyden daha fazlası" başlığı basmaktansa
   * bölümü hiç göstermemek doğru davranış.
   *
   * Üst sınır 3 değil 6: aynı bölgede 17 ilana kadar çıkan alanlar var
   * (Ovacık) ve altı kart, mobil karuselde kaydırmayı hak eden en küçük
   * sayı — üçü tek ekranda bitiyordu.
   */
  const otherVillas = (await getVillasByArea(villa.location.areaSlug))
    .filter((item) => item.slug !== villa.slug)
    /*
      SATILANLAR EN SONA — ve sıralama DİLİMLEMEDEN ÖNCE.

      Aynı bölgeden altı kart göstermek, o bölgenin satılmış stoğunu da
      öne çıkarma riski taşıyor: veride 57 ilanın 19'u `sold` ve bölgeye
      göre süzülünce bu oran bir satırda yoğunlaşabiliyor (Ovacık'ta ilk
      altının dördü satılmıştı). Ziyaretçiye satın alamayacağı dört ev
      göstermek, çapraz satış bloğunu vitrin olmaktan çıkarıp arşive
      çeviriyor.

      ⚠️ `.sort()` `.slice()`TEN ÖNCE olmak zorunda. Sonra gelseydi altılık
      pencere hâlâ satılmışlarla dolar, sıralama yalnızca o altısını kendi
      içinde dizerdi.

      SIRALAMA ANAHTARI ÜÇ KADEMELİ, iki değil. Brief "satılanlar en sona"
      diyor; `reserved` ikisinin arasında duruyor — hâlâ ilgi çekici ama
      artık müsait değil. Mevcut veride `reserved` kaydı yok, yani bugün
      hiçbir şeyi değiştirmiyor; durum sonradan kullanıldığında doğru
      davranmasi için yazıldı.

      `sort` ES2019'dan beri KARARLI: aynı kademedeki ilanlar
      `getVillasByArea`ten geldikleri sırayı koruyor.
    */
    .sort((a, b) => STOCK_ORDER[a.status] - STOCK_ORDER[b.status])
    .slice(0, 6);

  return (
    <>
      <JsonLd
        schema={[
          villaProductSchema(villa, language),
          villaListingSchema(villa, language),
          breadcrumbSchema(crumbs),
        ]}
      />

      {/* pb-28: mobil aksiyon çubuğu sayfanın son satırını örtmesin. */}
      <main id="main" className="pb-28 lg:pb-0">
        {/*
          İLK EKRAN GALERİNİN — ÜST BOŞLUK VE ÜST BLOKLAR BİLİNÇLİ OLARAK KISILDI.

          Önceki dizilim, fotoğraflardan ÖNCE dört ayrı blok basıyordu:
          `pt-10` breadcrumb + `pt-8` konum satırı + `mt-5` H1 + `mt-10`
          galeri, artı `lg` altında fiyat bloğu. 390px'lik bir ekranda bu,
          galerinin ilk pikselini katlamanın ~330px altına itiyordu — yani
          ilan sayfasının tek gerçek satış aracı ilk ekranda hiç görünmüyordu.

          Yeni kural: GALERİNİN ÜSTÜNDE YALNIZCA H1 VAR. Konum satırı, fiyat
          ve özet satırı galerinin ALTINDAKİ künye şeridine taşındı; hiçbiri
          silinmedi, yalnızca sırası değişti.

          Breadcrumb yukarıda kaldı ama boşluğu kısıldı: hem `BreadcrumbList`
          schema'sıyla aynı diziden besleniyor (bkz. components/breadcrumbs.tsx)
          hem de 12px'lik tek satır — taşımanın kazandıracağı yer, kaybettireceği
          gezinmeye değmiyor.
        */}
        <div className="container-page pt-4 sm:pt-5">
          <Breadcrumbs crumbs={crumbs} />
        </div>

        {/* --------------------------------------------------------- BAŞLIK */}
        <header className="container-page mt-3 sm:mt-4">
          {/*
            Sayfadaki tek H1 — ve galerinin üstündeki TEK öğe.

            ⚠️ ÖLÇEK ÜÇ KADEMEYE ÇIKARILDI: `sm:text-5xl` idi, araya
            `sm:text-4xl` girip 5xl `lg`ye alındı. 640px'lik bir ekranda 48px
            punto, "Detached Villa with Private Pool and Sea Views" gibi
            tipik bir başlığı üç satıra bölüyor ve tek başına ~170px yer
            kaplıyordu — yani boşluğu kısarak kazandığımız yeri başlık geri
            alıyordu. `lg`de kadraj zaten geniş, orada 5xl duruyor.

            `max-w-4xl`: tam genişlikte bir H1 1440px'te satır başına 60+
            karaktere çıkıyor; display fontunda bu, başlığı bir paragraf
            gibi okutur.
          */}
          <h1 className="max-w-4xl font-display text-3xl leading-[1.08] tracking-tight text-sea-deep sm:text-4xl lg:text-5xl">
            {title}
          </h1>
        </header>

        {/* --------------------------------------------------------- GALERİ */}
        <div className="container-page mt-4 sm:mt-5">
          <PropertyGallery images={villa.images} title={title} />
        </div>

        {/* ------------------------------------------- KÜNYE ŞERİDİ (GALERİ ALTI) */}
        {/*
          GALERİDEN HEMEN SONRA: NEREDE, NE KADAR, NE BÜYÜKLÜKTE.

          Fotoğrafları gören ziyaretçinin sırayla sorduğu üç soru bu; bu
          yüzden şerit galerinin hemen altında ve içerik ızgarasının ÜSTÜNDE
          duruyor — ızgaraya girseydi `lg`de sol sütuna sıkışıp sağdaki
          yapışkan panelin yanında ikinci bir dar kolon gibi okunurdu.

          FİYAT HÂLÂ `lg:hidden` — taşınırken davranış değişmedi.
          Masaüstünde fiyat sağdaki yapışkan panelde duruyor
          (components/enquiry-panel.tsx) ve aynı sayfada iki kez basmak
          gereksiz. `lg` altında ise o panel DOM sırasında sayfanın dibinde
          kalıyor; fiyatı orada bırakmak mobilde dönüşümü öldürür.

          `sm:items-end`: konum satırı küçük punto, fiyat 4xl. Üstten
          hizalandıklarında fiyatın rakamları konum satırının çok altında
          kalıyor; alt hizada iki blok aynı taban çizgisine oturuyor.
        */}
        <div className="container-page mt-6 sm:mt-8">
          <div className="flex flex-col gap-5 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-sea">
              <MapPin className="size-3.5" aria-hidden="true" />
              {areaLabel} — {villa.location.region}
            </p>

            <div className="shrink-0 lg:hidden">
              <Price
                gbp={villa.price.gbp}
                className="block font-display text-4xl leading-none text-sea-deep sm:text-right"
              />
              <p className="mt-3 text-sm text-ink-70 sm:text-right">
                {villaSummaryLine(villa)}
              </p>
            </div>
          </div>
        </div>

        {/* --------------------------------------- İÇERİK + YAPIŞKAN PANEL */}
        <div className="container-page grid gap-16 pb-section pt-10 sm:pt-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            {/* ------------------------------------------------ KÜNYE KUTULARI */}
            <section aria-labelledby="facts-heading">
              <h2 id="facts-heading" className="sr-only">
                {t("properties.keyFacts")}
              </h2>
              {/*
                gap-px + arka plan: hücreler arasında 1px'lik ayırıcı çizgi
                oluşur. Sekiz ayrı kenarlık çizmeye kıyasla hem daha temiz
                görünür hem de köşelerde çift çizgi olmaz.

                IZGARA DEĞİL, ESNEK SATIR — ve bu bilinçli.

                `grid-cols-4` ile son satır ancak öğe sayısı sütun sayısına
                tam bölündüğünde doluyor. Beş öğe dört sütunda 4+1, üç
                sütunda 3+2 diziliyor; her iki durumda da satırın sonunda
                kap zemini görünüyor, yani yine "boş kutu". `auto-fit` de
                bunu çözmez: boş İZLERİ toplar, eksik hücreleri değil.

                `flex-wrap` + her öğede `flex-1`: son satırda kaç öğe kalırsa
                kalsın genişliği paylaşıp satırı tam dolduruyorlar. Öğe
                sayısı değiştiğinde (eksik veri yüzünden hücre düştüğünde)
                de bozulmuyor — düzen artık sayıya bağlı değil.

                `basis-32`: bu genişliğin altına inmeden sarma kararı verilir,
                yani mobilde iki, tablette üç, masaüstünde beş sütun.
              */}
              <dl className="flex flex-wrap gap-px overflow-hidden border border-line bg-line">
                {keyFacts.map((fact) => (
                  <div
                    key={fact.label}
                    className="flex-1 basis-36 bg-shell p-5"
                  >
                    <fact.icon className="size-4 text-sea" aria-hidden="true" />
                    <dt className="mt-4 text-[10px] uppercase tracking-widest text-ink-40">
                      {fact.label}
                    </dt>
                    {/*
                      `whitespace-nowrap` + küçük harf not.

                      İlk sürümde not `uppercase tracking-widest` idi ve
                      hücre genişliğine sığmıyordu: satır "245" / "m²
                      INTERNAL" diye BİRİMİN ORTASINDAN kırılıyordu — bir
                      ölçüyü sayısından ayırmak, okunurluk hatasının en
                      belirgin hâli. Büyük harf + geniş aralık o etikete
                      gereğinden fazla yer veriyordu; küçük harf ve normal
                      aralık aynı bilgiyi yarı genişlikte taşıyor.
                    */}
                    <dd className="mt-1.5 font-display text-lg leading-tight text-sea-deep">
                      {fact.lines.map((line) => (
                        <span
                          key={line.note || line.value}
                          className="block whitespace-nowrap"
                        >
                          {line.value}
                          {line.note ? (
                            <span className="ml-1.5 font-sans text-[11px] font-normal lowercase text-ink-40">
                              {line.note}
                            </span>
                          ) : null}
                        </span>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* ------------------------------------------------- WHY THIS ONE */}
            {/*
              BÖLÜM KOŞULLU — veri yoksa HİÇ BASILMIYOR.

              Boş bir başlık ve altında boş bir ızgara, "içerik eksik" gibi
              değil "site bozuk" gibi görünür. `?.length` kontrolü hem
              tanımsız (alan sonradan eklendi, eski kayıtlarda olmayabilir)
              hem de boş dizi durumunu tek seferde kapsıyor.

              ⚠️ VERİ KAYNAĞI DEĞİŞTİ: bu bölüm eskiden `villa.highlights`ten
              basılıyordu. O alan `scripts/adapt-villas.js` tarafından
              ÜRETİLİYOR ("4 bedrooms, 4 bathrooms — 245 m² internal") ve
              yönetici panelinde görünmüyordu — yani ekranda duran metnin
              düzenlenebileceği bir yer yoktu. `whyThisOne` elle yazılıyor.
              `highlights` silinmedi: kart arama metnini beslemeye devam
              ediyor (lib/property-card-data.ts).
            */}
            {whyThisOne?.length ? (
              <Reveal className="mt-16" y={20}>
                <section aria-labelledby="why-heading">
                  <h2
                    id="why-heading"
                    className="font-display text-2xl text-sea-deep sm:text-3xl"
                  >
                    {t("properties.whyThisOne")}
                  </h2>

                  {/*
                    IZGARA: mobilde tek sütun, `md`den itibaren iki.

                    Kırılma noktası `sm` değil `md` — maddeler cümle ve
                    640px'lik bir ekranda iki sütun, satır başına ~28
                    karaktere düşüyor; her kart dört-beş satıra bölünüyor
                    ve ızgara tarak gibi görünüyordu.
                  */}
                  <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {whyThisOne.map((point: string, index: number) => (
                      /*
                        ANAHTARDA İNDEKS: liste sunucuda, sabit veriden, tek
                        seferde basılıyor — sıralama ya da ekleme/çıkarma
                        yok. Metnin kendisi anahtar olamaz çünkü iki ilanda
                        aynı maddenin tekrarı serbest.
                      */
                      <li
                        key={`${point}-${index}`}
                        /*
                          `items-start`: ikon metnin İLK SATIRIYLA hizalı
                          kalmalı. Ortalanmış hizada, iki satıra taşan bir
                          maddede ikon satırların arasına düşüyor.
                        */
                        className="flex items-start gap-3 border-l-4 border-sea-deep bg-shell-deep p-5 text-sm leading-relaxed text-ink-70"
                      >
                        <Check
                          className="mt-0.5 size-4 shrink-0 text-sea-deep"
                          aria-hidden="true"
                        />
                        {point}
                      </li>
                    ))}
                  </ul>
                </section>
              </Reveal>
            ) : null}

            {/* ---------------------------------------------------- AÇIKLAMA */}
            <Reveal className="mt-16" y={20}>
              <section aria-labelledby="description-heading">
                <h2
                  id="description-heading"
                  className="font-display text-2xl text-sea-deep sm:text-3xl"
                >
                  {t("properties.aboutProperty")}
                </h2>
                <div className="mt-8 space-y-6">
                  {description.map((paragraph: string, index: number) => (
                    <p
                      /*
                        `paragraph.slice(0, 40)` iki kat kırılgandı: yalnızca
                        birebir aynı satırlar değil, AYNI 40 KARAKTERLE
                        BAŞLAYAN farklı satırlar da çakışıyordu.
                      */
                      key={`${paragraph.slice(0, 40)}-${index}`}
                      className="max-w-prose text-base leading-relaxed text-ink-70"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            </Reveal>

            {/* ---------------------------------------------------- ÖZELLİKLER */}
            <Reveal className="mt-16" y={20}>
              <section aria-labelledby="features-heading">
                <h2
                  id="features-heading"
                  className="font-display text-2xl text-sea-deep sm:text-3xl"
                >
                  {t("properties.features")}
                </h2>
                {/* Rozet biçimi: taranabilir, kısa ve metin duvarı üretmez. */}
                <ul className="mt-8 flex flex-wrap gap-2">
                  {getLocalizedField(villa.features, language).map((feature, index) => (
                    <li
                      key={`${feature}-${index}`}
                      className="inline-flex items-center gap-2 border border-line bg-shell px-4 py-2 text-sm text-ink-70"
                    >
                      <span
                        aria-hidden="true"
                        className="size-1.5 shrink-0 bg-sea"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>

            {/* Tapu bilgisi ayrı bir blok: İngiliz alıcının ilk sorusu bu. */}
            <Reveal className="mt-16" y={20}>
              <section
                aria-labelledby="legal-heading"
                className="border border-line bg-shell-deep p-8 sm:p-10"
              >
                <h2
                  id="legal-heading"
                  className="inline-flex items-center gap-3 font-display text-xl text-sea-deep"
                >
                  <Landmark className="size-5 text-sea" aria-hidden="true" />
                  {t("properties.legalHeading")}
                </h2>
                <dl className="mt-8 grid gap-6 sm:grid-cols-3">
                  <div>
                    <dt className="text-[10px] uppercase tracking-widest text-ink-40">
                      {t("properties.deedStatus")}
                    </dt>
                    <dd className="mt-2 text-sm text-ink-70">
                      {villa.deedStatus}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-widest text-ink-40">
                      {t("properties.citizenshipProgramme")}
                    </dt>
                    <dd className="mt-2 text-sm text-ink-70">
                      {villa.citizenshipEligible
                        ? "Above the current investment threshold — may qualify, subject to independent legal advice."
                        : "Below the current investment threshold for the citizenship programme."}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-widest text-ink-40">
                      {t("properties.reference")}
                    </dt>
                    <dd className="mt-2 text-sm text-ink-70">
                      {villa.reference}
                    </dd>
                  </div>
                </dl>
                <p className="mt-8 border-t border-line pt-6 text-xs leading-relaxed text-ink-40">
                  Every purchase we handle is completed with independent legal
                  representation instructed by you, never by the seller.{" "}
                  <Link
                    href="/buying-process"
                    className="text-sea-deep underline underline-offset-4"
                  >
                    {t("properties.readBuying")}
                  </Link>
                  .
                </p>
              </section>
            </Reveal>

            {/* ------------------------------------------------------- HARİTA */}
            {/*
              HARİTA YALNIZCA GÜVENLİ KOORDİNATLA.

              Bu bölüm daha önce `villa.location.coordinates` değerini
              doğrudan Google Maps embed'ine veriyordu. Taşınan 57 ilanın
              21'inde o değer Houzez'in varsayılan pin'i — yani sayfada
              "Villa Majestic, Hisarönü" başlığının altında MİAMİ,
              FLORIDA haritası gömülü duruyordu.

              `safeMapCoordinates` üç sonuç döner:
                - gerçek koordinat  -> harita, kesin konum notuyla,
                - bölge merkezi     -> harita, "yaklaşık" uyarısıyla,
                - null              -> harita HİÇ render edilmez.
            */}
            {mapPoint ? (
              <Reveal className="mt-16" y={20}>
                <section aria-labelledby="location-heading">
                  <h2
                    id="location-heading"
                    className="font-display text-2xl text-sea-deep sm:text-3xl"
                  >
                    {t("properties.location")}
                  </h2>
                  <p className="mt-4 max-w-prose text-sm leading-relaxed text-ink-70">
                    {mapPoint.approximate
                      ? `This pin shows the centre of ${areaName}, not the property itself — we hold an approximate location for this listing. Exact addresses are shared with viewers.`
                      : "This pin shows the property's recorded position. Exact addresses are shared with viewers."}
                  </p>
                  <div className="mt-8 aspect-[16/10] overflow-hidden border border-line bg-shell-deep">
                    <iframe
                      title={
                        mapPoint.approximate
                          ? `Map showing the ${areaName} area`
                          : `Map showing the location of ${title} in ${areaLabel}`
                      }
                      src={`https://www.google.com/maps?q=${mapPoint.lat},${mapPoint.lng}&hl=en&z=${mapPoint.approximate ? 12 : 14}&output=embed`}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="size-full border-0"
                    />
                  </div>
                </section>
              </Reveal>
            ) : null}
          </div>

          {/* ------------------------------------------ SAĞ SÜTUN (YAPIŞKAN) */}
          <aside
            aria-labelledby="enquiry-heading"
            className="lg:col-span-4 lg:col-start-9"
          >
            <EnquiryPanel villa={enquiryVilla} />
          </aside>
        </div>

        {/* -------------------------------------------------- BENZER İLANLAR */}
        {otherVillas.length > 0 ? (
          <section
            aria-labelledby="more-heading"
            className="border-t border-line bg-shell-deep py-section"
          >
            <div className="container-page">
              <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <h2
                  id="more-heading"
                  className="font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
                >
                  {t("properties.moreFromPortfolio")}
                </h2>
                <Link
                  href="/properties"
                  className="group inline-flex shrink-0 items-center gap-2 text-sm text-sea-deep underline-offset-4 hover:underline"
                >
                  {t("properties.viewAll")}
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </Reveal>

              {/*
                MOBİLDE YATAY KARUSEL, `sm`DEN İTİBAREN IZGARA.

                Altı kart mobilde alt alta dizilince bu bölüm ~2.400px'lik
                bir şeride dönüşüyordu; sayfanın en altındaki bir çapraz
                satış bloğu için bu, kaydırma yorgunluğundan başka bir şey
                değil. Yatay şerit, liste uzunluğunu sayfa uzunluğuna
                çevirmiyor.

                CSS KAYDIRMA-YAPIŞMASI, embla DEĞİL. Ana sayfadaki vitrin
                (components/featured-carousel.tsx) embla kullanıyor çünkü
                orada ok düğmeleri ve nokta göstergeleri var. Burada
                gerekmiyor: bu bölüm sayfanın kuyruğunda, ikincil bir blok.
                `snap-x` + `overflow-x-auto` aynı dokunmatik hissi sıfır JS
                ile veriyor — istemci paketi büyümüyor.

                `w-[86%]`: ana sayfadaki slayt genişliğiyle (`flex-[0_0_86%]`)
                birebir aynı. Yüzde ondört boşluk, SONRAKİ KARTIN KENARINI
                gösteriyor — kaydırılabilirliğin en sessiz işareti bu, bir
                ok düğmesinden daha etkili.

                `sm:w-auto` ŞART: ızgaraya geçerken genişliği geri almazsak
                iki sütunlu ızgarada kartlar hücrenin %86'sında kalır.

                ⚠️ `Reveal` KARTLARIN İÇİNDEN ÇIKARILDI, dışına alındı.
                `.reveal` `animation-timeline: view()` kullanıyor ve bu, en
                yakın KAYDIRMA KAPSAYICISINA bağlanıyor. Kartlar yatay bir
                kaydırıcının içindeyken o kapsayıcı artık sayfa değil şerit
                oluyor; dikey eksende hiç kaydırma olmadığı için animasyon
                ilerlemiyor ve kartlar `opacity: 0`da takılı kalabiliyordu.
                Tek bir `Reveal` şeridin tamamını sarıyor: kademeli gecikme
                gitti, ama görünmez kart riski de gitti.

                `li` üzerindeki `flex`: kartın `h-full`u YÜZDE bir
                yüksekliktir ve ancak atası belirli bir yükseklik verirse
                çalışır. `items-stretch` hem şeritte hem ızgarada bunu
                sağlıyor — satırdaki fiyat ve "View" düğmeleri aynı hizada
                bitiyor.
              */}
              <Reveal className="mt-12" y={24}>
                <CardScroller>
                  {otherVillas.map((item) => (
                    <li
                      key={item.id}
                      /*
                        HİZALAMA SINIFLARI ORTAK SABİTTEN: `SLIDE_CLASS`
                        (`flex shrink-0 snap-start snap-always`) ana sayfa
                        vitrininin slaytlarıyla BİREBİR aynı. Sınıflar iki
                        dosyada elle tekrarlansaydı, birinde yapılan bir
                        hizalama düzeltmesi diğerinde eksik kalırdı — nitekim
                        `snap-always` bu turda tam olarak öyle eklendi.
                      */
                      className={cn(SLIDE_CLASS, "w-[86%] sm:w-[52%] lg:w-auto")}
                    >
                      <PropertyCard villa={toPropertyCardData(item, language)} />
                    </li>
                  ))}
                </CardScroller>
              </Reveal>
            </div>
          </section>
        ) : null}
      </main>

      <MobileEnquiryBar villa={enquiryVilla} />
    </>
  );
}
