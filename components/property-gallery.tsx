"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Expand, Images, X } from "lucide-react";
import { EASE_OUT_EXPO } from "@/components/reveal";
import { cn } from "@/lib/cn";
import { swipeHandlers } from "@/lib/swipe";
import type { VillaImage } from "@/lib/types";
import { useT } from "@/components/translation";

/**
 * İlan galerisi: mozaik ızgara (1 büyük + 2 küçük) ve tam ekran lightbox.
 *
 * Tek büyük görsel yerine mozaik: ziyaretçi daha ilk saniyede evin üç farklı
 * yüzünü görür, "galeriyi aç" adımına ihtiyaç kalmadan. Emlak ilanlarında
 * karar büyük ölçüde fotoğrafla verilir; onları tıklamanın arkasına saklamak
 * ilgiyi düşürür.
 *
 * Lightbox için native <dialog>.showModal() kullanılıyor. Kendi modal'ını
 * yazmaya kıyasla bedavaya gelenler: odak tuzağı (focus trap), arka planın
 * inert hâle gelmesi, Escape ile kapanma ve doğru ARIA rolü. Elle yazılan
 * modal'ların erişilebilirlik hatalarının çoğu tam olarak bu dört maddede olur.
 */
export function PropertyGallery({
  images,
  title,
}: {
  images: VillaImage[];
  title: string;
}) {
  const { t } = useT();
  const [activeIndex, setActiveIndex] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const reduceMotion = useReducedMotion();

  const total = images.length;
  const active = images[activeIndex];
  const [cover, ...rest] = images;

  const sideImages = rest.slice(0, 2);
  /** Mozaikte görünmeyen kalan fotoğraflar "+N" rozetiyle duyurulur. */
  const hiddenCount = Math.max(total - 1 - sideImages.length, 0);

  const step = useCallback(
    (delta: number) => {
      setActiveIndex((current) => (current + delta + total) % total);
    },
    [total],
  );

  const openLightbox = (index: number) => {
    setActiveIndex(index);
    dialogRef.current?.showModal();
  };

  /*
    ⚠️ GÖRSELSİZ İLAN.

    `const [cover] = images` boş dizide `undefined` verir ve aşağıdaki
    <GalleryTile image={cover}> içinde `image.src` okunduğu anda sayfa
    500 döner. Taşınan 57 ilanın hepsinde en az bir fotoğraf olduğu için
    bu satır bugüne kadar hiç patlamadı — ama admin paneli hatayı
    ERİŞİLEBİLİR hâle getiriyor: yeni bir ilan DAİMA sıfır görselle
    oluşuyor (fotoğraflar ikinci adımda yükleniyor), yani yönetici ilanı
    kaydettikten hemen sonra kendi sayfasını açtığında çöküyordu.
    Mevcut bir ilandan tüm fotoğrafları silmek de aynı sonucu verir.

    Erken dönüş, hook'lardan SONRA: React hook'ları koşulsuz ve hep aynı
    sırada çağrılmalı, bu yüzden guard useState/useCallback'lerin üstüne
    taşınamaz.
  */
  if (total === 0 || !cover) {
    return (
      <div
        role="img"
        aria-label={`No photographs available yet for ${title}`}
        className="flex aspect-[4/3] items-center justify-center border border-line bg-shell-deep md:aspect-[3/1]"
      >
        <span className="inline-flex items-center gap-2 text-sm text-ink-40">
          <Images className="size-4" aria-hidden="true" />
          {t("properties.noPhotos")}
        </span>
      </div>
    );
  }

  return (
    <div>
      {/*
        `md:contents`: mobilde küçük görseller kendi iki sütunlu ızgarasında
        durur, md üstünde bu sarmalayıcı yok sayılır ve tile'lar doğrudan
        ana mozaik ızgarasının hücrelerine yerleşir.
      */}
      <div className="grid gap-2 md:h-[36rem] md:grid-cols-3 md:grid-rows-2">
        <GalleryTile
          image={cover}
          onOpen={() => openLightbox(0)}
          label={`Open full-screen gallery — ${total} photos of ${title}`}
          priority
          sizes="(min-width: 768px) 66vw, 100vw"
          className="aspect-[4/3] md:col-span-2 md:row-span-2 md:aspect-auto"
        >
          <span className="pointer-events-none absolute bottom-4 left-4 inline-flex items-center gap-2 bg-ink/60 px-4 py-2 text-xs text-shell backdrop-blur-md">
            <Expand className="size-3.5" aria-hidden="true" />
            {t("properties.galleryOpen")}
          </span>
        </GalleryTile>

        {sideImages.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 md:contents">
            {sideImages.map((image, index) => {
              const isLastTile = index === sideImages.length - 1;

              return (
                <GalleryTile
                  key={image.src}
                  image={image}
                  onOpen={() => openLightbox(index + 1)}
                  label={`Open photo ${index + 2} of ${total} — ${image.alt}`}
                  sizes="(min-width: 768px) 33vw, 50vw"
                  className="aspect-[4/3] md:aspect-auto"
                >
                  {isLastTile && hiddenCount > 0 ? (
                    <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink/55 text-shell backdrop-blur-[2px] transition-colors group-hover:bg-ink/65">
                      <Images className="size-5" aria-hidden="true" />
                      <span className="font-display text-xl">
                        +{hiddenCount}
                      </span>
                    </span>
                  ) : null}
                </GalleryTile>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* Fotoğraf sayısı ızgaranın altında da yazıyla duruyor — ekran okuyucu için. */}
      <p className="mt-3 text-xs text-ink-40">
        {total} photo{total === 1 ? "" : "s"} · click any image to open the
        full-screen gallery
      </p>

      {/* --------------------------------------------------------- LIGHTBOX */}
      <dialog
        ref={dialogRef}
        aria-label={`Photo gallery — ${title}`}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            step(1);
          }
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            step(-1);
          }
        }}
        /* backdrop: <dialog>'un ::backdrop sözde elemanını hedefler. */
        className="max-h-none max-w-none bg-transparent p-0 backdrop:bg-ink/95 backdrop:backdrop-blur-sm"
      >
        {/*
          KENARDAN KENARA DÜZEN.

          Önceki yerleşim üç satırlık bir sütundu: üstte sayaç+kapat şeridi,
          ortada fotoğraf, altta oklar ve açıklama. Fotoğraf ekranın
          tamamını değil, artakalan orta bandı kullanıyordu — 900px'lik bir
          ekranda üstten ~70px, alttan ~150px kayıp. Sonuç, tam ekran bir
          lightbox'ta beklenenden belirgin biçimde küçük bir görsel.

          Artık fotoğraf katmanı `inset-0`, yani viewport'un tamamı;
          kontroller onun ÜSTÜNDE yüzüyor. Okunabilirlikleri için
          fotoğrafın kendisine değil, kontrolün arkasındaki küçük cam
          çiplere güveniyoruz — üst/alt degrade koymak fotoğrafın kenarını
          karartır ve "tam ekran" hissini geri alırdı.
        */}
        <div
          className="relative h-svh w-svw"
          {...swipeHandlers(
            () => step(-1),
            () => step(1),
          )}
        >
          {/*
            KOMŞU FOTOĞRAFLAR AĞAÇTA KALIYOR — gri bekleme ekranının çözümü.

            ⚠️ ÖNCEKİ HÂLİN SORUNU: `AnimatePresence` her indeks için YENİ
            bir `<Image>` monte ediyordu. next/image varsayılan olarak
            tembel yüklüyor, yani fotoğraf ancak TIKLANDIKTAN SONRA
            istenmeye başlıyordu. 1920px genişlikte yeniden boyutlanan bir
            kare gelene kadar ekranda koyu zeminden başka bir şey yoktu —
            "griye dönüp yavaş yükleniyor" denen şey buydu. Otuz fotoğraflu
            bir ilanda her ok tıklaması bu bekleme demekti.

            ÇÖZÜM: yalnızca aktif kare değil, BİR ÖNCEKİ ve BİR SONRAKİ de
            monte kalıyor (`loading="eager"`). Kullanıcı oka bastığında
            hedef kare çoktan indirilmiş ve çözülmüş oluyor; geçiş ağ
            beklemiyor.

            NEDEN SADECE ±1: otuz fotoğrafı birden monte etmek, gereksiz
            yere onlarca megabaytlık istek demek. İleri/geri gezinme için
            gereken tek şey komşular; pencere bu yüzden üç kare.

            NEDEN KAYDIRMA DEĞİL ÇAPRAZ GEÇİŞ: üç katman da aynı anda
            duruyor, dolayısıyla "giren" karenin bir yerden kayarak gelmesi
            için önce görünmez hâlde yana itilmesi gerekirdi — bu da tam
            olarak kaçındığımız yeniden yerleşimi geri getirirdi. Saf
            opaklık geçişi 0.22sn'de tamamlanıyor ve hiçbir karede boşluk
            göstermiyor.
          */}
          {images.map((image, index) => {
            const isActive = index === activeIndex;
            const isNeighbour =
              index === (activeIndex + 1) % total ||
              index === (activeIndex - 1 + total) % total;

            /* Pencere dışı kareler ağaçta yok — bellek ve ağ için. */
            if (!isActive && !isNeighbour) return null;

            return (
              <motion.div
                key={image.src}
                initial={false}
                animate={{ opacity: isActive ? 1 : 0 }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.22, ease: EASE_OUT_EXPO }
                }
                /* Komşular görünmez ama ağaçta: tıklamayı yakalamamalılar. */
                className="absolute inset-0 pointer-events-none"
                aria-hidden={!isActive}
              >
                <Image
                  src={image.src}
                  /* Yalnızca aktif kare adlandırılıyor; üç görselin birden
                     duyurulması ekran okuyucuda gürültü olurdu. */
                  alt={isActive ? image.alt : ""}
                  fill
                  quality={85}
                  sizes="100vw"
                  /* Tembel yükleme burada tam olarak istemediğimiz şey. */
                  loading="eager"
                  className="object-contain"
                />
              </motion.div>
            );
          })}

          {/* ------------------------------------------------------ KAPAT */}
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label={t("properties.galleryClose")}
            className="absolute right-4 top-4 z-10 inline-flex size-11 items-center justify-center rounded-sm border border-white/25 bg-ink/40 text-shell backdrop-blur-md transition-colors hover:bg-ink/70 sm:right-6 sm:top-6"
          >
            <X className="size-5" strokeWidth={1.5} aria-hidden="true" />
          </button>

          {/* ------------------------------------------------------ OKLAR */}
          {/*
            Alt ortadan YANLARA taşındı. Altta yan yana duran iki ok
            "oynatıcı kontrolü" gibi okunuyordu; kenarlarda, dikeyde ortada
            duran oklar fotoğrafın kendisini işaret ediyor ve imleç zaten
            oradayken tıklama mesafesi de kısalıyor.

            Telefonda gizli: orada gezinme parmakla yapılıyor (swipe) ve
            44px'lik iki daire küçük ekranda fotoğrafın üçte birini kapatıyor.
          */}
          {total > 1 ? (
            <>
              <LightboxArrow
                side="left"
                label={t("properties.previousPhoto")}
                onClick={() => step(-1)}
              />
              <LightboxArrow
                side="right"
                label={t("properties.nextPhoto")}
                onClick={() => step(1)}
              />
            </>
          ) : null}

          {/* ------------------------------------------- SAYAÇ + AÇIKLAMA */}
          {/*
            Sayaç alt ortada, tek bir cam çip içinde. Açıklama metni aynı
            çipin altında ve `sm`den itibaren görünür: telefonda alt şeridin
            fotoğrafı yemesini istemiyoruz, ama erişilebilirlik açısından
            kaybolmuyor — `alt` zaten `<Image>` üzerinde.
          */}
          <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-3 px-6">
            {/*
              MOBİL GEZİNME — sayacın iki yanında, fotoğrafın ALTINDA.

              Yan taraftaki `LightboxArrow`lar `sm` altında gizli ve öyle
              kalıyor: telefonda 48px'lik iki daire fotoğrafın üçte birini
              kapatıyordu. Ama tek gezinme yolunun kaydırma olması da
              yeterli değildi — dokunmatik olmayan girdilerde (harici klavye,
              anahtar erişimi) ya da kaydırmayı fark etmeyen kullanıcı için
              görünür bir kontrol yok demekti.

              Çözüm: okları fotoğrafın üstünden alıp alt şeride, sayacın
              iki yanına koymak. Görünür ve kolay dokunulur (44px), üstelik
              görüntüyü hiç kapatmıyor.

              `pointer-events-auto`: kapsayıcı `pointer-events-none` —
              fotoğrafa yapılan dokunuşlar şeridin altından geçsin diye.
              Düğmelerin kendisi bunu geri açıyor.
            */}
            <div className="pointer-events-auto flex items-center gap-3 sm:hidden">
              {total > 1 ? (
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label={t("properties.previousPhoto")}
                  className="inline-flex size-11 items-center justify-center rounded-full border border-white/25 bg-ink/50 text-shell backdrop-blur-md transition-colors active:bg-ink/80"
                >
                  <ChevronLeft className="size-5" strokeWidth={1.5} aria-hidden="true" />
                </button>
              ) : null}

              <p className="rounded-sm bg-ink/45 px-4 py-2 font-display text-sm tabular-nums text-shell backdrop-blur-md">
                {activeIndex + 1} / {total}
              </p>

              {total > 1 ? (
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label={t("properties.nextPhoto")}
                  className="inline-flex size-11 items-center justify-center rounded-full border border-white/25 bg-ink/50 text-shell backdrop-blur-md transition-colors active:bg-ink/80"
                >
                  <ChevronRight className="size-5" strokeWidth={1.5} aria-hidden="true" />
                </button>
              ) : null}
            </div>

            {/* `sm` ve üstünde sayaç tek başına — oklar yanlarda yüzüyor. */}
            <p className="hidden rounded-sm bg-ink/45 px-4 py-2 font-display text-sm tabular-nums text-shell backdrop-blur-md sm:block">
              {activeIndex + 1} / {total}
            </p>
            <p className="hidden max-w-xl text-center text-xs leading-relaxed text-shell/70 sm:block">
              {active.alt}
            </p>
          </div>
        </div>
      </dialog>
    </div>
  );
}

