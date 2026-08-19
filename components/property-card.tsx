"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowRight, Bath, BedDouble, ChevronLeft, ChevronRight, MapPin, Ruler } from "lucide-react";
import { Price } from "@/components/price";
import { cn } from "@/lib/cn";
import type { PropertyCardData } from "@/lib/property-card-data";

/**
 * EVRENSEL İLAN KARTI — ana sayfa, /properties ve benzer ilanlar listesi.
 *
 * Tek bir kart bileşeni: galeri, alan gizleme kuralları ve rozet mantığı
 * tek yerde duruyor. Daha önce ana sayfa karuselli, /properties tek görselli
 * ayrı bir bileşen kullanıyordu; aynı kuralın iki kopyası er ya da geç
 * birbirinden ayrılır.
 */

/**
 * GİRİŞ ANİMASYONU NEDEN BURADA DEĞİL
 *
 * İlk sürüm framer-motion `whileInView` kullanıyordu. Doğrulamada altı
 * karttan beşi dört saniye sonra hâlâ `opacity: 0` idi: rAF tabanlı
 * animasyon ilerlemediğinde sonuç "animasyon olmadı" değil, "ilan
 * görünmedi" oluyor. Bir emlak sitesinde kabul edilebilir bir hata modu
 * değil.
 *
 * Bu yüzden giriş animasyonu components/reveal.tsx içindeki CSS tabanlı
 * `.reveal` sınıfına taşındı: `animation-timeline: view()` ile çalışıyor,
 * JavaScript gerektirmiyor ve TABAN DURUMU GÖRÜNÜR. Tarayıcı desteklemezse
 * kart hiç animasyonsuz ama tam görünür şekilde basılıyor.
 *
 * Kart içindeki hareketin geri kalanı (hover, karusel) CSS ve embla ile.
 */

