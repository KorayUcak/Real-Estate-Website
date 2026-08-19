import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

/**
 * Kaydırma ile beliren blok — tamamen CSS ile.
 *
 * ÖNCEKİ SÜRÜMÜN HATASI: framer-motion `whileInView` kullanıyordu ve
 * sunucudan gelen HTML'de içerik `opacity: 0` olarak işaretleniyordu.
 * Yani bölümler JavaScript yüklenip hidrasyon bitene KADAR görünmüyordu.
 * Hızlı bir masaüstünde fark edilmiyor; yavaş bir telefonda sayfanın
 * yarısı boş açılıyor, sonra birden beliriyor. Emlak sitesinde ilk
 * izlenimin bedeli yüksek.
 *
 * Şimdi: temel durum GÖRÜNÜR. Animasyon `animation-timeline: view()` ile
 * yalnızca destekleyen tarayıcıda ve yalnızca kullanıcı hareket kısıtlaması
 * istemiyorsa devreye girer (bkz. globals.css). Desteklemeyen tarayıcı
 * (bugün Firefox) içeriği statik ve tam görünür gösterir — bozulma yok.
 *
 * Yan kazanç: bu bileşen artık sunucu bileşeni. Sayfaların büyük kısmı
 * için istemciye hiç JavaScript gitmiyor.
 */

/** Diğer istemci bileşenlerinin paylaştığı yumuşama eğrisi. */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  amount,
}: {
  children: React.ReactNode;
  className?: string;
  /**
   * Saniye cinsinden değil, kaydırma mesafesi cinsinden kademelendirme:
   * kardeş bloklara artan `delay` verildiğinde her biri biraz daha geç
   * "açılır". Zaman tabanlı gecikme kaydırmaya bağlı animasyonda anlamsız
   * olurdu, o yüzden değer animasyon aralığına ötelenir.
   */
  delay?: number;
  /** Başlangıç dikey ofseti (px). 0 verilirse yalnızca opaklık değişir. */
  y?: number;
  /** Geriye dönük uyumluluk — CSS yolunda kullanılmıyor. */
  amount?: number;
}) {
  const offset = Math.round(delay * 100);

  const style: CSSProperties = {
    "--reveal-y": `${y}px`,
    ...(offset > 0
      ? { animationRange: `entry ${5 + offset}% cover ${25 + offset}%` }
      : null),
  } as CSSProperties;

  void amount;

  return (
    <div className={cn("reveal", className)} style={style}>
      {children}
    </div>
  );
}
