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
  eyebrow: string;
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
            priority
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

      <div className="container-page pb-14 pt-10 sm:pb-20 sm:pt-12">
        <Breadcrumbs crumbs={crumbs} tone={hasImage ? "dark" : "light"} />

        <div className="mx-auto mt-10 max-w-3xl text-center sm:mt-14">
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

          <h1
            className={cn(
              /* Büyük harfli serif pozitif aralık ister — bkz. globals.css. */
              "mt-6 text-[1.6rem] uppercase leading-[1.12] tracking-[0.02em] sm:text-4xl lg:text-5xl",
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

          {children ? (
            <div className="mt-6 sm:mt-10 flex flex-wrap items-center justify-center gap-4">
              {children}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
