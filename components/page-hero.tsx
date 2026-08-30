import Image from "next/image";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { cn } from "@/lib/cn";
import type { StockImage } from "@/lib/imagery";
import type { Crumb } from "@/lib/seo";

/**
 * İç sayfaların ortak başlık bloğu. Tek bir yerde durması, sayfalar arasında
 * dikey ritmin (üst boşluk, H1 ölçeği, lede genişliği) birebir aynı kalmasını
 * garanti eder — lüks bir markada tutarsız tipografi, ucuz görünmenin en hızlı yoludur.
 *
 * `image` verildiğinde blok tam genişlikte bir manzara bandına dönüşür:
 * fotoğraf arkada, üstünde ince bir perde, metin ortada. Dokuz iç sayfanın
 * tamamı bu bileşeni kullandığı için görselleri tek dosyadan eklemek mümkün
 * oldu — dokuz sayfayı tek tek dolaşmak yerine.
 *
 * Eski yerleşim başlığı sola, lede'yi sağa atan 12 sütunluk bir ızgaraydı;
 * göz iki ayrı sütun arasında dolaşıyordu. Şimdi tek eksen: eyebrow, H1 ve
 * lede aynı merkezde hizalı.
 *
 * `eyebrow` küçük etiket, `title` sayfadaki TEK <h1>, `lede` ise özet paragraf.
 */
export function PageHero({
  eyebrow,
  title,
  lede,
  crumbs,
  image,
  children,
}: {
  /** Üst etiket. Başlık zaten sayfanın adıysa VERİLMEZ — bkz. aşağıdaki not. */
  eyebrow?: string;
  title: string;
  lede?: string;
  crumbs: Crumb[];
  /** Arka plan manzarası. Verilmezse blok açık zeminde sade kalır. */
  image?: StockImage;
  /** Butonlar, rozetler veya istatistikler — başlığın altına eklenir. */
  children?: React.ReactNode;
}) {
  const hasImage = Boolean(image);

  return (
    <section
      className={cn(
        "relative isolate overflow-hidden border-b border-line",
        hasImage ? "bg-sea-deep text-shell" : "veil-tint",
      )}
    >
      {image ? (
        <>
          <Image
            src={image.src}
            alt={image.alt}
            fill
            /* Next 16'da `priority` kullanımdan kaldırıldı; `preload`
               aynı işi yapıyor (bkz. node_modules/next/dist/docs →
               image.md, "priority"). */
            preload
            quality={85}
            sizes="100vw"
            className="-z-10 object-cover"
          />
          {/*
            İnce perde: fotoğraf görünür kalsın ama ortalanmış beyaz metin
            AA eşiğini geçsin. Ana sayfa hero'suyla aynı oran kullanılıyor,
            böylece iki blok aynı aileye ait duruyor.
          */}
          <span
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-sea-deep/55"
          />
        </>
      ) : null}

      {/*
        DİKEY DENGE — içerik azaldıkça yükseklik kaybolmasın diye.

        Önceden bandın yüksekliğini İÇERİK belirliyordu: eyebrow + h1 +
        lede + istatistik ızgarası birlikte ~430px veriyordu. Rehber
        banner'ları sadeleşip geriye yalnızca breadcrumb + başlık kalınca
        aynı kabuk ~200px'lik ince bir şeride çöküyordu — "sade" değil,
        "eksik" görünen bir şerit.

        `min-h-*` görselli varyanta bir taban veriyor; `flex-col` + başlık
        bloğundaki `my-auto` ise onu breadcrumb ile alt boşluk arasında
        GERÇEKTEN ortalıyor. Sabit bir `mt-*` ile ortalanmış GİBİ yapmak,
        başlık uzayıp iki satıra çıktığında (ör. "Страхование
        недвижимости") merkezi kaydırırdı.

        Görselsiz varyantta (hukuki sayfalar) taban yükseklik yok: orada
        banner zaten sade bir başlık bloğu, uzatmanın anlamı olmaz.
      */}
      <div
        className={cn(
          "container-page flex flex-col pb-14 pt-10 sm:pb-20 sm:pt-12",
          hasImage && "min-h-[22rem] sm:min-h-[26rem] lg:min-h-[30rem]",
        )}
      >
        <Breadcrumbs crumbs={crumbs} tone={hasImage ? "dark" : "light"} />

        <div className="mx-auto my-auto max-w-3xl pt-10 text-center sm:pt-14">
          {/*
            EYEBROW OPSİYONEL.

            Görevi, betimleyici bir başlığın üstüne kategori bilgisi
            koymaktı ("The buying process" → "Buying a property in Fethiye,
            one stage at a time"). Rehber sayfalarında başlık artık
            doğrudan SAYFANIN ADI; eyebrow orada aynı kelimeleri ikinci kez
            söylerdi ("THE BUYING PROCESS" üstünde "BUYING PROCESS").
            Tekrarı basmak, sadeleştirmenin tam tersi.
          */}
          {eyebrow ? (
            <p
              className={cn(
                "eyebrow flex items-center justify-center gap-4",
                hasImage ? "text-gold" : "text-sea",
              )}
            >
              <span aria-hidden="true" className="block h-px w-8 bg-gold" />
              {eyebrow}
              <span aria-hidden="true" className="block h-px w-8 bg-gold" />
            </p>
          ) : null}

          <h1
            className={cn(
              /* Büyük harfli serif pozitif aralık ister — bkz. globals.css. */
              "text-[1.6rem] uppercase leading-[1.12] tracking-[0.02em] sm:text-4xl lg:text-5xl",
              /* Üstünde eyebrow yoksa kendi üst boşluğuna ihtiyacı yok. */
              eyebrow && "mt-6",
              hasImage ? "text-shell" : "text-sea-deep",
            )}
          >
            {title}
          </h1>

          {lede ? (
            <p
              className={cn(
                "mx-auto mt-6 max-w-2xl text-base leading-relaxed sm:text-lg",
                hasImage ? "text-shell/90" : "text-ink-70",
              )}
            >
              {lede}
            </p>
          ) : null}

          {/*
            Başlık ile içerik arasındaki boşluk lede'nin varlığına bağlı.
            Lede varken aradaki nefes zaten paragrafın kendisiydi; o
            kalkınca aynı `mt-6` başlığı düğmelere yapıştırıyordu.
          */}
          {children ? (
            <div
              className={cn(
                "flex flex-wrap items-center justify-center gap-4",
                lede ? "mt-6 sm:mt-10" : "mt-8 sm:mt-12",
              )}
            >
              {children}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
