"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PropertyCard } from "@/components/property-card";
import { cn } from "@/lib/cn";
import type { PropertyCardData } from "@/lib/property-card-data";

/**
 * Ana sayfa vitrininin yatay karuseli.
 *
 * NEDEN AYRI DOSYA: veri okuma (`getFeaturedVillas`) sunucuda kalsın diye.
 * `featured-properties.tsx` sunucu bileşeni olmayı sürdürüyor ve istemciye
 * yalnızca bu ince sarmalayıcı iniyor — ilan verisi zaten HTML'e basılmış
 * hâlde geliyor, JavaScript sadece sürükleme ve okları bağlıyor.
 *
 * GÖRÜNÜM BAŞINA KART: 1 (mobil) / 2 (tablet) / 3 (masaüstü). Değer
 * slaytın `flex-basis`inde duruyor, embla'nın bir seçeneğinde değil —
 * embla slayt genişliğini ölçerek çalışır, dolayısıyla kırılma noktası
 * yönetimi tamamen CSS'e ait ve JavaScript yeniden hesap yapmıyor.
 */

/* Slaytlar arası boşluk: kapsayıcıda negatif, slaytta pozitif iç boşluk.
   Kenar boşluğu yerine padding kullanmak embla'nın ölçümünü bozmuyor. */
const GAP = "pl-5 sm:pl-6";
const GAP_OFFSET = "-ml-5 sm:-ml-6";

export function FeaturedCarousel({ cards }: { cards: PropertyCardData[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    /*
      `loop: false` — bilinçli. Sonsuz döngü, vitrinin kaç ilandan oluştuğu
      duygusunu siliyor ve okların "sonuna geldiniz" bilgisini vermesini
      imkânsız kılıyor. Uçlarda sönen oklar, kullanıcıya listenin sınırlı
      ve seçilmiş olduğunu söyler — butik bir portföyde istenen şey bu.
    */
    loop: false,
    duration: 32,
    /* Dikey kaydırma sırasındaki birkaç piksellik sapma karuseli açmasın. */
    dragThreshold: 16,
  });

  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    /*
      `reInit` de dinleniyor: kırılma noktası değiştiğinde görünüm başına
      kart sayısı değişiyor, dolayısıyla "daha var mı" cevabı da değişiyor.
      Yalnızca "select" dinlenseydi tablete döndürülen bir telefonda oklar
      yanlış durumda kalırdı.
    */
    emblaApi.on("select", onSelect).on("reInit", onSelect);

    /*
      İLK DURUM neden doğrudan `onSelect()` ile alınmıyor: embla "init"
      olayını kendi kurulumunda, yani bu efekt çalışmadan ÖNCE yayıyor —
      dolayısıyla sonradan abone olmak o olayı kaçırır ve ilk render'da
      oklar yanlış durumda kalır. Efekt gövdesinde setState çağırmak ise
      fazladan bir senkron render turu doğuruyor (react-hooks kuralı da
      tam bunu yakalıyor). Bir sonraki boyama karesine ertelemek ikisini
      birden çözüyor: olay kaçırılmıyor, ekstra tur da açılmıyor.
    */
    const frame = requestAnimationFrame(onSelect);

    return () => {
      cancelAnimationFrame(frame);
      emblaApi.off("select", onSelect).off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div
      className="relative"
      role="group"
      aria-roledescription="carousel"
      aria-label="Featured properties"
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <ul className={cn("flex touch-pan-y items-stretch", GAP_OFFSET)}>
          {cards.map((card, index) => (
            <li
              key={card.id}
              /*
                `min-w-0` şart: flex öğesinin varsayılan `min-width:auto`
                değeri, içerideki uzun başlığın slaytı bastığı genişliği
                taban kabul eder ve 1-kart görünümü bozulur.
              */
              /*
                GÖRÜNÜM BAŞINA KART — ve mobildeki "kırpma" payı.

                Mobil %86, tam %100 değil. Sebep: küçük ekranda oklar
                gösterilmiyor (aşağıdaki nota bakın) ve tam genişlikte bir
                kart, arkasında altı ilan daha olduğuna dair HİÇBİR iz
                bırakmıyor — kullanıcı kaydırmayı denemiyor bile. Sonraki
                kartın görünen şeridi, bir kontrol eklemeden "devamı var"
                diyen en sessiz işaret.

                sm %52 → iki kart + ince bir şerit. lg %33.333 → tam üç kart;
                orada işaret görevini oklar üstleniyor.
              */
              className={cn(
                "flex min-w-0 flex-[0_0_86%] sm:flex-[0_0_52%] lg:flex-[0_0_33.333%]",
                GAP,
              )}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${cards.length}`}
            >
              <PropertyCard villa={card} priority={index === 0} />
            </li>
          ))}
        </ul>
      </div>

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
      <Arrow
        side="left"
        label="Previous properties"
        disabled={!canPrev}
        onClick={() => emblaApi?.scrollPrev()}
      />
      <Arrow
        side="right"
        label="Next properties"
        disabled={!canNext}
        onClick={() => emblaApi?.scrollNext()}
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
