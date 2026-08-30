"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { PropertyCard } from "@/components/property-card";
import { cn } from "@/lib/cn";
import type { PropertyCardData } from "@/lib/property-card-data";
import { useT } from "@/components/translation";
import { SLIDE_CLASS, TRACK_CLASS } from "@/lib/carousel-classes";
import { useScrollCarousel } from "@/lib/use-scroll-carousel";

/**
 * Ana sayfa vitrininin yatay karuseli.
 *
 * NEDEN AYRI DOSYA: veri okuma (`getFeaturedVillas`) sunucuda kalsın diye.
 * `featured-properties.tsx` sunucu bileşeni olmayı sürdürüyor ve istemciye
 * yalnızca bu ince sarmalayıcı iniyor — ilan verisi zaten HTML'e basılmış
 * hâlde geliyor, JavaScript sadece okları bağlıyor.
 *
 * ⚠️ EMBLA KALDIRILDI, YERLEŞİK KAYDIRMA GELDİ. Gerekçe ve ölçüt
 * `lib/use-scroll-carousel.ts` başında; kısaca: embla parmağı bıraktıktan
 * sonra kendi sürtünme eğrisini çalıştırıyordu ve ilan sayfasındaki
 * şeritle yan yana konduğunda belirgin biçimde ağır hissettiriyordu.
 * Artık iki karusel de aynı motoru kullanıyor.
 *
 * GÖRÜNÜM BAŞINA KART: 1 (mobil) / 2 (tablet) / 3 (masaüstü). Değer
 * slaytın genişliğinde duruyor, bir JavaScript seçeneğinde değil —
 * kırılma noktası yönetimi tamamen CSS'e ait.
 */
export function FeaturedCarousel({ cards }: { cards: PropertyCardData[] }) {
  const { t } = useT();
  const { ref, canPrev, canNext, onScroll, step } =
    useScrollCarousel<HTMLUListElement>();

  return (
    <div
      className="relative"
      role="group"
      aria-roledescription="carousel"
      aria-label={t("home.featuredHeading")}
    >
      {/*
        BOŞLUK ARTIK `gap`, negatif kenar boşluğu DEĞİL.

        Embla döneminde boşluk `-ml-5` (kapsayıcı) + `pl-5` (slayt) ile
        kuruluyordu, çünkü embla slayt kutularını ölçüyor ve kenar boşluğu
        ölçümü bozuyordu. Yerleşik kaydırmada böyle bir kısıt yok; düz
        `gap` hem daha okunur hem de `snap-start`ın kartın GÖRSEL kenarına
        oturmasını sağlıyor. Eski kurulumda yapışma noktası slaytın dolgu
        kenarındaydı ve kart 20px sağa kaymış duruyordu — şikâyet edilen
        "tam oturmama" hissinin kaynağı buydu.

        `lg:w-[calc(33.333%-1rem)]`: üç kart + iki `gap-6` (2×24px) toplamı
        tam %100 ediyor, yani masaüstünde üç kart şeridi eksiksiz dolduruyor.
      */}
      <ul
        ref={ref}
        onScroll={onScroll}
        className={cn(TRACK_CLASS, "gap-5 sm:gap-6")}
      >
        {cards.map((card, index) => (
          <li
            key={card.id}
            /*
              `min-w-0` şart: flex öğesinin varsayılan `min-width:auto`
              değeri, içerideki uzun başlığın slaytı bastığı genişliği
              taban kabul eder ve 1-kart görünümü bozulur.

              GÖRÜNÜM BAŞINA KART — ve mobildeki "kırpma" payı. Mobil %86,
              tam %100 değil: küçük ekranda oklar kenarda gösterilmiyor ve
              tam genişlikte bir kart, arkasında altı ilan daha olduğuna
              dair hiçbir iz bırakmıyor. Sonraki kartın görünen şeridi,
              bir kontrol eklemeden "devamı var" diyen en sessiz işaret.
            */
            className={cn(
              SLIDE_CLASS,
              "min-w-0 w-[calc(100vw-5rem)] sm:w-[52%] lg:w-[calc(33.333%-1rem)]",
            )}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${cards.length}`}
          >
            <PropertyCard villa={card} priority={index === 0} />
          </li>
        ))}
      </ul>

      {/*
        OKLAR — yalnızca `lg` ve üstünde.

        Bu bir üşengeçlik değil, çakışma kaçınması: KARTIN KENDİSİNDE de
        fotoğraf galerisi okları var ve onlar görselin `left-0`/`right-0`
        noktasında, dokunmatik cihazlarda KALICI olarak duruyor. Karusel
        okları da kenara konsaydı iki ok üst üste binerdi ve kullanıcı
        hangisinin fotoğrafı, hangisinin ilanı değiştirdiğini bilemezdi.

        `lg`de container'ın yan boşluğu 3rem; ok şeridin 1.5rem dışına
        çıkınca kartlara hiç değmiyor. Daha dar ekranlarda o boşluk yok,
        bu yüzden işaret görevini slayt kırpması üstleniyor.

        Uçlarda `disabled`: gri değil, sönük ve tıklanamaz. Ekran okuyucu
        da `disabled` sayesinde "buraya kadar" bilgisini alıyor.
      */}
      {/*
        MOBİL / TABLET GEZİNME — şeridin ALTINDA, ortalanmış.

        Yandaki `Arrow`lar `lg` altında gizli ve öyle kalmalı: dar ekranda
        container'ın yan boşluğu yok, ok kartların üstüne binerdi. Ama tek
        gezinme yolunun kaydırma olması yeterli değil — dokunmatik olmayan
        girdiler ve şeridin kaydırılabilir olduğunu fark etmeyen kullanıcı
        için görünür bir kontrol gerekiyor.

        Şeridin altına alınca ikisi de çözülüyor: kartlara değmiyor,
        açıkça görünüyor. Uçlarda `disabled` — sönük ve tıklanamaz, ekran
        okuyucu da "buraya kadar" bilgisini alıyor.
      */}
      <div className="mt-6 flex items-center justify-center gap-3 lg:hidden">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={!canPrev}
          aria-label={t("properties.previousProperties")}
          className="inline-flex size-11 items-center justify-center rounded-sm border border-line bg-white text-sea-deep transition-colors hover:border-sea-deep hover:bg-sea-deep hover:text-shell disabled:pointer-events-none disabled:opacity-35"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          disabled={!canNext}
          aria-label={t("properties.nextProperties")}
          className="inline-flex size-11 items-center justify-center rounded-sm border border-line bg-white text-sea-deep transition-colors hover:border-sea-deep hover:bg-sea-deep hover:text-shell disabled:pointer-events-none disabled:opacity-35"
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
      </div>

      <Arrow
        side="left"
        label={t("properties.previousProperties")}
        disabled={!canPrev}
        onClick={() => step(-1)}
      />
      <Arrow
        side="right"
        label={t("properties.nextProperties")}
        disabled={!canNext}
        onClick={() => step(1)}
      />
    </div>
  );
}

function Arrow({
  side,
  label,
  disabled,
  onClick,
}: {
  side: "left" | "right";
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 items-center justify-center",
        "rounded-sm border border-line bg-white text-sea-deep shadow-soft transition-all duration-300",
        "hover:border-sea-deep hover:bg-sea-deep hover:text-shell",
        "disabled:pointer-events-none disabled:opacity-0",
        "lg:inline-flex",
        side === "left" ? "-left-6" : "-right-6",
      )}
    >
      <Icon className="size-5" aria-hidden="true" />
    </button>
  );
}
