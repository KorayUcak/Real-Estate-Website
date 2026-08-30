/**
 * KARUSEL HİZALAMA SINIFLARI — hizalamanın tek doğruluk kaynağı.
 *
 * Kullananlar: `components/featured-carousel.tsx` (ana sayfa vitrini),
 * `components/card-scroller.tsx` ve ilan sayfasının çapraz satış slaytları.
 *
 * ⚠️ NEDEN KANCADAN AYRI BİR DOSYA. Bu sabitler önce
 * `lib/use-scroll-carousel.ts` içindeydi ve orada `"use client"` yönergesi
 * yoktu — `lib/swipe.ts` gibi çalışacağı varsayıldı. ÇALIŞMADI: ilan
 * sayfası bir SUNUCU bileşeni ve o dosyadan tek bir dize sabitini içe
 * aktarmak bile modülün tamamını sunucu grafiğine sokuyor. Modül
 * `useRef`/`useEffect` içerdiği için Turbopack derlemeyi durdurdu:
 *
 *   "You're importing a module that depends on `useEffect` into a React
 *    Server Component module."
 *
 * Belirleyici olan yönergenin varlığı değil, İÇE AKTARMA GRAFİĞİ. Sabitler
 * bu yüzden kancasız, tamamen saf bir dosyada duruyor: sunucu da istemci
 * de güvenle okuyabiliyor.
 */

/**
 * Şeridin kendisi.
 *
 * ⚠️ `snap-always` (CSS: `scroll-snap-stop: always`) HİZALAMA ŞİKÂYETİNİN
 * ASIL ÇÖZÜMÜ — ve slayt sınıfında duruyor. Yalnızca `snap-mandatory`
 * varken hızlı bir savurma birden çok yapışma noktasının ÜSTÜNDEN
 * atlayabiliyor ve şerit iki kartın arasında duruyordu; "yarı yolda kalma"
 * tam olarak bu. `always` her kartı zorunlu durak yapıyor: bir jest =
 * bir kart, her seferinde.
 *
 * `snap-start` + şeritte yatay iç boşluk olmaması: kartın sol kenarı
 * doğrudan kaydırma alanının başlangıcına oturuyor, yani `scroll-padding`e
 * gerek kalmıyor. Şerit `container-page`in İÇİNDE duruyor ve kenara
 * taşmıyor; taşsaydı aynı boşluğu `scroll-pl-6` ile telafi etmek gerekirdi.
 */
export const TRACK_CLASS =
  "no-scrollbar flex snap-x snap-mandatory items-stretch overflow-x-auto";

/** Slaytın hizalama sınıfları — her iki karusel de aynısını kullanır. */
export const SLIDE_CLASS = "flex shrink-0 snap-start snap-always";
