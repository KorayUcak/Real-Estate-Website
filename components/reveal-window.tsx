import Image from "next/image";
import { cn } from "@/lib/cn";
import type { StockImage } from "@/lib/imagery";

/**
 * "Pencere" bandı — sabit manzaranın göründüğü aralık.
 *
 * Etki şu: bandın içindeki görsel EKRANA sabitlenmiştir, banda değil.
 * Kullanıcı kaydırdıkça üstteki ve alttaki opak bölümler bu bandın
 * üzerinden geçer; manzara yerinde durduğu için bir pencereden bakıyormuş
 * hissi doğar.
 *
 * NEDEN `background-attachment: fixed` DEĞİL:
 * iOS Safari bu değeri pratikte desteklemiyor — arka planı `scroll` gibi
 * çizer ve kaydırmada tırmalanma yaratır. Mobil öncelikli bir sitede efekt
 * telefonların yarısında bozuksa efekt yok demektir.
 *
 * Bunun yerine: bant `clip-path: inset(0)` taşır. Spesifikasyona göre
 * `clip-path` uygulanan bir eleman, içindeki `position: fixed`
 * torunları için KAPSAYAN BLOK olur. Yani görsel viewport boyutunda
 * sabit durur ama bandın dışına taşmaz — `bg-fixed` ile aynı görsel
 * sonuç, her tarayıcıda çalışan mekanizmayla.
 *
 * Performans: tek bir `next/image`, filtre yok, kaydırma dinleyicisi yok.
 * Boyama işini derleyici katmanı yapar, ana iş parçacığı boş kalır.
 */
export function RevealWindow({
  image,
  height = "md",
  children,
  className,
}: {
  image: StockImage;
  /** Bandın yüksekliği. Telefonda daima daha kısa. */
  height?: "sm" | "md" | "lg";
  /** Ortalanmış üst metin — verilmezse bant tamamen görselden ibaret olur. */
  children?: React.ReactNode;
  className?: string;
}) {
  const heights = {
    sm: "h-[38svh] min-h-[15rem] sm:h-[42svh]",
    md: "h-[52svh] min-h-[19rem] sm:h-[58svh]",
    lg: "h-[70svh] min-h-[24rem] sm:h-[76svh]",
  } as const;

  return (
    <section
      aria-hidden={children ? undefined : "true"}
      className={cn(
        "reveal-window relative isolate flex items-center justify-center overflow-hidden",
        heights[height],
        className,
      )}
    >
      {/* Ekrana sabit katman — bandın clip-path'i tarafından kırpılır. */}
      <div className="fixed inset-0 -z-10">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="100vw"
          quality={85}
          /*
            Hero ile aynı gerekçe: 2070px'lik uzak bir stok görselin sunucu
            tarafında yeniden kodlanması zaman aşımına düşüyordu. Gerçek
            görseller /public altına taşındığında kaldırılmalı.
          */
          unoptimized
          className="object-cover"
        />
        {/*
          KOYU TÜL — önceki sürümde bilinçli olarak YOKTU.

          O karar, bandın üstünden geçen tek şeyin kendi zeminini taşıyan
          cam panel olduğu varsayımına dayanıyordu. Yeni arka plan görseli
          çok daha açık ve kontrastı yüksek (parlak beyaz iç mekân); cam
          panelin kenarı fotoğrafın açık bölgelerinde eriyip kayboluyor,
          bandın üstünden kayan açık renkli bölümlerle de arasındaki sınır
          belirsizleşiyor.

          İki katman: sabit bir taban karartma + alta doğru koyulaşan bir
          degrade. Degrade, bandın alt kenarını takip eden bölümlere
          yumuşak bir geçiş bırakıyor; tek düz katman burada "gri cam"
          etkisi veriyordu.
        */}
        <span aria-hidden="true" className="absolute inset-0 bg-ink/30" />
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-ink/10 via-transparent to-ink/35"
        />
      </div>

      {children ? (
        <div className="container-page relative flex justify-center">
          {children}
        </div>
      ) : null}
    </section>
  );
}