/**
 * Lightbox gezinme oku. Fotoğrafın üstünde yüzen cam bir mercek —
 * hero'daki okla aynı dil, aynı gerekçe (bkz. home-hero.tsx).
 */
function LightboxArrow({
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
        "absolute top-1/2 z-10 hidden size-12 -translate-y-1/2 items-center justify-center",
        "rounded-full border border-white/25 bg-ink/40 text-shell backdrop-blur-md",
        "transition-colors hover:border-white/60 hover:bg-ink/70 sm:inline-flex",
        side === "left" ? "left-4 sm:left-6" : "right-4 sm:right-6",
      )}
    >
      <Icon className="size-5" strokeWidth={1.5} aria-hidden="true" />
    </button>
  );
}

function GalleryTile({
  image,
  onOpen,
  label,
  sizes,
  className,
  priority = false,
  children,
}: {
  image: VillaImage;
  onOpen: () => void;
  label: string;
  sizes: string;
  className?: string;
  priority?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label}
      className={cn(
        "group relative block w-full overflow-hidden bg-shell-deep",
        className,
      )}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        /*
          Kapak görseli ilan sayfasının LCP öğesi: erken yüklenir.

          `priority` → `loading`/`fetchPriority`. Next 16'da `priority`
          KULLANIMDAN KALDIRILDI (node_modules/next/dist/docs → image.md,
          v16.0.0 satırı) ve sessizce etkisiz kalıyordu; ilan sayfalarında
          terminale düşen "Image ... was detected as the Largest Contentful
          Paint (LCP). Please add the `loading=\"eager\"` property" uyarısının
          sebebi buydu. Dokümanın kendi tavsiyesi de `preload` yerine bu
          ikilisini kullanmak.
        */
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        quality={priority ? 85 : 75}
        sizes={sizes}
        className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
      />
      {children}
    </button>
  );
}