export function PropertyCard({
  villa,
  priority = false,
  layout = "grid",
}: {
  villa: PropertyCardData;
  /** Yalnızca ilk kartta true — LCP görseli. */
  priority?: boolean;
  /**
   * "grid": dikey kart (varsayılan).
   * "list": `sm`den itibaren yatay — görsel solda, künye sağda.
   *
   * İki ayrı bileşen YAZILMADI. Galeri mantığı (embla, oklar, noktalar,
   * sürükleme fiziği) yüz satırdan uzun ve iki kopyası er ya da geç
   * birbirinden ayrılırdı; fark yalnızca dış kutunun yön sınıflarında.
   */
  layout?: "grid" | "list";
}) {
  const slides = villa.images;
  const href = `/properties/${villa.slug}`;
  const isList = layout === "list";


  /**
   * KARUSEL FİZİĞİ.
   *
   * Embla v8'de `friction` ve `tension` diye seçenekler YOKTUR (v8.6.0
   * `OptionsType` içinde bakılabilir) — bunlar eski sürümlerin sözlüğü.
   * v8'de sürükleme hissini belirleyen üç kaldıraç var:
   *
   *   duration      → bırakıldıktan sonraki geçişin uzunluğu (varsayılan 25,
   *                   milisaniye değil embla'nın kendi birimi). 32 belirgin
   *                   biçimde daha ağır ve yumuşak; 45+ artık tembel hissi
   *                   veriyor ve galeriyi gezmek yorucu oluyor.
   *   dragThreshold → sürüklemenin başlaması için gereken piksel. 10'dan
   *                   16'ya çıkarıldı: kartlar DİKEY kaydırılan bir ızgarada
   *                   duruyor ve dikey kaydırmadaki birkaç piksellik yatay
   *                   sapma karuseli kapıyordu. "Titrek" hissinin en büyük
   *                   kaynağı buydu — parmak aşağı gidiyor, galeri yana
   *                   kıpırdıyor.
   *   dragFree      → KASITLI OLARAK false.
   *
   * `dragFree: true` istenmişti; denendi ve geri alındı. Serbest sürüklemede
   * bırakma noktası bir slayta oturmuyor: slayt genişliği %100 olduğu için
   * kullanıcı yarısı bir fotoğraf, yarısı diğeri olan bir karede kalıyor.
   * Bu "pahalı" değil, "bozuk" görünüyor. Embla'nın kendi kodunda da bu iki
   * mod ayrı fizik kullanıyor (`baseSpeed = dragFree ? 43 : 25`).
   */
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: slides.length > 1,
    align: "start",
    containScroll: "trimSnaps",
    duration: 32,
    dragThreshold: 16,
    dragFree: false,
    /* Tek görsel varsa sürüklemeyi kapat: boşluğa çekiliyormuş hissi olmasın. */
    watchDrag: slides.length > 1,
  });
  const [selected, setSelected] = useState(0);

  const onSelect = useCallback(() => {
    if (emblaApi) setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    /*
      Kurulumda `onSelect()` DOĞRUDAN çağrılmıyor: efekt içinde setState
      react-hooks/set-state-in-effect kuralını ihlal ediyor ve fazladan bir
      render turu yaratıyor. Gerek de yok — embla her zaman 0. slayttan
      başlıyor, `selected` state'inin başlangıç değeri zaten 0.
      Sonraki her değişiklik "select" olayından geliyor; "reInit" ise
      yeniden boyutlandırmadan sonra senkron kalmayı sağlıyor.
    */
    emblaApi.on("select", onSelect).on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect).off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = (i: number) => emblaApi?.scrollTo(i);
  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  /**
   * Taşınan veride eksik olabilecek alanlar. Sıfır bir ölçü DEĞİLDİR —
   * "bilinmiyor" demektir; "0 m²" basmak yanlış bilgi olur.
   */
  const stats = [
    villa.bedrooms > 0 && { icon: BedDouble, label: "Bedrooms", value: villa.bedrooms },
    villa.bathrooms > 0 && { icon: Bath, label: "Bathrooms", value: villa.bathrooms },
    villa.buildSizeSqm > 0 && {
      icon: Ruler,
      label: "Internal area",
      value: `${villa.buildSizeSqm} m²`,
    },
  ].filter(Boolean) as { icon: typeof BedDouble; label: string; value: string | number }[];

  return (
    /*
      KART YÜZEYİ — "editöryel", kabartma düğme değil.

      DURAĞAN HÂLDE GÖLGE YOK. Kartı zeminden ayıran tek şey 1px'lik sıcak
      bir kenarlık. Önceki sürüm iki katmanlı bir gölge taşıyordu ve altı
      kart yan yana gelince sayfa "havada duran kutular" gibi görünüyordu;
      Savills/Knight Frank vitrinlerinde kartlar zemine YAPIŞIKTIR, aradaki
      fark çizgiyle kurulur. Gölge yalnızca hover'da ve tek, çok geniş,
      %22 opaklıkta bir yayılım olarak beliriyor (bkz. --shadow-soft).

      `rounded-sm`: köşeler neredeyse keskin. Yuvarlatma bu projede opt-in
      (globals.css taban kuralı), yani sınıfı yazmazsak 0 olurdu — 2px'i
      bilerek istiyoruz: tam keskin köşe fotoğrafın kenarında sert, tam
      yuvarlak ise "uygulama kartı" gibi duruyor.

      `overflow-hidden` iki iş yapıyor: köşeleri çocuklara taşıyor VE
      hover'da büyüyen fotoğrafı kartın sınırında kırpıyor — "gizli taşma
      kabı içinde yavaş büyüyen görsel" etkisinin tamamı bu.

      Hover'da yükselme 4px → 2px'e indi. Büyük bir sıçrama bu tasarım
      dilinde fazla oyuncu; 2px yalnızca "canlı" hissettiriyor.
    */
    <article
      className={cn(
        /*
          `w-full` ŞART — ve yalnızca liste görünümünde ortaya çıkan bir
          hata yüzünden eklendi. Kart, `display:flex` olan bir `<li>`nin tek
          çocuğu; genişliği `flex-basis:auto`dan, yani İÇERİĞİNDEN geliyor.
          Dikey ızgarada içerik zaten sütundan geniş olduğu için kart
          sütunu dolduruyordu ve eksiklik görünmüyordu. Yatay düzende ise
          içeriğin doğal genişliği 1216px'lik satırdan dar kalıyor ve kart
          271px'e büzülüyordu.
        */
        "group flex h-full w-full overflow-hidden rounded-sm border border-line bg-white",
        "transition-[transform,box-shadow,border-color] duration-500 ease-out",
        "hover:-translate-y-0.5 hover:border-line hover:shadow-soft",
        isList ? "flex-col sm:flex-row" : "flex-col",
      )}
    >
      {/* ------------------------------------------------------------ GALERİ */}
      <div
        className={cn(
          "relative isolate",
          /*
            Liste görünümünde görsel sol sütun. %38 — ilk denenen %42
            (5/12) 1216px'lik satırda 507px'lik bir fotoğraf veriyordu ve
            4:3 oranında satır 383px yüksekliğe çıkıyordu: ekranda aynı
            anda bir buçuk ilan. Liste görünümünün tek varlık sebebi daha
            çok ilanı yan yana taramak.
          */
          isList && "sm:w-[38%] sm:shrink-0",
        )}
        role="group"
        aria-roledescription="carousel"
        aria-label={`${villa.title} — photo gallery`}
      >
        {/*
          `select-none`: masaüstünde fareyle sürüklerken tarayıcı metin
          seçimi başlatıyordu; imleç mavi bir seçim izi bırakıp sürükleme
          takılıyordu.

          `[backface-visibility:hidden]`: embla'nın kendi önerisi. Geçiş
          sırasında bileşik katmanın yeniden çizilmesini engelliyor —
          `will-change` gibi kalıcı bir GPU katmanı AÇMADAN. Bu sayfada
          aynı anda 12 karusel var; 12 kalıcı katman mobilde belleği
          gereksiz şişirirdi.
        */}
        <div
          className="overflow-hidden select-none [backface-visibility:hidden]"
          ref={emblaRef}
        >
          <div className="flex touch-pan-y">
            {slides.map((image, i) => (
              <div
                key={image.src}
                className="relative min-w-0 flex-[0_0_100%]"
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${slides.length}`}
              >
                {/*
                  Slayt bir link: embla sürükleme sonrası tıklamayı zaten
                  bastırıyor, dolayısıyla kaydırma ile açma çakışmıyor.
                  Kart genelinde `after:inset-0` türü bir "stretched link"
                  KULLANILMADI — o katman galerinin dokunma olaylarını
                  yutar ve kaydırmayı tamamen bozardı.
                */}
                <Link
                  href={href}
                  tabIndex={i === 0 ? 0 : -1}
                  aria-hidden={i === 0 ? undefined : true}
                  /*
                    `relative` ŞART: <Image fill> mutlak konumlanır ve en yakın
                    konumlandırılmış atasına göre yerleşir. Bu sınıf olmadan
                    Next konsolu "has 'fill' and parent element with invalid
                    'position'" uyarısı basıyor ve görsel, slaytın değil daha
                    yukarıdaki bir kutunun sınırlarına oturuyor.
                  */
                  /*
                    Izgarada 4:3 (editöryel, dikeyde cömert); listede
                    `sm`den itibaren 3:2 — daha yatay bir kesit satır
                    yüksekliğini düşürüyor.
                  */
                  className={cn(
                    "relative block overflow-hidden bg-shell-deep",
                    isList ? "aspect-[4/3] sm:aspect-[3/2]" : "aspect-[4/3]",
                  )}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 92vw"
                    /*
                      Dışarıdaki prop adı `priority` KALIYOR (anlamı net ve
                      altı çağrı yeri var); `next/image`e geçerken `preload`
                      yazılıyor, çünkü Next 16'da `priority` kullanımdan
                      kaldırıldı. Sitede aynı geçişi bekleyen başka yerler de
                      var: property-gallery, post-card, page-hero, blog.
                    */
                    preload={priority && i === 0}
                    /*
                      `draggable={false}` — `<img>` varsayılan olarak
                      SÜRÜKLENEBİLİR bir HTML öğesidir. Masaüstünde fareyle
                      galeriyi çevirmeye çalışan kullanıcı aslında tarayıcının
                      yerel sürükle-bırak işlemini başlatıyor, yarı saydam bir
                      hayalet görsel imlece yapışıyor ve embla ile aynı anda
                      iki hareket birden oluyordu. "Ucuz ve takılıyor" hissinin
                      masaüstündeki asıl sebebi bu; bir fizik ayarı değil.
                    */
                    draggable={false}
                    /*
                      YAVAŞ YAKINLAŞMA. 900ms → 1400ms ve %4 → %6.
                      Hızlı bir zoom "etkileşim geri bildirimi" gibi okunur;
                      yavaş ve büyük olanı sinematik duruyor — fotoğrafın
                      kendisi olay, kart değil. `ease-out` ile hareket
                      başlarken hızlı, dururken neredeyse fark edilmez.
                    */
                    className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.06]"
                  />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/*
          Durum rozeti SAĞ ÜSTTE.

          Daha önce bölge etiketiyle aynı köşedeydi (`left-0 top-0`, aynı
          z-20) ve DOM'da ondan önce geldiği için tamamen altında kalıyordu:
          "Reserved" veya "Sold" hiçbir zaman görünmezdi. Şu an portföyün
          tamamı `for-sale` olduğu için kimse fark etmemişti — ilk satılan
          ilanda ortaya çıkacak bir hataydı.
        */}
        {/*
          ÜST ÇİP ŞERİDİ — solda bölge, sağda durum/öne çıkan.

          İkisi ayrı ayrı `absolute` konumlandırılmıştı (`left-4` ve
          `right-4`) ve dar kartta ÇAKIŞIYORLARDI: "OVACIK, FETHIYE" gibi
          uzun bir bölge etiketi 350px'lik bir kartta sağdaki "FEATURED"
          çipinin altına giriyordu. İki bağımsız mutlak konum, aralarındaki
          mesafeyi kimsenin garanti etmediği anlamına gelir.

          Tek bir `inset-x-4` şerit + `justify-between` bunu yapısal olarak
          imkânsız kılıyor: bölge etiketi `min-w-0 truncate` ile kırpılıyor,
          sağdaki çip `shrink-0` ile tam boyunu koruyor. Hangi kart
          genişliğinde olursa olsun üst üste binemezler.

          Rozetler köşeye YAPIŞMIYOR: kenardan kopan bir etiket fotoğrafın
          üstünde yüzen bir çip, köşeye yapışanı ise kurdele/indirim dili.

          "Sold"/"Reserved" tam opak antrasit — bilgi kritik. "Featured"
          ise cam gibi: dikkat çekmeli ama fotoğrafı kapatmamalı.
        */}
        <div className="pointer-events-none absolute inset-x-4 top-4 z-20 flex items-start justify-between gap-2">
          {/* Bölge etiketi — METİN. Koordinat asla basılmaz; 21 ilanın pin'i
              Miami'yi gösteriyor (bkz. safeMapCoordinates). */}
          <p className="inline-flex min-w-0 items-center gap-1.5 rounded-sm bg-shell/90 px-2.5 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-sea-deep backdrop-blur-sm">
            <MapPin
              className="size-3 shrink-0 text-sea"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <span className="truncate">{villa.areaLabel}</span>
          </p>

          {villa.status !== "for-sale" ? (
            <p className="shrink-0 rounded-sm bg-ink/85 px-2.5 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-shell backdrop-blur-sm">
              {villa.status.replace("-", " ")}
            </p>
          ) : villa.featured ? (
            <p className="shrink-0 rounded-sm border border-white/40 bg-ink/35 px-2.5 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md">
              Featured
            </p>
          ) : null}
        </div>

        {slides.length > 1 ? (
          <>
            {/*
              Oklar: masaüstünde hover ile beliriyor, dokunmatikte HER ZAMAN
              görünür. `group-hover` tek başına bırakılsaydı telefonda hiç
              görünmezdi — hover diye bir şey yok. 44px dokunma hedefi.
            */}
            <CarouselButton side="left" onClick={scrollPrev} label="Previous photo" />
            <CarouselButton side="right" onClick={scrollNext} label="Next photo" />

            {/* Sayfa noktaları — konumu bildirir ve doğrudan atlamayı sağlar. */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center bg-gradient-to-t from-ink/45 to-transparent pb-3 pt-8">
              <div className="pointer-events-auto flex items-center gap-1.5">
                {slides.map((image, i) => (
                  <button
                    key={image.src}
                    type="button"
                    onClick={() => scrollTo(i)}
                    aria-label={`Show photo ${i + 1} of ${slides.length}`}
                    aria-current={i === selected}
                    className={cn(
                      "h-1.5 transition-all duration-300",
                      i === selected
                        ? "w-6 bg-white"
                        : "w-1.5 bg-white/60 hover:bg-white/90",
                    )}
                  />
                ))}
              </div>
            </div>
          </>
        ) : null}

      </div>

      {/* ------------------------------------------------------------ İÇERİK */}
      {/*
        AÇIKLAMA PARAGRAFI KALDIRILDI.

        Kart artık yalnızca görsel, bölge, başlık, ölçüler ve fiyat taşıyor.
        Pazarlama cümlesi ("An Exceptional Coastal Residence...") kartın
        yarısını kaplıyor, iki satırda kesiliyor ve hiçbir ilanı diğerinden
        ayırt ettirmiyordu — okunmayan ama yer kaplayan metin.

        `villa.headline` VERİDE DURUYOR: arama dizgesini besliyor
        (lib/property-card-data.ts → searchText), yalnızca kart yüzeyinde
        gösterilmiyor.

        Boşluk yönetimi: başlık ile ölçüler arası 5 → 4 birime indi. Fiyat
        satırı `mt-auto` ile en altta kaldığı için kartlar aynı yükseklikte
        biterken artan yer aşağı değil, ölçülerin altına toplanıyor.
      */}
      <div
        className={cn(
          "flex flex-1 flex-col p-5 sm:p-6",
          /* Liste görünümünde metin sütunu daha geniş nefes alıyor. */
          isList && "sm:justify-center sm:p-8",
        )}
      >
        <h3
          className={cn(
            "font-display font-semibold leading-snug text-sea-deep",
            isList ? "text-lg sm:text-2xl" : "text-base sm:text-lg",
          )}
        >
          <Link href={href} className="line-clamp-2 hover:text-sea">
            {villa.title}
          </Link>
        </h3>

        {stats.length > 0 ? (
          <dl className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4 text-sm text-ink-70">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-2">
                {/*
                  `strokeWidth={1.25}` — lucide varsayılanı 2. Kalın çizgili
                  ikonlar 16px'te "uygulama arayüzü" gibi duruyordu; ince
                  kontur onları çizim/gravür tarafına çekiyor ve serif
                  başlıkla aynı ağırlıkta okunuyor.
                */}
                <stat.icon
                  className="size-4 shrink-0 text-sea"
                  strokeWidth={1.25}
                  aria-hidden="true"
                />
                <dt className="sr-only">{stat.label}</dt>
                <dd className="tabular-nums">{stat.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {/*
          IZGARADA `mt-auto`, LİSTEDE DEĞİL.

          Izgarada fiyat satırı kartın dibine itiliyor: yan yana duran
          kartların fiyat çizgisi aynı hizada bitmeli, aradaki boşluk bu
          hizanın bedeli.

          Listede aynı kural tam tersini yapıyordu — kart yüksekliğini
          fotoğraf belirlediği için fiyat 380px aşağı düşüyor, ölçülerle
          arasında koca bir boş alan kalıyordu. Hizalanacak bir komşu da
          yok: her satırda tek kart var. Burada içerik doğal yığın hâlinde
          kalıp dikeyde ortalanıyor.
        */}
        <div
          className={cn(
            "flex items-center justify-between gap-4 pt-4",
            isList ? "mt-6" : "mt-auto",
          )}
        >
          {villa.price > 0 ? (
            <Price
              gbp={villa.price}
              className="font-display text-xl font-semibold leading-none tracking-tight text-sea-deep sm:text-2xl"
            />
          ) : (
            <span className="font-display text-lg font-bold uppercase tracking-tight text-ink-40">
              Price on application
            </span>
          )}

          <Link
            href={href}
            aria-label={`View ${villa.title}`}
            className="inline-flex items-center gap-2 rounded-sm bg-sea-deep px-4 py-2.5 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-shell transition-colors duration-300 hover:bg-gold hover:text-ink"
          >
            View
            <ArrowRight
              className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
              strokeWidth={1.5}
            />
          </Link>
        </div>
      </div>
    </article>
  );
}

function CarouselButton({
  side,
  onClick,
  label,
}: {
  side: "left" | "right";
  onClick: () => void;
  label: string;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        /* Köşeye yapışık beyaz bloklar yerine kenardan kopmuş cam çipler. */
        "absolute top-1/2 z-20 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-sm bg-shell/85 text-sea-deep backdrop-blur-sm transition-all duration-300 hover:bg-shell",
        "focus-visible:opacity-100",
        /* Dokunmatikte kalıcı, fare varsa hover ile. */
        "opacity-100 md:opacity-0 md:group-hover:opacity-100",
        side === "left" ? "left-3" : "right-3",
      )}
    >
      <Icon className="size-4" strokeWidth={1.5} aria-hidden="true" />
    </button>
  );
}
