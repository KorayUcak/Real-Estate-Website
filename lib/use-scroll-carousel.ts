import { useCallback, useEffect, useRef, useState } from "react";

/**
 * ⚠️ SINIF SABİTLERİ BU DOSYADA DEĞİL, `lib/carousel-classes.ts` içinde.
 * Buradan içe aktarılmaları denendi ve derlemeyi kırdı: dosya `useRef`
 * içerdiği için sunucu bileşenleri bu modüle hiç dokunamıyor. Gerekçenin
 * tamamı o dosyanın başında.
 *
 * YATAY ŞERİT MANTIĞI — iki karuselin ORTAK motoru.
 *
 * Kullananlar: `components/featured-carousel.tsx` (ana sayfa vitrini) ve
 * `components/card-scroller.tsx` (ilan sayfası çapraz satışı).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * NEDEN EMBLA DEĞİL, YERLEŞİK KAYDIRMA.
 *
 * Vitrin eskiden embla ile çalışıyordu ve yan yana konduğunda fark
 * hissediliyordu: embla parmağı bıraktıktan sonra kendi sürtünme eğrisini
 * çalıştırıp `duration: 32` boyunca hedefe süzülüyor. Tarayıcının kendi
 * kaydırması ise dokunmatik sürücüden gelen ivmeyi doğrudan kullanıyor —
 * aynı jest, gözle görülür biçimde daha çabuk oturuyor.
 *
 * ⚠️ BU BİR PAKET SİLME TASARRUFU DEĞİL. `embla-carousel-react` bağımlılık
 * olarak KALIYOR: `components/property-card.tsx` her kartın kendi fotoğraf
 * galerisi için embla kullanıyor. Buradaki kazanç bayt değil, HİS — ve
 * ana sayfada bir embla örneğinin daha kurulmaması.
 *
 * ⚠️ TEK MOTOR OLMASI ASIL AMAÇ. İki bölüm iki ayrı kaydırma mantığı
 * kullandığı sürece "biri diğerinden hızlı" şikâyeti kaçınılmazdı; ikisi
 * de bu dosyadan beslendiği için fizikleri artık yapısal olarak aynı.
 * ─────────────────────────────────────────────────────────────────────────
 */
export function useScrollCarousel<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  /*
    İkisi de `false` başlıyor. Sunucuda viewport genişliği bilinmediği için
    şeridin taşıp taşmadığı da bilinemez; çağıran taraf `scrollable`
    değerine bakıp düğmeleri hidrasyondan sonra basıyor. Alternatif —
    düğmeleri her zaman basmak — taşmayan bir şeritte iki ölü kontrol
    bırakırdı.
  */
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    /*
      1px tolerans. Alt piksel kaydırma konumları uçlarda tam 0 ya da tam
      `scrollWidth - clientWidth` vermiyor; toleranssız karşılaştırmada ok
      son kartta bile etkin kalıyor ve basıldığında hiçbir şey olmuyordu.
    */
    setCanPrev(el.scrollLeft > 1);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  /**
   * KAYDIRMA SIRASINDA ÖLÇÜM — KARE BAŞINA EN FAZLA BİR KEZ.
   *
   * ⚠️ ÖNCEKİ HÂL: `onScroll={measure}`. Tarayıcı kaydırma olayını saniyede
   * onlarca kez üretiyor ve her birinde `scrollLeft`, `scrollWidth`,
   * `clientWidth` okunuyordu. Üçü de DÜZEN OKUMASI: tarayıcıyı bekleyen
   * düzeni hesaplamaya zorlayabilen türden erişimler. Değerler çoğu olayda
   * aynı kalıyor (React aynı değerde yeniden render etmiyor), yani iş
   * büyük ölçüde boşa gidiyordu.
   *
   * `requestAnimationFrame` ile ölçüm kare hızına bağlanıyor: art arda
   * gelen yirmi kaydırma olayı tek bir ölçüme düşüyor ve okuma tarayıcının
   * zaten düzen hesapladığı ana denk geliyor.
   *
   * ⚠️ `passive` BURADA KONU DEĞİL. `scroll` olayı iptal edilemez
   * (`preventDefault` etkisiz), dolayısıyla dinleyicinin pasif olup
   * olmaması kaydırmayı bloklamıyor — `passive` yalnızca `wheel` ve
   * `touchstart` gibi İPTAL EDİLEBİLİR olaylarda fark yaratır.
   */
  const frame = useRef<number | null>(null);

  const onScroll = useCallback(() => {
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      measure();
    });
  }, [measure]);

  useEffect(() => {
    measure();

    /*
      `ResizeObserver`: kırılma noktası değiştiğinde (şerit → ızgara, ya da
      kart genişliğinin değişmesi) taşma durumu da değişiyor. `resize`
      olayı tek başına yetmez — kap, viewport değişmeden de yeniden
      boyutlanabiliyor (yazı tipi yüklenmesi, görsel yerleşimi).
    */
    const observer = new ResizeObserver(measure);
    const el = ref.current;
    if (el) observer.observe(el);

    return () => {
      observer.disconnect();
      /* Sökülürken bekleyen kare iptal ediliyor: aksi hâlde geri çağrı
         DOM'dan kalkmış bir elemanı ölçmeye çalışırdı. */
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [measure]);

  /**
   * BİR KART İLERLE — sabit piksel değil, ÖLÇÜLEN adım.
   *
   * Adım, ilk iki çocuğun `offsetLeft` farkı: kart genişliği + boşluk,
   * ikisini ayrı ayrı bilmeye gerek kalmadan. Sabit bir değer yazılsaydı
   * `%86 → %52 → 1/3` kademelerinin her birinde yanlış olurdu.
   */
  const step = useCallback((direction: 1 | -1) => {
    const el = ref.current;
    if (!el) return;

    const items = el.children;
    const delta =
      items.length > 1
        ? (items[1] as HTMLElement).offsetLeft -
          (items[0] as HTMLElement).offsetLeft
        : el.clientWidth;

    /*
      ⚠️ HAREKET TERCİHİ BURADA DA SORULUYOR. `scrollBy`ın `behavior`
      değeri CSS'teki `scroll-behavior`ı EZİYOR; globals.css'teki
      `prefers-reduced-motion` bloğu bu çağrıyı tek başına yakalayamaz.
    */
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    el.scrollBy({ left: direction * delta, behavior: reduced ? "auto" : "smooth" });
  }, []);

  return { ref, canPrev, canNext, scrollable: canPrev || canNext, onScroll, step };
}
