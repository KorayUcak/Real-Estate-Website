import type { Metadata } from "next";
import { LocaleLink as Link } from "@/components/locale-link";
import { ArrowRight, Quote, Star } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { breadcrumbSchema } from "@/lib/schema";
import { currentLanguage, currentLocale } from "@/lib/current-locale";
import { getT } from "@/lib/i18n/server";
import { LANGUAGE_META } from "@/lib/locale";
import { getReviews } from "@/lib/reviews";
import { HOME_CRUMB, pageMetadata, type Crumb } from "@/lib/seo";

/**
 * ⚠️ ROTA `(site)` GRUBUNUN İÇİNDE, `app/[lang]/happy-customers` DEĞİL.
 *
 * Brief ikincisini yazıyordu ama parantezli grup URL'e girmiyor: her iki
 * yolda da adres `/[lang]/happy-customers`. Fark KABUKTA. Başlık, footer,
 * dil/para birimi bağlamı, rıza katmanı ve arka plan silueti
 * `(site)/layout.tsx` içinde; grubun dışına konsaydı sayfa bunların
 * hiçbirini almaz, gezinmesiz ve footersız çıplak bir belge olurdu.
 */
const PATH = "/happy-customers";
const CRUMBS: Crumb[] = [HOME_CRUMB, { name: "Happy Customers", path: PATH }];

export async function generateMetadata(): Promise<Metadata> {
  const locale = await currentLocale();
  const t = await getT();

  return pageMetadata({
    title: t("happyCustomers.metaTitle"),
    description: t("happyCustomers.metaDescription"),
    path: PATH,
    locale,
    keywords: [
      "Coast 2 Coast Properties Turkey reviews",
      "Fethiye estate agent reviews",
      "buying property in Turkey testimonials",
      "English speaking estate agent Fethiye reviews",
    ],
  });
}

/**
 * BEŞ YILDIZ — tek bir grafik, beş ikon değil (erişilebilirlik açısından).
 *
 * İkonlar `aria-hidden`; puanı ekran okuyucuya taşıyan şey sarmalayıcının
 * `aria-label`ı. Beş ayrı ikon tek tek okunsaydı kullanıcı "yıldız yıldız
 * yıldız yıldız yıldız" duyardı — bilgi değil gürültü.
 *
 * `fill-gold text-gold`: lucide ikonları varsayılan olarak yalnızca kontur
 * çiziyor. Dolgusuz bir yıldız "boş yıldız" demektir, yani tam tersi bir
 * puan gösterirdi.
 */
function Stars({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1" role="img" aria-label={label}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          aria-hidden="true"
          className="size-4 fill-gold text-gold"
        />
      ))}
    </div>
  );
}

