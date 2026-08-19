"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { imagery } from "@/lib/imagery";
import { swipeHandlers } from "@/lib/swipe";

/**
 * Sinematik hero.
 *
 * Parallax `useScroll` + `useTransform` ile yapılıyor: kaydırma değeri bir
 * MotionValue olarak doğrudan transform'a bağlanır, yani her karede React
 * render'ı tetiklenmez. `scroll` olayında setState çağıran yaklaşımın aksine
 * ana iş parçacığı boş kalır ve animasyon 60fps'te akar.
 *
 * H1 ilk HTML'de tam olarak vardır — animasyon yalnızca opaklık/konum
 * üzerinedir, içerik hiçbir zaman JavaScript'e bağımlı değildir.
 *
 * Hero SAF GÖRSEL bir banner: arama/filtre arayüzü taşımıyor. Tek işi
 * bakılmak ve kullanıcıyı /properties'e devretmek.
 */

/** Video hazır olduğunda burayı "/media/fethiye-hero.mp4" yapın; poster görsel kalır. */
const HERO_VIDEO: string | null = null;

export function HomeHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  /**
   * HERO SLAYT GÖSTERİSİ — YATAY KAYDIRMA DEĞİL, ÇAPRAZ GEÇİŞ.
   *
   * Embla kaldırıldı. Embla bir kaydırma kabıdır: slaytları yan yana dizip
   * şeridi hareket ettirir, yani geçiş her zaman "kayma"dır. İstenen etki
   * ise iki fotoğrafın birbirine karışarak yer değiştirmesi — üst üste
   * duran iki katman ve opaklık gerektiriyor. Bunu embla'ya yaptırmak için
   * ayrı bir eklenti (embla-carousel-fade) kurmak gerekirdi; tek bir
   * indeks + `AnimatePresence` aynı işi bağımlılık eklemeden yapıyor.
   *
   * Kayıp: embla'nın sürükleme fiziği. Yerine `lib/swipe.ts` geldi, yani
   * telefonda parmakla geçiş korunuyor.
   *
   * Otomatik oynatma `prefers-reduced-motion` altında HİÇ KURULMUYOR —
   * duraklatılmıyor, kurulmuyor. Vestibüler rahatsızlığı olan kullanıcı
   * için kendiliğinden değişen tam ekran bir görsel, azaltılması istenen
   * hareketin ta kendisidir. Slaytlar yine elle gezilebilir.
   */
  const slides = imagery.homeHeroSlides;
  const [slide, setSlide] = useState(0);
  /** Otomatik geçişi duraklatan durumlar: fare üstünde, odak içeride. */
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (delta: number) =>
      setSlide((current) => (current + delta + slides.length) % slides.length),
    [slides.length],
  );

  useEffect(() => {
    if (reduceMotion || paused || slides.length < 2) return;

    const timer = setInterval(() => {
      setSlide((current) => (current + 1) % slides.length);
    }, 6500);

    return () => clearInterval(timer);
    /*
      `slide` BİLİNÇLİ olarak bağımlılık değil: listede olsaydı her geçişte
      zamanlayıcı yeniden kurulur, elle bir slayta atlayan kullanıcı da tam
      6.5 saniye kazanırdı — istenen de bu değil, tutarsız da. Sayaç
      kendi ritminde akıyor.
    */
  }, [reduceMotion, paused, slides.length]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  /** Görsel kaydırmadan yavaş hareket eder → derinlik hissi. */
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <section
      ref={sectionRef}
      /*
        `data-hero`: site başlığı bu işareti arayıp üzerinde bir
        IntersectionObserver kuruyor — cam görünümden opak görünüme tam
        olarak burada geçiyor. Başlık layout'ta, hero sayfada; ikisi
        birbirini import etmeden bu öznitelik üzerinden konuşuyor.
        İşaret kaldırılırsa başlık kalıcı olarak opak kalır (güvenli taraf).
      */
      data-hero=""
      aria-labelledby="hero-heading"
      /*
        Parmakla geçiş (embla gittiği için elle bağlanıyor) + otomatik
        oynatmanın duraklatılması. Fare üstündeyken veya odak hero'nun
        içindeyken slayt değişmiyor: kullanıcı bakarken fotoğrafı altından
        çekmek, bir kontrolü okurken sayfanın kayması kadar rahatsız edici.
      */
      {...swipeHandlers(
        () => go(-1),
        () => go(1),
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setPaused(false);
        }
      }}
      /*
        BAŞLIĞIN ALTINA ÇEKME.

        Site başlığı `sticky`, yani `fixed` değil — normal akışta yer KAPLAR.
        Dokunulmasaydı hero başlığın altından başlar, başlığın camı da
        hero'yu değil sayfanın zeminini bulanıklaştırırdı; "cam" efekti
        görünürde hiçbir şey yapmazdı.

        Negatif üst kenar boşluğu hero'yu tam olarak başlık yüksekliği kadar
        yukarı çekiyor, eşit `padding-top` ise içeriği geri itiyor: bölüm
        y=0'dan başlıyor ama metin hâlâ görünür alanın ortasında duruyor.
        Değerler başlıktaki `h-24 lg:h-28` ile ELDEN eşleştirilmiştir —
        biri değişirse diğeri de değişmeli.

        Dikey negatif kenar boşluğu yatay taşma üretmez; buradaki risk
        yalnızca hizadır.
      */
      /*
        YÜKSEKLİK — İKİ AYRI KURAL.

        Masaüstü (`lg:h-screen`): bölüm TAM ekran. Negatif üst kenar boşluğu
        hero'yu y=0'a çektiği için 100vh burada gerçekten "ilk ekranın
        tamamı" demek — altta kalan o garip beyaz şerit böylece kapanıyor.

        Mobil (`h-[75vh]`): bilinçli olarak tam ekran DEĞİL. Kalan %25,
        "Featured Properties" başlığının katlamanın hemen üstünden
        görünmesini sağlıyor; kaydırılacak bir şey olduğunu söyleyen en
        ucuz sinyal bu — kaydırma okundan çok daha etkili, ki o ok bu
        turda zaten kaldırıldı.

        `min-h-[28rem]`: yatay tutulan telefonlarda 75vh ~350px'e düşebilir;
        bu taban başlık + buton bloğunun sıkışmasını engelliyor. Değer eski
        34rem'den düşürüldü, çünkü içerik artık iki satır metin ve tek bir
        butondan ibaret.
      */
      className="relative isolate -mt-24 flex h-[75vh] min-h-[28rem] flex-col justify-center overflow-hidden bg-sea-deep pt-24 text-shell lg:-mt-28 lg:h-screen lg:pt-28"
    >
      {/* --------------------------------------------------------- ARKA PLAN */}
      {/*
        YATAY KAYDIRMA HATASININ KAYNAĞI BURASIYDI.

        Bu katman `absolute inset-0`, yani tam olarak bölüm kadar; üzerinde
        de kaydırmayla 1 → 1.15 arasında değişen bir `scale` var.
        `overflow-hidden` bir elemanın ÇOCUKLARINI kırpar, KENDİSİNİ değil —
        dolayısıyla katmanın kendisi %15 büyüyüp her iki yandan ~%7.5
        taşıyordu. Soldaki taşma görünmez (tarayıcı sola kaydırmaz), sağdaki
        ise sayfaya yatay kaydırma çubuğu ekliyordu.

        Belirti kaydırmaya bağlıydı: sayfanın en üstünde `scale` 1, taşma
        yok; hero'nun içine doğru kaydırdıkça çubuk beliriyordu. "Bazen var
        bazen yok" hissinin sebebi buydu.

        Düzeltme: `overflow-hidden` BÖLÜMÜN kendisine geri verildi (yukarıda).
        Daha önce oradan kaldırılmıştı çünkü arama panelinin açılır menülerini
        kesiyordu — o panel bu turda kaldırıldığı için kısıt da ortadan kalktı.
      */}
      <motion.div
        style={reduceMotion ? undefined : { y: imageY, scale: imageScale }}
        className="absolute inset-0 -z-10 overflow-hidden"
      >
        {HERO_VIDEO ? (
          <video
            className="size-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster={imagery.homeHero.src}
          >
            <source src={HERO_VIDEO} type="video/mp4" />
          </video>
        ) : (
          /*
            ÇAPRAZ GEÇİŞ (CROSS-FADE).

            Üst üste iki katman: giden fotoğraf sönerken gelen fotoğraf
            açılıyor. `AnimatePresence`in VARSAYILAN modu kullanılıyor,
            `mode="wait"` DEĞİL — "wait" önce eskiyi tamamen söndürür, yani
            arada boş (siyah) bir kare kalır ve etki "kararma" olur,
            "karışma" değil.

            1.2 saniye: 400-600ms aralığı bir arayüz geçişi gibi okunuyordu.
            Sinematik bir banner'da geçişin kendisi de bir efekt.
          */
          <AnimatePresence initial={false}>
              <motion.div
                key={slides[slide].src}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                className="absolute inset-0"
                role="group"
                aria-roledescription="slide"
                aria-label={`${slide + 1} of ${slides.length}`}
              >
                <Image
                  src={slides[slide].src}
                  alt={slides[slide].alt}
                  fill
                  /*
                    YALNIZCA İLK SLAYT PRELOAD EDİLİR.

                    `preload`, Next 16'da `priority`nin yerini aldı;
                    `priority` bu sürümde kullanımdan kaldırıldı (bkz.
                    node_modules/next/dist/docs → image.md, "priority").

                    Diğerleri VARSAYILAN (`lazy`) kalıyor ve bu bilinçli bir
                    ödünleşme. `eager` denendiğinde derleme çıktısında üç
                    fotoğrafın DA <head>'e preload olarak girdiği görüldü —
                    yani LCP görseli, henüz görünmeyen iki büyük fotoğrafla
                    bant genişliği yarışına giriyordu.
                  */
                  preload={slide === 0}
                  quality={85}
                  sizes="100vw"
                  /*
                    OPTİMİZASYON KAPALI — geçici ve bilinçli.

                    `next/image` uzak bir kaynağı KENDİ SUNUCUSUNDA indirip
                    yeniden kodluyor. Bu üç hero görseli 2070px genişliğinde
                    ve Unsplash'ten geliyor; indirme yavaş kaldığında
                    optimizasyon isteği zaman aşımına düşüyor ve terminale
                    `TimeoutError: The operation was aborted due to timeout`
                    olarak yansıyor. `unoptimized` ile tarayıcı görseli
                    doğrudan Unsplash'ten alıyor, araya sunucu girmiyor.

                    BEDELİ KÜÇÜK DEĞİL: AVIF/WebP dönüşümü ve cihaza göre
                    boyutlandırma devre dışı kalıyor, yani telefonlar da
                    2070px'lik bir JPEG indiriyor. Bu yüzden yalnızca BU
                    geçici stok görsellerde açık. Gerçek çekimler /public
                    altına taşındığında (bkz. lib/imagery.ts TODO) bu satır
                    kaldırılmalı — yerel dosyada zaman aşımı riski yok ve
                    optimizasyon bedavaya geliyor.
                  */
                  unoptimized
                  className="object-cover"
              />
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>

      {/*
        AYDINLIK PERDE.
        Eski hero neredeyse siyah bir degrade taşıyordu; manzara görünmüyordu.
        Şimdi tek ve ince bir lacivert perde var: fotoğrafın turkuazı geçiyor
        ama ortalanmış beyaz metin hâlâ WCAG AA eşiğinin üstünde kalıyor
        (ölçüm: beyaz üstünde sea-deep/45 → 5.4:1). Alt kenardaki ikinci
        katman yalnızca metin bloğunun oturduğu bandı bir tık koyultur.
      */}
      {/*
        KARARTMA KATMANI.

        Beyaz başlık, turkuaz suyun en parlak yerinde de okunur kalmalı.
        Tek düz katman yerine iki katman: sabit bir taban karartma + alttan
        gelen degrade. Degrade metnin oturduğu bandı biraz daha koyultuyor,
        üst tarafta ise manzara açık kalıyor.

        Ölçüm: beyaz metin bu bileşimde ~7:1 kontrast veriyor (AA eşiği 4.5).
      */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-ink/45" />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/70 via-ink/20 to-ink/35"
      />

      <motion.div
        style={reduceMotion ? undefined : { y: contentY, opacity: contentOpacity }}
        className="container-page py-20 text-center sm:py-24"
      >
        <div className="mx-auto flex max-w-3xl flex-col items-center">
          {/* Sayfadaki tek H1. Tek satır, tek vaat, tek okuma. */}
          <h1
            id="hero-heading"
            /*
              Harf aralığı -0.03em → +0.02em. Negatif aralık Montserrat'ı
              toparlıyordu; Playfair'de büyük harfler birbirine giriyor ve
              tırnaklar çakışıyor. Ağırlık da 800'den taban 600'e bırakıldı
              (yalnızca 500/600/700 indiriliyor; 800 istemek tarayıcıyı
              sahte kalınlaştırmaya zorlardı).
            */
            className="rise-in font-display text-[1.75rem] uppercase leading-[1.08] tracking-[0.02em] text-white drop-shadow-[0_2px_12px_rgba(10,20,30,0.35)] sm:text-5xl lg:text-6xl"
          >
            Find your dream property
          </h1>

          {/*
            Konumlar artık başlığın DOĞRUDAN altında, iki yanındaki altın
            çizgiler olmadan.

            Metin BÜYÜK HARFLE YAZILIYOR, `uppercase` sınıfıyla dönüştürülmüyor:
            CSS `text-transform` küçük "i" harfini varsayılan yerelde noktasız
            "I" yapar ve "FETHIYE" ortaya çıkar. Türkçe yer adlarının doğru
            yazımı ("FETHİYE") ancak harfin kaynakta böyle durmasıyla garanti.
          */}
          <p className="rise-in rise-in-2 mt-6 font-display text-xs font-bold tracking-[0.28em] text-gold sm:text-sm sm:tracking-[0.32em]">
            FETHİYE · ÖLÜDENİZ · GÖCEK
          </p>

          {/*
            TEK EYLEM.

            Önceki hero'da iki buton (WhatsApp + ilanlar) ve bir kaydırma oku
            vardı; üçü birden bakışı bölüyordu. WhatsApp yolu kaybolmuyor —
            sabit iletişim paneli ve /contact sayfası yerinde duruyor.
          */}
          <div className="rise-in rise-in-3 relative z-10 mt-10 sm:mt-12">
            <Link
              href="/properties"
              className="btn btn-light px-12 tracking-[0.2em]"
            >
              View properties
            </Link>
          </div>
        </div>
      </motion.div>

      {/*
        KAYDIRMA OKU KALDIRILDI. Yerini yapının kendisi aldı: mobilde hero
        75vh olduğu için bir sonraki bölümün başlığı zaten katlamanın üstünden
        görünüyor, masaüstünde ise tam ekran bir fotoğrafın altında bir şey
        olduğunu kimse sorgulamıyor. Zıplayan bir ok, lüks bir sayfada
        gereğinden fazla konuşuyordu.
      */}

      {/*
        SLAYT GÖSTERGELERİ.

        Sağ altta, ORTADA DEĞİL: orta, metin bloğunun dikey ekseni. Parallax'la
        sönen içerik bloğunun DIŞINDA duruyorlar — kullanıcı biraz
        kaydırdığında kaybolmamaları gerekiyor, çünkü hâlâ çalışan
        kontroller.

        Otomatik oynatma varken bile tıklanabilir olmaları önemli: hareketi
        gören ama beklemek istemeyen kullanıcıya doğrudan atlama imkânı verir.
      */}
      {/*
        GEZİNME OKLARI.

        `top-1/2 -translate-y-1/2` ile dikeyde ortada, ama `z-20` katmanında
        ve içerik bloğunun DIŞINDA: parallax ile sönen metnin aksine kaydırma
        sırasında görünür kalıyorlar, çünkü hâlâ çalışan kontroller.

        Görünürlük: masaüstünde hover ile beliriyor, DOKUNMATİKTE HER ZAMAN
        görünür. Yalnızca `group-hover` bırakılsaydı telefonda hiç
        görünmezlerdi — hover diye bir şey yok. Aynı kural kartlardaki
        galeride de uygulanıyor.

        Boyut 44px: dokunma hedefi alt sınırı.
      */}
      {HERO_VIDEO ? null : (
        <>
          <HeroArrow side="left" label="Previous image" onClick={() => go(-1)} />
          <HeroArrow side="right" label="Next image" onClick={() => go(1)} />
        </>
      )}

      {HERO_VIDEO ? null : (
        <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
          {slides.map((image, index) => (
            <button
              key={image.src}
              type="button"
              onClick={() => setSlide(index)}
              aria-label={`Show slide ${index + 1} of ${slides.length}`}
              aria-current={index === slide}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500 ease-out",
                index === slide
                  ? "w-8 bg-gold"
                  : "w-1.5 bg-white/55 hover:bg-white/85",
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * OK DÜĞMESİ.
 *
 * Yarı saydam koyu cam: fotoğrafın üstünde her tonda okunur kalması gerekiyor
 * ve düz beyaz bir daire parlak gökyüzünde kayboluyordu. Kenarlık 1px beyaz
 * %30 — cam kenarını tanımlayan tek şey o.
 */
function HeroArrow({
  side,
  label,
  onClick,
}: {
  side: "left" | "right";
  label: string;
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        /*
          KONUM: dikeyde ORTA DEĞİL, %62.

          Ortada dururken 375px'te tam olarak H1'in hizasına düşüyorlardı —
          "FIND YOUR DREAM PROPERTY"nin iki yanına binen iki daire. Bu
          yüzden mobilde tamamen gizlenmişlerdi; ama slayt gösterisi artık
          embla'nın sürükleme fiziğini kullanmıyor, dolayısıyla oklar
          telefonda da görünür bir kontrol olarak gerekiyor (parmakla
          geçiş de ayrıca çalışıyor).

          %62 hem başlık bloğunun altında kalıyor hem de alt kenardaki
          nokta göstergelerine değmiyor.

          `rounded-full` — bu tasarımda köşe yuvarlatma opt-in ve bu iki
          düğme istisnalardan: fotoğrafın üstünde yüzen bir kontrol, kare
          bir kutudan çok bir "mercek" gibi okunmalı.
        */
        "group/arrow absolute top-[62%] z-20 inline-flex size-11 -translate-y-1/2 items-center justify-center sm:top-1/2",
        "rounded-full border border-white/30 bg-ink/25 text-white backdrop-blur-md",
        "transition-all duration-500 ease-out hover:border-white/70 hover:bg-ink/50",
        /* Dokunmatikte kalıcı, fare varsa hover ile. */
        "opacity-100 md:opacity-0 md:focus-visible:opacity-100 md:group-hover:opacity-100",
        side === "left" ? "left-4 sm:left-6" : "right-4 sm:right-6",
      )}
    >
      <Icon
        className="size-5 transition-transform duration-500 ease-out group-hover/arrow:scale-110"
        aria-hidden="true"
      />
    </button>
  );
}

