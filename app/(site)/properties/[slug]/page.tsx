import type { Metadata } from "next";
import Link from "next/link";
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
  TreePalm,
} from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
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
import { HOME_CRUMB, pageMetadata, type Crumb } from "@/lib/seo";
import type { Villa } from "@/lib/types";
import { safeMapCoordinates, villaSummaryLine } from "@/lib/villa-format";
import {
  getAllVillaSlugs,
  getAllVillas,
  getVillaBySlug,
} from "@/lib/villas";

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
  props: PageProps<"/properties/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const villa = await findPublishedVilla(slug);

  /**
   * Sayfa 404 olacaksa metadata da onu yansıtmalı: aksi hâlde Google
   * "başlığı olan ama içeriği olmayan" bir sayfa görür.
   */
  if (!villa) {
    return pageMetadata({
      title: "Property not found",
      description:
        "This property is no longer listed. Browse our current villas for sale in Fethiye, Ölüdeniz and Göcek.",
      path: "/properties",
      noIndex: true,
    });
  }

  return pageMetadata({
    title: villa.seo.title,
    description: villa.seo.description,
    path: `/properties/${villa.slug}`,
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
  props: PageProps<"/properties/[slug]">,
) {
  const { slug } = await props.params;
  const villa = await findPublishedVilla(slug);

  if (!villa) notFound();

  /** Haritaya verilebilecek koordinat — ya da null. Miami asla dönmez. */
  const mapPoint = safeMapCoordinates(villa);

  /** Panele giden dar model — koordinat ve açıklama sınırı geçmiyor. */
  const enquiryVilla = {
    title: villa.title,
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
    { name: villa.title, path: `/properties/${villa.slug}` },
  ];

  const keyFacts = [
    { icon: BedDouble, label: "Bedrooms", value: String(villa.bedrooms) },
    { icon: Bath, label: "Bathrooms", value: String(villa.bathrooms) },
    { icon: Ruler, label: "Internal", value: `${villa.buildSizeSqm} m²` },
    { icon: TreePalm, label: "Plot", value: `${villa.plotSizeSqm} m²` },
    { icon: Layers, label: "Floors", value: String(villa.floors) },
    { icon: Compass, label: "Type", value: villa.propertyType },
  ];

  /** Aynı bölgeden değil, portföyün geri kalanından öneri — liste kısa. */
  const otherVillas = (await getAllVillas())
    .filter((item) => item.slug !== villa.slug)
    .slice(0, 3);

  return (
    <>
      <JsonLd
        schema={[
          villaProductSchema(villa),
          villaListingSchema(villa),
          breadcrumbSchema(crumbs),
        ]}
      />

      {/* pb-28: mobil aksiyon çubuğu sayfanın son satırını örtmesin. */}
      <main id="main" className="pb-28 lg:pb-0">
        <div className="container-page pt-10">
          <Breadcrumbs crumbs={crumbs} />
        </div>

        {/* --------------------------------------------------------- BAŞLIK */}
        <header className="container-page pt-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-sea">
                <MapPin className="size-3.5" aria-hidden="true" />
                {villa.location.area}, {villa.location.district} —{" "}
                {villa.location.region}
              </p>

              {/* Sayfadaki tek H1: ilan başlığı. */}
              <h1 className="mt-5 font-display text-3xl leading-[1.08] tracking-tight text-sea-deep sm:text-5xl">
                {villa.title}
              </h1>

              {/*
                Başlık altındaki tanıtım cümlesi ("We are excited to bring you
                the Orchard Villa!") kaldırıldı — satıcı ağzıyla yazılmış,
                bilgi taşımayan bir satırdı ve H1 ile galerinin arasına
                giriyordu. Açıklamanın kendisi aşağıdaki metin bloğunda
                duruyor; `headline` alanı da veride kalmaya devam ediyor.
              */}
            </div>

            {/*
              Masaüstünde fiyat yapışkan panelde duruyor; burada ikinci kez
              göstermek yerine yalnızca lg altında görünen bir blok veriyoruz —
              mobilde fiyatın sayfanın dibinde kalması dönüşümü öldürür.
            */}
            <div className="shrink-0 lg:hidden">
              <Price
                gbp={villa.price.gbp}
                className="block font-display text-4xl leading-none text-sea-deep"
              />
              <p className="mt-3 text-sm text-ink-70">
                {villaSummaryLine(villa)}
              </p>
            </div>
          </div>
        </header>

        {/* --------------------------------------------------------- GALERİ */}
        <div className="container-page mt-10">
          <PropertyGallery images={villa.images} title={villa.title} />
        </div>

        {/* --------------------------------------- İÇERİK + YAPIŞKAN PANEL */}
        <div className="container-page grid gap-16 pb-section pt-16 lg:grid-cols-12">
          <div className="lg:col-span-7">
            {/* ------------------------------------------------ KÜNYE KUTULARI */}
            <section aria-labelledby="facts-heading">
              <h2 id="facts-heading" className="sr-only">
                Key facts
              </h2>
              {/*
                gap-px + arka plan: hücreler arasında 1px'lik ayırıcı çizgi
                oluşur. Sekiz ayrı kenarlık çizmeye kıyasla hem daha temiz
                görünür hem de köşelerde çift çizgi olmaz.
              */}
              <dl className="grid grid-cols-2 gap-px overflow-hidden border border-line bg-line sm:grid-cols-4">
                {keyFacts.map((fact) => (
                  <div key={fact.label} className="bg-shell p-5">
                    <fact.icon className="size-4 text-sea" aria-hidden="true" />
                    <dt className="mt-4 text-[10px] uppercase tracking-widest text-ink-40">
                      {fact.label}
                    </dt>
                    <dd className="mt-1.5 font-display text-lg leading-tight text-sea-deep">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* ------------------------------------------------- ÖNE ÇIKANLAR */}
            <Reveal className="mt-16" y={20}>
              <section aria-labelledby="highlights-heading">
                <h2
                  id="highlights-heading"
                  className="font-display text-2xl text-sea-deep sm:text-3xl"
                >
                  Why this one
                </h2>
                {/*
                  ANAHTARLARDA İNDEKS — ve neden burada doğru olduğu.

                  Bu üç liste (highlights, description, features) doğrudan
                  `data/villas.json`den geliyor ve METİN TEKRARLARI İÇERİYOR:
                  forest-villa-25325 açıklamasında "- Freehold title deed"
                  iki kez, edgewater-villa'da tek başına "•" satırı DOKUZ
                  kez geçiyor. Dizgenin kendisini anahtar yapmak, React'in
                  aynı anahtarla iki kardeş görmesi demekti — konsoldaki
                  uyarının kaynağı tam olarak bu.

                  İndeks eklemek normalde sakıncalıdır (liste sıralanır ya
                  da araya eleman girerse React yanlış düğümü korur). Burada
                  değil: listeler sunucuda, sabit veriden, tek seferde
                  basılıyor; sıralama, filtreleme veya ekleme/çıkarma yok.
                  Dizge + indeks bileşimi hem kararlı hem benzersiz.

                  Kalıcı çözüm veriyi temizlemek olurdu ama bu, istendiği
                  gibi, veri katmanına dokunmuyor.
                */}
                <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                  {villa.highlights.map((highlight, index) => (
                    <li
                      key={`${highlight}-${index}`}
                      className="flex gap-3 border-l-2 border-sea/40 bg-shell-deep/60 p-5 text-sm leading-relaxed text-ink-70"
                    >
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-gold-deep"
                        aria-hidden="true"
                      />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>

            {/* ---------------------------------------------------- AÇIKLAMA */}
            <Reveal className="mt-16" y={20}>
              <section aria-labelledby="description-heading">
                <h2
                  id="description-heading"
                  className="font-display text-2xl text-sea-deep sm:text-3xl"
                >
                  About this property
                </h2>
                <div className="mt-8 space-y-6">
                  {villa.description.map((paragraph, index) => (
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
                  Features
                </h2>
                {/* Rozet biçimi: taranabilir, kısa ve metin duvarı üretmez. */}
                <ul className="mt-8 flex flex-wrap gap-2">
                  {villa.features.map((feature, index) => (
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
                  Title deed and legal position
                </h2>
                <dl className="mt-8 grid gap-6 sm:grid-cols-3">
                  <div>
                    <dt className="text-[10px] uppercase tracking-widest text-ink-40">
                      Deed status
                    </dt>
                    <dd className="mt-2 text-sm text-ink-70">
                      {villa.deedStatus}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-widest text-ink-40">
                      Citizenship programme
                    </dt>
                    <dd className="mt-2 text-sm text-ink-70">
                      {villa.citizenshipEligible
                        ? "Above the current investment threshold — may qualify, subject to independent legal advice."
                        : "Below the current investment threshold for the citizenship programme."}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-widest text-ink-40">
                      Reference
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
                    Read the full buying process
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
                    Location
                  </h2>
                  <p className="mt-4 max-w-prose text-sm leading-relaxed text-ink-70">
                    {mapPoint.approximate
                      ? `This pin shows the centre of ${villa.location.area}, not the property itself — we hold an approximate location for this listing. Exact addresses are shared with viewers.`
                      : "This pin shows the property's recorded position. Exact addresses are shared with viewers."}
                  </p>
                  <div className="mt-8 aspect-[16/10] overflow-hidden border border-line bg-shell-deep">
                    <iframe
                      title={
                        mapPoint.approximate
                          ? `Map showing the ${villa.location.area} area of Fethiye`
                          : `Map showing the location of ${villa.title} in ${villa.location.area}, Fethiye`
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
                  More from the portfolio
                </h2>
                <Link
                  href="/properties"
                  className="group inline-flex shrink-0 items-center gap-2 text-sm text-sea-deep underline-offset-4 hover:underline"
                >
                  View all properties
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </Reveal>

              {/*
                `li` ve `Reveal` üzerindeki `flex`: kartın `h-full`u YÜZDE
                bir yüksekliktir ve ancak ataları belirli bir yükseklik
                verirse çalışır. Araya yüksekliği `auto` olan bir sarmalayıcı
                (burada `Reveal`) girdiği anda zincir kopuyor ve kartlar
                kendi içerik yüksekliklerinde kalıyordu — satırdaki fiyat ve
                "View" düğmeleri farklı hizalarda bitiyordu. Aynı zincir
                components/featured-properties.tsx içinde de kuruluyor.
              */}
              <ul className="mt-12 grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {otherVillas.map((item, index) => (
                  <li key={item.id} className="flex">
                    <Reveal className="flex w-full" delay={index * 0.08} y={24}>
                      <PropertyCard villa={toPropertyCardData(item)} />
                    </Reveal>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}
      </main>

      <MobileEnquiryBar villa={enquiryVilla} />
    </>
  );
}
