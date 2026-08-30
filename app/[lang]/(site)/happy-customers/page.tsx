import type { Metadata } from "next";
import { LocaleLink as Link } from "@/components/locale-link";
import { ArrowRight, Quote, Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { Reveal } from "@/components/reveal";
import { breadcrumbSchema } from "@/lib/schema";
import { currentLanguage, currentLocale } from "@/lib/current-locale";
import { getT } from "@/lib/i18n/server";
import { LANGUAGE_META } from "@/lib/locale";
import { getReviews } from "@/lib/reviews";
import { siteConfig } from "@/lib/site";
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
function Stars({ label, size = "size-4" }: { label: string; size?: string }) {
  return (
    <div className="flex items-center gap-1" role="img" aria-label={label}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          aria-hidden="true"
          className={cn(size, "fill-gold text-gold")}
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

  /**
   * ORTALAMA PUAN VERİDEN HESAPLANIYOR, "5.0" diye yazılmıyor.
   *
   * Sabit yazılsaydı, dosyaya dört yıldızlı tek bir yorum eklendiği anda
   * rozet yalan söylemeye başlardı — ve bunu kimse fark etmezdi.
   *
   * Biçimlendirme `Intl`den: ondalık ayırıcı dile göre değişiyor
   * ("5.0" / "5,0"). Elle nokta yazmak Türkçe ve Rusça'da yanlış olurdu.
   */
  const average = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  const score = new Intl.NumberFormat(LANGUAGE_META[language].tag, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(average);

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
          KOMPAKT ÖZET BAŞLIĞI — `PageHero` KALDIRILDI.

          `PageHero` bu sayfada yanlış aracı seçmekti: ortalanmış, cömert
          boşluklu ve TAM GENİŞLİKTE bir bant üretiyor. Görselsiz hâlinde
          ekranın üst üçte biri neredeyse boş kalıyordu ve sayfanın tek
          işi olan yorumlar katlamanın altına düşüyordu. Sosyal kanıt
          sayfasında kaydırma gerektiren bir giriş, kanıtı geciktirmek
          demek.

          ⚠️ `<h1>` KORUNDU. Bant küçüldü ama başlık silinmedi: sayfadaki
          tek h1 buydu ve kaldırmak hem belge yapısını hem de arama
          motorunun sayfanın konusunu okuduğu ana sinyali götürürdü.
          Yalnızca ölçüsü küçüldü (`text-4xl` → `text-3xl`) ve ortadan
          sola alındı.

          ⚠️ BREADCRUMB DA `PageHero`DAN GELİYORDU. Yukarıdaki
          `breadcrumbSchema(CRUMBS)` ekranda karşılığı olan bir iz
          bekliyor; bileşen kalkınca izi elle basmak gerekti.

          MASAÜSTÜNDE İKİ SÜTUN: solda başlık, sağda rozet. Dikey olarak
          dizilselerdi blok yeniden uzardı — yatay boşluk zaten boştu.
          `lg:items-end` ikisini aynı taban çizgisine oturtuyor.
        */}
        <section className="border-b border-line bg-shell">
          <div className="container-page py-7 sm:py-9">
            <Breadcrumbs crumbs={CRUMBS} />

            {/*
              `lg:items-center` — `items-end` DEĞİL.

              Sol sütun artık tek satırlık ince bir yazı, sağdaki rozet ise
              ~150px'lik bir kart. Taban hizası (`items-end`) o tek satırı
              kartın en altına yapıştırıp bloğu dengesiz gösteriyordu;
              ortalama, iki nesnenin optik ağırlığını aynı eksene getiriyor.
            */}
            <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
              {/*
                ⚠️ BU SATIR SAYFANIN <h1>'İ — ve bu bilinçli bir seçim.

                Brief "h1'i ve tanıtım paragrafını kaldır, yerine yalnızca
                'VERIFIED GOOGLE REVIEWS' yazsın" diyor. İstenen METİN
                gitmedi, istenen METİNLER gitti: başlık cümlesi ve lede
                kaldırıldı, geriye tek bir satır kaldı. O satırı düz bir
                `<p>` yapmak sayfayı BAŞLIKSIZ bırakırdı — belge yapısı
                (ekran okuyucu için gezinme) ve arama motorunun sayfanın
                konusunu okuduğu ana sinyal birlikte giderdi.

                Görsel olarak fark yok: `<h1>` varsayılan stillerini
                almıyor, aşağıdaki sınıflar ne diyorsa o. Yani ekranda tam
                da istenen minimal satır duruyor; yalnızca DOM'da bir
                başlık olarak duruyor.

                ⚠️ İNCE KESİT `font-display`DEN GELMEK ZORUNDA.
                `--font-display` Montserrat ve DEĞİŞKEN kesit olarak
                yükleniyor (layout'ta `weight` verilmemiş), yani 100–900
                arası her ağırlık ek indirme olmadan hazır. `.eyebrow`
                yardımcı sınıfı ise `--font-sans` yani Inter kullanıyor ve
                Inter yalnızca 400–700 ile yükleniyor: orada `font-light`
                yazmak 300 değil 400 çizdirir — yani hiçbir şey değişmezdi.

                Harf aralığı mobilde bir kademe dar (`0.2em`): Rusça karşılık
                28 karakter ("ПОДТВЕРЖДЁННЫЕ ОТЗЫВЫ GOOGLE") ve 0.28em ile
                390px'lik ekranda ikinci satıra taşıyordu.
              */}
              <h1 className="font-display text-sm font-light uppercase leading-relaxed tracking-[0.2em] text-sea-deep sm:text-base sm:tracking-[0.28em] lg:text-lg">
                {t("happyCustomers.heading")}
              </h1>

              {/*
                GÜVEN ROZETİ — Google'ın özet kartının sessiz karşılığı.

                Beyaz zemin + ince çerçeve: krem bandın üstünde ayrı bir
                nesne gibi duruyor, kendi başına okunabiliyor.

                `lg:shrink-0` + `lg:w-auto`: dar ekranda blok tam genişlik,
                masaüstünde içeriği kadar. Aksi hâlde esnek satırda başlık
                sütunu rozeti ezip puanı iki satıra kırıyordu.

                Puan `font-display` ve 5xl: sayfada göz ilk buraya düşsün
                diye. Yıldızlar `size-5` — gövde metnindeki `size-4`ten bir
                kademe büyük, çünkü burada bilgi taşıyorlar, süs değiller.
              */}
              <div className="w-full border border-line bg-white p-6 sm:p-7 lg:w-auto lg:shrink-0">
                <p className="text-[11px] uppercase tracking-[0.18em] text-ink-40">
                  {siteConfig.name}
                </p>

                <div className="mt-4 flex items-center gap-4">
                  <span className="font-display text-5xl leading-none text-sea-deep">
                    {score}
                  </span>
                  <Stars label={ratingLabel} size="size-5" />
                </div>

                <p className="mt-4 text-xs text-ink-70">
                  {t("happyCustomers.basedOn")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Üst boşluk kısıldı: okuyucu başlıktan yorumlara doğrudan geçsin. */}
        <section
          aria-labelledby="reviews-heading"
          className="bg-shell pb-section pt-12 sm:pt-16"
        >
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