export default async function HappyCustomersPage() {
  const t = await getT();
  const language = await currentLanguage();
  const reviews = getReviews();

  /**
   * Tarih biçimi AKTİF DİLDEN. "18 July 2026" / "18 Temmuz 2026" /
   * "18 июля 2026 г." — `Intl` her dilin kendi sırasını ve ay adını
   * biliyor. Elle bir şablon yazmak (`${gün} ${ay} ${yıl}`) üç dilde
   * üç ayrı yanlış üretirdi.
   */
  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(LANGUAGE_META[language].tag, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(iso));

  const ratingLabel = t("happyCustomers.ratingLabel");

  return (
    <>
      {/*
        ⚠️ `Review` / `AggregateRating` ŞEMASI BİLİNÇLİ OLARAK YOK.

        Google'ın zengin sonuç kuralları, bir işletmenin KENDİ sitesinde
        kendi hakkındaki değerlendirmeleri işaretlemesini açıkça yasaklıyor
        ("self-serving reviews"): yapılandırılmış veri yok sayılıyor ve
        tekrarında elle işlem riski doğuyor. Yıldızlar sayfada görünüyor,
        arama sonucunda görünmeyecek — doğru olan da bu.

        Breadcrumb şeması kalıyor: o sayfanın hiyerarşisini bildiriyor,
        kendi kendine puan vermiyor.
      */}
      <JsonLd schema={[breadcrumbSchema(CRUMBS)]} />

      <main id="main">
        {/*
          GÖRSELSİZ HERO — ve bu bir eksiklik değil.

          `PageHero` görsel verilmediğinde `veil-tint` zeminde sade bir
          bant basıyor. Buraya stok bir "mutlu çift" fotoğrafı koymak,
          altında gerçek insanların gerçek cümleleri duran bir sayfada tam
          da güveni zedeleyen şey olurdu: ziyaretçi stok görseli tanır.
          Sayfanın kanıtı fotoğraf değil, metin.
        */}
        <PageHero
          eyebrow={t("happyCustomers.eyebrow")}
          title={t("happyCustomers.heroTitle")}
          lede={t("happyCustomers.heroLede")}
          crumbs={CRUMBS}
        >
          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5">
            <Stars label={ratingLabel} />
            <p className="text-sm text-ink-70">{t("happyCustomers.sourceNote")}</p>
          </div>
        </PageHero>

        <section aria-labelledby="reviews-heading" className="bg-shell py-section">
          <div className="container-page">
            <h2 id="reviews-heading" className="sr-only">
              {t("happyCustomers.metaTitle")}
            </h2>

            {/*
              MASONRY — `columns-*`, `grid` DEĞİL.

              Yorumlar farklı uzunlukta: kısa bir "harikalar" ile dört
              cümlelik bir anlatı aynı ızgarada yan yana durunca, eşit
              yükseklikli hücreler kısa kartın altında büyük bir boşluk
              bırakıyor. Çok sütunlu düzen kartları dikeyde sıkıştırıyor ve
              editoryal bir dergi sayfası hissi veriyor.

              ⚠️ `break-inside-avoid` ŞART: onsuz tarayıcı bir kartı sütunun
              sonunda İKİYE BÖLÜP devamını sonraki sütuna taşıyor — yorumun
              yarısı bir sütunda, imzası diğerinde kalıyordu.

              ⚠️ OKUMA SIRASI SÜTUN SÜTUN: `columns` içerik akışını önce
              aşağı, sonra sağa diziyor. Sıralı bir listede (adımlar,
              süreç) bu yanlış olurdu; birbirinden bağımsız yorumlarda
              okuyucunun izlediği bir sıra zaten yok.

              `mb-6` + `w-full`: `columns` boşluğu yalnızca SÜTUNLAR arasına
              koyuyor (`gap-6`), kartlar arasına değil — dikey aralık
              kartın kendi alt boşluğundan geliyor.
            */}
            <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
              {reviews.map((review, index) => (
                <Reveal
                  key={review.id}
                  className="mb-6 block w-full break-inside-avoid"
                  delay={index * 0.06}
                  y={20}
                >
                  <figure className="flex h-full flex-col border border-line bg-white p-7 sm:p-8">
                    <Quote
                      aria-hidden="true"
                      className="size-7 shrink-0 text-gold/40"
                    />

                    <blockquote className="mt-5 text-[0.9375rem] leading-relaxed text-ink-70">
                      {review.text}
                    </blockquote>

                    {/*
                      İMZA BLOĞU: ince bir çizgiyle metinden ayrılıyor.
                      `mt-auto` — kart bir sütunda komşusundan uzun
                      olduğunda bile imza en altta kalıyor.
                    */}
                    <figcaption className="mt-7 border-t border-line pt-5">
                      <Stars label={ratingLabel} />
                      <p className="mt-4 font-display text-base text-sea-deep">
                        {review.authorName}
                      </p>
                      {/*
                        `<time>` + `dateTime`: ekranda okunabilir tarih,
                        makinede ISO. İkisi ayrı olmasaydı ya kullanıcı
                        "2026-07-18" okurdu ya da tarayıcı biçimlenmiş
                        metni ayrıştırmak zorunda kalırdı.
                      */}
                      <time
                        dateTime={review.date}
                        className="mt-1 block text-xs text-ink-40"
                      >
                        {formatDate(review.date)}
                      </time>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------- CTA */}
        <section
          aria-labelledby="reviews-cta-heading"
          className="border-t border-line bg-shell-deep py-section"
        >
          <div className="container-page">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2
                id="reviews-cta-heading"
                className="font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                {t("happyCustomers.ctaHeading")}
              </h2>
              <p className="mt-6 leading-relaxed text-ink-70">
                {t("happyCustomers.ctaBody")}
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/contact" className="btn btn-solid">
                  {t("happyCustomers.ctaPrimary")}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link href="/properties" className="btn btn-light">
                  {t("happyCustomers.ctaSecondary")}
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
    </>
  );
}
