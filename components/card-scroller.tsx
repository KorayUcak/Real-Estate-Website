"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { useT } from "@/components/translation";
import { TRACK_CLASS } from "@/lib/carousel-classes";
import { useScrollCarousel } from "@/lib/use-scroll-carousel";

/**
 * MOBİL/TABLET YATAY ŞERİT + OK DÜĞMELERİ, `lg`den itibaren IZGARA.
 *
 * İlan sayfasının kuyruğundaki "portföyden daha fazlası" bloğu için.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * NEDEN EMBLA DEĞİL — ana sayfa vitrini (components/featured-carousel.tsx)
 * embla kullanıyor ve düğmeler oradan birebir kopyalandı, ama MOTOR farklı.
 *
 * Sebep masaüstü düzeni: bu bölüm `lg`den itibaren gerçek bir CSS ızgarası
 * (2 satır × 3 sütun). Embla kapsayıcıya `transform: translate3d(...)`
 * yazıyor; `display: grid` ile birlikte o dönüşüm hâlâ uygulanır ve ızgara
 * kayar. Embla'yı `breakpoints` ile `lg`de kapatmak mümkün, ama o zaman da
 * embla'nın boşluk hilesini (`-ml-5` kapsayıcı + `pl-5` slayt) ızgarada tek
 * tek geri almak gerekiyor — iki ayrı boşluk sistemi, tek bir bileşende.
 *
 * Yerel kaydırma + `snap` bu sorunun tamamını atlıyor: `lg:grid` eklendiği
 * anda şerit ızgaraya dönüşüyor, geri alınacak hiçbir satır içi stil yok.
 * Dokunmatik his de kaybolmuyor — `scroll-snap` tarayıcının kendi ivmesini
 * kullanıyor, JavaScript sürükleme dinlemiyor.
 *
 * ⚠️ GÖRÜNÜM AYNI: düğmelerin sınıfları, ölçüsü (`size-11`), `disabled`
 * davranışı ve sözlük anahtarları (`properties.previousProperties` /
 * `nextProperties`) ana sayfadakiyle birebir aynı. Kullanıcı iki bölüm
 * arasında bir fark görmüyor; fark yalnızca altta.
 * ─────────────────────────────────────────────────────────────────────────
 */
export function CardScroller({ children }: { children: React.ReactNode }) {
  const { t } = useT();

  /*
    ⚠️ MANTIK ARTIK PAYLAŞILIYOR. Ölçüm, adım hesabı ve uç algılama
    `lib/use-scroll-carousel.ts`e taşındı; ana sayfa vitrini de aynı
    kancayı kullanıyor. İki bölümün fiziği artık kopyalanmış iki kod
    parçasına değil, tek bir dosyaya bağlı.
  */
  const { ref, canPrev, canNext, scrollable, onScroll, step } =
    useScrollCarousel<HTMLUListElement>();

  return (
    <div>
      <ul
        ref={ref}
        onScroll={onScroll}
        /*
          Kart genişlikleri ana sayfayla aynı: %86 mobil, %52 tablet
          (bkz. ilan sayfasındaki `<li>` sınıfları). `lg:` üçlüsü şeridi
          ızgaraya çeviriyor.
        */
        className={cn(
          TRACK_CLASS,
          "gap-6 pb-1 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0",
        )}
      >
        {children}
      </ul>

      {/*
        DÜĞMELER ŞERİDİN ALTINDA, ORTALANMIŞ — ana sayfadaki `lg:hidden`
        bloğun aynısı. Kartların üstüne binen yan oklar burada yok: bu
        bölümde `lg`de zaten ızgara var, yani kaydırılacak bir şey de yok.
      */}
      {scrollable ? (
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
      ) : null}
    </div>
  );
}
