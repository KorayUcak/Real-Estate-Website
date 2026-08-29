"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useT } from "@/components/translation";

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
  const ref = useRef<HTMLUListElement>(null);

  /*
    İKİSİ DE `false` BAŞLIYOR ve düğme sırası ancak kaydırılabilirlik
    ölçüldükten sonra basılıyor (aşağıdaki `scrollable`).

    Sunucuda viewport genişliği bilinmiyor, dolayısıyla şeridin taşıp
    taşmadığı da bilinemez: bölgesinde tek komşusu olan bir ilanda (veride
    Yanıklar böyle) iki ok da ölü doğardı. Ölü kontrol göstermektense
    hidrasyondan sonra göstermek doğru taraf — blok zaten sayfanın en
    altında, katlamanın çok aşağısında.
  */
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    /* 1px tolerans: alt piksel kaydırma konumları uçlarda tam 0 / tam
       `scrollWidth - clientWidth` vermiyor ve ok sonsuza dek etkin kalıyordu. */
    setCanPrev(el.scrollLeft > 1);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    measure();

    /* Kırılma noktası değişince (şerit → ızgara) ölçüm yenilenmeli. */
    const observer = new ResizeObserver(measure);
    if (ref.current) observer.observe(ref.current);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  /**
   * BİR KART KAYDIR — sabit piksel değil, ÖLÇÜLEN adım.
   *
   * Adım, ilk iki öğenin sol kenarları arasındaki fark: kart genişliği +
   * boşluk, ikisini ayrı ayrı bilmeye gerek kalmadan. Sabit bir değer
   * yazılsaydı `w-[86%]` → `sm:w-[52%]` geçişinde yanlış olurdu.
   */
  const step = (direction: 1 | -1) => {
    const el = ref.current;
    if (!el) return;

    const items = el.children;
    const delta =
      items.length > 1
        ? (items[1] as HTMLElement).offsetLeft - (items[0] as HTMLElement).offsetLeft
        : el.clientWidth;

    /* Hareket kısıtlaması: `scrollBy` CSS'teki `scroll-behavior`ı ezer,
       o yüzden tercih burada da ayrıca sorulmak zorunda. */
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    el.scrollBy({ left: direction * delta, behavior: reduced ? "auto" : "smooth" });
  };

  const scrollable = canPrev || canNext;

  return (
    <div>
      <ul
        ref={ref}
        onScroll={measure}
        /*
          Kart genişlikleri ana sayfayla aynı: %86 mobil, %52 tablet.
          Ondört puanlık artık, SONRAKİ KARTIN KENARINI gösteriyor —
          kaydırılabilirliğin en sessiz işareti.

          `lg:` üçlüsü şeridi ızgaraya çeviriyor: `w-auto` (slayt genişliği
          sıfırlanır), `grid-cols-3`, `overflow-visible`.
        */
        className="no-scrollbar flex snap-x snap-mandatory items-stretch gap-6 overflow-x-auto pb-1 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0"
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
