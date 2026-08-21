import Image from "next/image";
import { cn } from "@/lib/cn";
import { imagery } from "@/lib/imagery";

/**
 * SAYFA SONU CTA YÜZEYİ — arka planın TEK KAYNAĞI.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * NEDEN VAR: bu blok dokuz sayfada tekrar ediyordu ve her biri kendi
 * arka planını taşıyordu. Zamanla üç ayrı sürüme ayrıldı:
 *
 *   · ana sayfa + ilanlar → görsel + degrade tül (ama degrade değerleri
 *     bile birbirinden farklıydı: /90 /55 ve /92 /60)
 *   · alım, sigorta, Türkiye → düz `bg-sea-deep`
 *   · hakkımızda, vatandaşlık, satış, görme turu → düz `bg-sea`
 *
 * Aynı bileşenin dört sayfada koyu lacivert, dört sayfada camgöbeği
 * görünmesi bir tasarım kararı değildi; kopyala-yapıştırın zamanla
 * ayrışmasıydı. Arka plan artık burada, tek yerde.
 *
 * BİLEŞEN YALNIZCA YÜZEYİ SAHİPLENİR — içeriği değil. Dokuz sayfanın
 * CTA içeriği gerçekten farklı (kimi tek sütun ortalı, kimi 12 sütunluk
 * ızgara, kimi iki düğme kimi üç). Onları tek bir prop şemasına
 * sıkıştırmak, kazanılan tutarlılıktan fazlasını esneklikten götürürdü.
 * Bu yüzden düzen `className` ile dışarıdan geliyor, zemin içeriden.
 * ─────────────────────────────────────────────────────────────────────────
 */
export function CtaSurface({
  className,
  children,
}: {
  /** Düzen sınıfları — ızgara, hizalama, sütun sayısı. Zemin DEĞİL. */
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        /*
          `isolate`: içerideki `-z-10` katmanlar bu kutunun yığma bağlamında
          kalır, yoksa sayfanın altındaki başka öğelerin arkasına düşerler.
        */
        "relative isolate overflow-hidden bg-sea-deep px-8 py-10 text-shell sm:px-14 sm:py-16 lg:px-20 lg:py-24",
        className,
      )}
    >
      {/* Dekoratif: `alt=""` bilinçli — görsel bilgi taşımıyor. */}
      <Image
        src={imagery.homeCta.src}
        alt=""
        fill
        sizes="(min-width: 1280px) 78rem, 100vw"
        className="-z-10 object-cover"
      />
      {/*
        Soldan sağa açılan tül. Metin solda oturduğu için opaklık solda
        yüksek (okunurluk), sağda düşük (fotoğraf görünsün). Ana sayfadaki
        değerler referans alındı.
      */}
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-sea-deep via-sea-deep/90 to-sea-deep/55"
      />
      {children}
    </div>
  );
}
