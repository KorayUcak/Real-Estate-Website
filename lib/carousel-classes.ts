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
 * ⚠️ `scroll-padding` HÂLÂ GEREKMİYOR — ama artık başka bir sebeple.
 * Mobilde hizalama `snap-center`; ortalama, şeridin İKİ yanındaki boşluğu
 * eşit gördüğü için simetrik bir `scroll-padding` merkezi kaydırmaz.
 * `sm`den itibaren hizalama `snap-start`a dönüyor ve orada şeridin yatay
 * iç boşluğu sıfırlanıyor (`sm:px-0`), yani kartın sol kenarı doğrudan
 * kaydırma alanının başlangıcına oturuyor. Her iki durumda da telafi
 * edilecek bir kayma yok.
 */
export const TRACK_CLASS = [
  "no-scrollbar flex snap-x snap-mandatory items-stretch overflow-x-auto",
  /*
    MOBİLDE ŞERİT EKRANIN KENARINA TAŞIYOR — ve bu, ORTALAMANIN ÖN KOŞULU.

    `snap-center` kartı KAYDIRMA ALANININ ortasına oturtuyor. Şerit
    `container-page`in içinde kalsaydı o orta, kabın ortası olurdu; ekranın
    değil. Üstelik İLK kart hiçbir zaman ortalanamazdı: ortalanmış konumu
    negatif bir `scrollLeft` gerektirir, tarayıcı da 0'da durur ve kart sola
    yapışık kalır.

    `-mx-6` kabın 1.5rem'lik iç boşluğunu geri alıyor (şerit tam genişlik),
    `px-10` ise şeridin İÇİNE 40px'lik simetrik bir boşluk koyuyor. Kart
    genişliği `100vw - 5rem` seçildiği için hesap tam kapanıyor:

        40px + (100vw - 80px) + 40px = 100vw

    Yani ilk kartın ortalanmış konumu `scrollLeft: 0` — ulaşılabilir. Aynı
    şey sonuncusu için de geçerli.

    `sm`den itibaren hepsi sıfırlanıyor: orada kart iki sütuna düşüyor ve
    hizalama `snap-start`a dönüyor (bkz. SLIDE_CLASS).
  */
  "-mx-6 px-10 sm:mx-0 sm:px-0",
  /*
    Yatay taşmanın sayfaya ZİNCİRLENMESİNİ kesiyor. Trackpad'de şeridin
    sonuna gelip kaydırmaya devam etmek, tarayıcının "geri" hareketini
    tetikleyebiliyordu — kullanıcı kart kaydırırken sayfadan çıkıyordu.
  */
  "overscroll-x-contain",
].join(" ");

/**
 * Slaytın hizalama sınıfları — her iki karusel de aynısını kullanır.
 *
 * ⚠️ MOBİLDE `snap-center`, `sm`DEN İTİBAREN `snap-start`.
 *
 * Tek kartın göründüğü mobilde doğru davranış ortalamak: kart ekranın
 * ortasına oturuyor ve iki yanında eşit birer şerit kalıyor — önceki ve
 * sonraki kartın kenarları. `snap-start` orada kartı sola yapıştırıp
 * boşluğun tamamını sağa yığıyordu.
 *
 * `sm`den itibaren aynı anda iki (ve `lg`de üç) kart görünüyor; orada
 * ortalamak ızgarayı bozar, çünkü kartlar kabın kenarlarıyla hizalı
 * durmalı. Bu yüzden hizalama başlangıca dönüyor.
 */
export const SLIDE_CLASS =
  "flex shrink-0 snap-always snap-center sm:snap-start";
