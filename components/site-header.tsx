"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { LocaleLink as Link } from "@/components/locale-link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Menu, Phone, X } from "lucide-react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/cn";
import { stripLocale } from "@/lib/locale";
import {
  headerNav,
  siteConfig,
  type HeaderNavItem,
  type HeaderNavLink,
} from "@/lib/site";
import { useSettings } from "@/components/settings-provider";
import { useT } from "@/components/translation";

/** Grup mu, düz bağlantı mı — tip daraltma tek yerde. */
function isGroup(
  item: HeaderNavItem,
): item is { label: string; children: readonly HeaderNavLink[] } {
  return "children" in item;
}

/**
 * "İstemcide miyiz" — `useState` + `useEffect` ikilisi OLMADAN.
 *
 * Portal yalnızca tarayıcıda kurulabilir (`react-dom/server` createPortal'ı
 * desteklemez), yani sunucu render'ında `null` dönmemiz gerekiyor. Klasik
 * çözüm `const [mounted, setMounted] = useState(false)` + effect'te
 * `setMounted(true)`; ama bu, effect içinde setState demek — projedeki
 * react-hooks kuralının yakaladığı ve fazladan bir render turu açan kalıp.
 *
 * `useSyncExternalStore` aynı bilgiyi durum güncellemesi olmadan veriyor:
 * sunucu anlık görüntüsü `false`, istemcininki `true`. Abone olunacak bir
 * şey yok, o yüzden abonelik fonksiyonu boş bir temizleyici döndürüyor.
 */
const noopSubscribe = () => () => {};
const useIsClient = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

export function SiteHeader() {
  const pathname = usePathname();

  /*
    Telefon numarası artık `data/settings.json`den geliyor, koddan değil.
    Bağlam üzerinden okunuyor çünkü bu bir istemci bileşeni ve
    `lib/settings.ts` `server-only` — sağlayıcıyı `(site)/layout.tsx`
    dolduruyor.
  */
  const { contact } = useSettings();
  /*
    `tag` başlığın <header> düğümüne yazılıyor: gezinme ÇEVRİLİ, sayfa
    gövdesi henüz değil — dolayısıyla dil işareti belgenin köküne değil,
    gerçekten dil değiştiren düğüme ait (bkz. components/translation.tsx).
  */
  const { t, tNav, tag } = useT();
  const reduceMotion = useReducedMotion();

  /**
   * Menünün açık olduğu rotayı tutuyoruz, boolean değil: rota değişir değişmez
   * `isOpen` kendiliğinden false olur. useEffect + setState ile "menüyü kapat"
   * kalıbının aksine fazladan render turu yaratmaz.
   */
  const [openOnPath, setOpenOnPath] = useState<string | null>(null);
  const isOpen = openOnPath === pathname;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  /**
   * ANA SAYFA MI — üç dilde birden.
   *
   * `stripLocale` dil önekini söküyor, yani /tr ve /ru da "/" olarak
   * geliyor. Elle `["/", "/tr", "/ru"].includes(pathname)` yazmak aynı
   * bilgiyi ikinci bir yerde tutmak olurdu: dördüncü bir dil eklendiği gün
   * `ROUTE_LOCALES` güncellenir, burası sessizce eskir ve o dilin ana
   * sayfasında başlık yanlış varyantı gösterir.
   *
   * `/en` ayrıca kontrol ediliyor: vekil onu "/"a 308 ile yönlendirdiği için
   * tarayıcı normalde orada durmuyor, ama `stripLocale` varsayılan dilin
   * önekini KASITLI olarak sökmüyor (kanonik yol öneksizdir). Yönlendirme
   * bir gün kalkarsa bu satır olmadan ana sayfa kendini tanıyamazdı.
   *
   * ⚠️ HİDRASYON: burada `useEffect`/`isClient` gerekmiyor ve eklenmesi
   * ZARARLI olurdu. `usePathname()` App Router'da sunucu render'ında da
   * doğru yolu döndürüyor, yani iki taraf aynı ağacı üretiyor. İstemciye
   * ertelenmiş bir kontrol, ilk karede telefon düğmesini gösterip sonra
   * seçiciyle değiştirirdi — görünür bir sıçrama.
   */
  const canonicalPath = stripLocale(pathname);
  const isHome = canonicalPath === "/" || canonicalPath === "/en";

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  /**
   * CAM → OPAK GEÇİŞİ.
   *
   * `overHero` false başlıyor: hero'su olmayan her sayfa (ve JS gelmeden
   * önceki ilk kare) DOĞRUDAN opak. Ters varsayım tehlikeli olurdu — hero'suz
   * bir sayfada saydam başlık, beyaz zemin üzerinde beyaz metin demek.
   *
   * Ölçüm `scrollY` eşiğiyle DEĞİL, hero'nun kendisi gözlenerek yapılıyor.
   * Eşik yazmak `h-[80vh] min-h-[34rem]` ifadesini JavaScript'te ikinci kez
   * hesaplamak olurdu; hero'nun yüksekliği değiştiği gün başlık sessizce
   * yanlış yerde renk değiştirirdi. IntersectionObserver gerçek kutuyu
   * ölçtüğü için böyle bir ikilik doğmuyor.
   *
   * `rootMargin` üstten -1px: hero'nun ALT kenarı başlığın altından çıktığı
   * anda kesişim biter ve opak duruma geçilir.
   */
  const headerRef = useRef<HTMLElement>(null);
  const [overHero, setOverHero] = useState(false);

  /*
    Rota değişince OPAK'a dön. Effect içinde `setOverHero(false)` çağırmak
    ardışık render'lara yol açıyordu (react-hooks/set-state-in-effect);
    render sırasında düzeltmek ise React'in türetilmiş durum kalıbı ve
    aynı dosyada zaten `openOnPath` için kullanılan yaklaşımla aynı çizgide.

    Yön önemli: varsayılan DAİMA opak. Yeni sayfada hero varsa gözlemci onu
    bir kare sonra cama çevirir; hero yoksa hiçbir şey olmaz ve başlık opak
    kalır. Ters kurgu (varsayılan cam) hero'suz bir sayfada beyaz zemin
    üstünde beyaz metin riski taşırdı.
  */
  /**
   * Masaüstü açılır menüsü ve mobil akordeon — ikisi de açık olan GRUBUN
   * etiketini tutuyor, boolean değil. İleride ikinci bir grup eklenirse
   * (örneğin "Areas") aynı durum ikisini birden yönetir ve biri açılınca
   * diğeri kendiliğinden kapanır.
   */
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const [renderedPath, setRenderedPath] = useState(pathname);
  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    setOverHero(false);
    /* Rota değişince açılır menü kapanır — yeni sayfanın üstünde asılı kalmasın. */
    setOpenGroup(null);
  }

  useEffect(() => {
    const hero = document.querySelector("[data-hero]");
    if (!hero) return;

    let observer: IntersectionObserver | null = null;

    /*
      `rootMargin` başlığın ÖLÇÜLEN yüksekliği kadar yukarı çekiliyor.
      -1px kullanılsaydı hero tamamen ekrandan çıkana dek cam durum sürerdi;
      son ~100px boyunca başlık, altındaki BEYAZ bölümün üstünde saydam
      kalırdı — beyaz zeminde beyaz metin. Bu değerle geçiş tam olarak
      hero'nun alt kenarı başlığın alt kenarına ulaştığında oluyor.

      Yükseklik sabit yazılmıyor çünkü kırılma noktasıyla değişiyor
      (h-24 → lg:h-28); ölçüp kullanmak iki yerde birden güncelleme
      gerektiren bir sabitten daha güvenli.
    */
    const connect = () => {
      observer?.disconnect();
      const offset = headerRef.current?.offsetHeight ?? 96;

      observer = new IntersectionObserver(
        ([entry]) => setOverHero(entry.isIntersecting),
        { rootMargin: `-${offset}px 0px 0px 0px`, threshold: 0 },
      );
      observer.observe(hero);
    };

    connect();
    window.addEventListener("resize", connect);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", connect);
    };
    /* Rota değişince yeni sayfada hero var mı diye yeniden bakılır. */
  }, [pathname]);

  /* Çekmece açıkken başlık daima opak: cam bir başlık perdenin üstünde yüzerdi. */
  const glass = overHero && !isOpen;

  /* Portal yalnızca tarayıcıda kurulabilir — bkz. useIsClient. */
  const isClient = useIsClient();

  /**
   * Menü açıkken arka planın kaydırılmasını engelle, Escape ile kapat ve
   * ODAĞI PANELİN İÇİNDE TUT.
   *
   * Odak tuzağı akordeon sürümünde gerekli değildi: panel sayfanın akışının
   * bir parçasıydı, arkasındaki bağlantılar hâlâ meşru hedeflerdi. Artık
   * panel `aria-modal="true"` taşıyan bir katman ve arkasındaki her şey
   * perdeyle örtülü. Tuzak olmasaydı Tab'a basan kullanıcı odağı GÖRÜNMEZ
   * bağlantılara gönderir, ekran okuyucu "kapalı" bir arayüzü okumaya
   * başlar ve geri dönmenin yolu kalmazdı.
   */
  useEffect(() => {
    if (!isOpen) return;

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    /* Açılışta odak panele girer; yoksa odak hâlâ başlıktaki düğmededir. */
    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([tabindex="-1"]), input, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((node) => node.offsetParent !== null);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenOnPath(null);
        return;
      }

      if (event.key !== "Tab") return;

      const nodes = focusables();
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;

      /* Uçlarda döngü: son elemandan Tab başa, ilkinden Shift+Tab sona. */
      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!panelRef.current?.contains(active as Node)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  /**
   * Kapanışta odak tetikleyiciye döner — ama YALNIZCA menü bir bağlantıya
   * tıklanarak değil, kapatılarak kapandıysa. Rota değiştiğinde `isOpen`
   * kendiliğinden false oluyor (bkz. `openOnPath`); o durumda odağı
   * başlıktaki hamburgere zorlamak, kullanıcıyı yeni sayfanın başına değil
   * bir düğmeye kilitler.
   */
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !isOpen && openOnPath === null) {
      triggerRef.current?.focus();
    }
    wasOpen.current = isOpen;
  }, [isOpen, openOnPath]);

  return (
    <header
      ref={headerRef}
      lang={tag}
      /*
        İki durum, tek eleman — koşullu render DEĞİL, sınıf değişimi. Aynı
        DOM düğümü kaldığı için `transition-colors` renkleri gerçekten
        interpole edebiliyor; iki ayrı başlık render edilseydi geçiş yerine
        ani bir takas olurdu.

        CAM DURUMU: `bg-sea-deep/30` + `backdrop-blur-xl` tek başına yetmiyor —
        hero fotoğrafının parlak gökyüzü bölgesinde beyaz menü metni okunmaz
        hâle geliyordu. Bu yüzden alta doğru sönen ikinci bir karartma
        (`before:` katmanı) var: metnin oturduğu şeridi koyultuyor, fotoğrafın
        geri kalanını açık bırakıyor.

        `duration-500`: sayfanın en üstüne dönerken de aynı yumuşaklıkta geri
        dönmesi için. Daha kısa süreler renk değişimini "çakma" gibi gösteriyor.
      */
      className={cn(
        "sticky top-0 z-50 transition-colors duration-500 ease-out",
        "before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:transition-opacity before:duration-500",
        "before:bg-gradient-to-b before:from-ink/70 before:to-transparent",
        /*
          OPAK DURUM ARTIK KREM, KOYU DEĞİL.

          Eskiden başlık her koşulda `bg-sea-deep` idi — sayfanın en üstünde
          duran kalın, koyu bir bant. Londra'nın vitrin ajanslarında (Savills,
          Knight Frank, Domus Nova) üst bant neredeyse görünmezdir: kâğıt
          renginde, ince bir çizgiyle biter ve dikkati içeriğe bırakır.

          Cam durumu KORUNUYOR ve hâlâ gerekli: hero fotoğrafının üstünde
          krem bir bant manzarayı kesip sayfayı ikiye bölerdi. Yani başlık
          iki kimlik taşıyor — fotoğrafın üstünde şeffaf ve açık metinli,
          fotoğraf bitince krem ve antrasit metinli. Geçişi zaten var olan
          IntersectionObserver yönetiyor; tek değişen renkler.
        */
        glass
          ? "border-b border-white/10 bg-sea-deep/25 text-shell backdrop-blur-xl before:opacity-100"
          : "border-b border-line bg-shell/95 text-ink backdrop-blur-md before:opacity-0",
      )}
    >
      {/*
        MOBİL DÜZEN: logo SOLDA, telefon ve hamburger SAĞDA.

        Önceki düzende hamburger soldaydı ve logo ortalanıyordu; gerekçesi
        "soldan sağa okuma sırası"ydı. Artık başparmak ergonomisi kazanıyor:
        telefon tek elle tutulurken ekranın üst-sağ köşesi sol köşesinden
        belirgin şekilde daha kolay ulaşılır, gezinme de en sık kullanılan
        kontrol. Logo sola dayanınca da her kırılma noktasında aynı yerde
        duruyor — ortalanmış logo yalnızca mobilde ortadaydı.

        NOT: düğme sağda, çekmece SOLDAN açılıyor. Bilinçli bir istek;
        yaygın kalıp ikisinin aynı tarafta olmasıdır ve dokunulan yerden
        çıkmayan bir panel yön duygusunu bir miktar zorlar.

        xl üstünde hamburger kaybolur ve tam menü açılır.
      */}
      {/*
        YÜKSEKLİK: 5rem → 6rem (mobil), 5rem → 7rem (masaüstü).

        Yığılmış logo dikeyde iki satır metin taşıyor; eski 4rem'lik mobil
        başlıkta kelime işareti okunamayacak kadar küçülüyordu. `items-center`
        korunuyor, dolayısıyla gezinme bağlantıları artan yükseklikte de
        dikeyde ortalı kalıyor.
      */}
      <div className="container-page flex h-24 items-center gap-3 sm:gap-5 lg:h-28">
        <Link
          href="/"
          aria-label={`${siteConfig.name} — home`}
          className="shrink-0"
        >
          {/*
            YIĞILMIŞ DİZİLİM — footer ile aynı (üçgen üstte, kelime altında).

            OKUNURLUK. "Properties" satırı viewBox içinde 20 birim, yani
            ekranda `20/viewBoxYüksekliği × yükseklik` piksel eder. Kelime
            işareti çatıya yaklaştırılıp viewBox 192'den 166'ya inince
            (logo.tsx) aynı `h-*` değerleri daha büyük tipografi veriyor:
                h-20          (80px) → 9.6px   (mobil + sm)
                lg:h-[5.5rem] (88px) → 10.6px
            Karşılaştırma: yatay dizilim h-11'de 9.6px veriyordu.

            ⚠️ MOBİL KADEMESİ h-16'DAN h-20'YE ÇIKARILDI (+%25). Eski değer
            "Properties" satırını 7.7px'te bırakıyordu — bir marka adının
            okunabilirlik eşiğinin altında.

            ÜST BANT AŞILMIYOR, çünkü BU ÖLÇÜ ZATEN KANITLI: bant `h-24`
            (96px) ve `sm`den itibaren logo hep 80px'ti. Mobil artık aynı
            oranı kullanıyor — 96px'lik bantta 8px'lik dikey pay.

            ⚠️ 360px ALTINDA ESKİ ÖLÇÜ KORUNUYOR — ve bu ölçülerek bulundu.

            Sağdaki grup telefon düğmesi DEĞİL: mobilde dil/para birimi
            anahtarı (~104px) + menü düğmesi (44px) + `gap-2` (8px) = 156px.
            `gap-3` (12px) ile birlikte logoya kalan genişlik:

                320px ekran → içerik 272px → logoya 104px
                360px ekran → içerik 312px → logoya 144px

            Logo `w-auto` ile oranını koruyor ve ekranda ~1.6 en/boy
            veriyor (viewBox 280×166, artı SVG'nin iç boşluğu):

                h-16 (64px) → ~102px      h-20 (80px) → ~128px

            Yani 320px'te yalnızca h-16 sığıyor; h-20 menü düğmesini
            ekranın dışına itiyordu (render edilip görüldü, 6px taşma).
            360px'ten itibaren 128px rahatça giriyor, 16px pay kalıyor.

            Bu yüzden artış `min-[360px]:` ile sınırlandı: en dar cihazlar
            bugünkü davranışını AYNEN koruyor, geri kalan her telefon
            %25 daha büyük bir logo görüyor.
          */}
          <Logo
            variant="stacked"
            decorative
            className="h-16 w-auto min-[360px]:h-20 lg:h-[5.5rem]"
          />
        </Link>

        {/*
          MASAÜSTÜ GEZİNMESİ.

          Dokuz düz bağlantı yerine beş öğe; beşincisi bir grup. Kırılma
          noktası `xl` olarak KALIYOR — menü kısaldı ama logo + telefon +
          para birimi anahtarı hâlâ geniş, altında sıkışıyor.
        */}
        <nav aria-label={t("header.primaryNavAria")} className="hidden xl:block">
          <ul className="flex items-center gap-x-5 2xl:gap-x-7">
            {headerNav.map((item) =>
              isGroup(item) ? (
                <NavGroup
                  key={item.label}
                  item={item}
                  glass={glass}
                  open={openGroup === item.label}
                  onOpen={() => setOpenGroup(item.label)}
                  onClose={() => setOpenGroup(null)}
                  isActive={isActive}
                  reduceMotion={Boolean(reduceMotion)}
                />
              ) : (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "whitespace-nowrap text-[0.8125rem] uppercase tracking-[0.1em] transition-colors",
                      isActive(item.href)
                        ? "text-gold-deep"
                        : glass
                          ? "text-shell/85 hover:text-gold"
                          : "text-ink-70 hover:text-sea",
                    )}
                  >
                    {tNav(item.label)}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          {/*
            DİL + PARA BİRİMİ — tek seçici.

            `sm` altında gizli ve YERİNE ÇEKMECEDE duruyor (aşağıya bakın):
            telefonda logo ve iki düğmeyle aynı satıra sığmıyor. Hiçbir
            kırılma noktasında ulaşılamaz kalmıyor — çekmece `xl` altında her
            yerde açılabiliyor.
          */}
          {/*
            ANA SAYFADA TELEFONUN YERİNİ DİL SEÇİCİ ALIYOR.

            Seçici zaten bu kümede ve zaten telefonun SOLUNDA duruyordu;
            ana sayfada telefon basılmayınca kendiliğinden o yuvaya —
            hamburgerin hemen soluna — geçiyor. Yeni bir örnek eklemek
            gerekmedi: aynı düğümün görünürlüğü değişiyor, yani açık liste,
            klavye odağı ve seçili değer rota değişiminde korunuyor.

            ⚠️ `hidden sm:block` KOŞULA BAĞLANDI. Diğer sayfalarda olduğu
            gibi kalsaydı, ana sayfada 640px altında sağ kümede telefonun
            bıraktığı boşluğu dolduran hiçbir şey olmazdı: logo ile
            hamburger arasında kasıtsız bir aralık. Ana sayfada seçici her
            genişlikte görünür — 375px'te logo (~120px), seçici (~100px) ve
            hamburger (44px) aralıklarla birlikte sığıyor.
          */}
          <LocaleSwitcher
            tone={glass ? "dark" : "light"}
            className={isHome ? "block" : "hidden sm:block"}
          />

          {/*
            Telefon CTA'sı ana sayfada HİÇ BASILMIYOR — `hidden` ile
            gizlenmiyor. Gizlenmiş bir bağlantı ekran okuyucuda ve sekme
            sırasında var olmaya devam ederdi (`display:none` çoğu durumda
            kaldırır ama bunu bir sınıfın doğru yazılmasına bağlamak
            gereksiz bir risk); koşullu render'da böyle bir belirsizlik yok.

            Numara kaybolmuyor: çekmecenin alt bloğunda iki hat da duruyor
            ve çekmece her kırılma noktasında açılabiliyor.
          */}
          {isHome ? null : (
            <a
              href={`tel:${contact.phoneE164}`}
              aria-label={t("header.callAria", { phone: contact.phoneDisplay })}
              title={contact.phoneDisplay}
              className={cn(
                "inline-flex size-11 items-center justify-center rounded-sm border transition-colors md:h-auto md:w-auto md:gap-2 md:px-4 md:py-2.5 md:font-sans md:text-[0.6875rem] md:font-semibold md:uppercase md:tracking-[0.14em] xl:px-3.5",
                glass
                  ? "border-shell/40 text-shell hover:border-gold hover:text-gold"
                  : "border-sea-deep bg-sea-deep text-shell hover:border-gold hover:bg-gold hover:text-ink",
              )}
            >
              <Phone className="size-4 shrink-0" aria-hidden="true" />
              <span className="hidden whitespace-nowrap md:inline xl:hidden">
                {contact.phoneDisplay}
              </span>
            </a>
          )}

          {/* Sağ kümenin EN SAĞI: üst-sağ köşe. */}
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpenOnPath(isOpen ? null : pathname)}
            aria-expanded={isOpen}
            aria-controls="mobile-nav"
            aria-label={isOpen ? t("header.closeMenu") : t("header.openMenu")}
            className={cn(
              "inline-flex size-11 shrink-0 items-center justify-center rounded-sm border transition-colors xl:hidden",
              glass
                ? "border-white/25 hover:border-gold hover:text-gold"
                : "border-line hover:border-sea hover:text-sea",
            )}
          >
            {/* İkon geçişi de animasyonlu: menü durumu görsel olarak onaylanır. */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isOpen ? "close" : "open"}
                initial={reduceMotion ? false : { rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={reduceMotion ? undefined : { rotate: 90, opacity: 0 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="flex"
              >
                {isOpen ? (
                  <X className="size-5" aria-hidden="true" />
                ) : (
                  <Menu className="size-5" aria-hidden="true" />
                )}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/*
        MOBİL ÇEKMECE.

        Eskiden başlığın altına açılan bir akordeondu (`height: auto`).
        Artık SAĞDAN giren, ekranın %78'ini kaplayan bir panel; solda kalan
        şerit yarı saydam koyu bir perde. Perde yalnızca dekor değil: hem
        "arkada bir sayfa var" bilgisini verir hem de kapatmak için doğal
        bir dokunma hedefidir.

        YÖN DÜZELTİLDİ: panel önce soldan giriyordu, tetikleyici ise sağ üst
        köşedeydi. Dokunulan yerden çıkmayan bir panel, ekranın öbür ucunda
        beliren bir hareket demek — kullanıcı gözüyle dokunuşu arasındaki
        bağı kaybediyordu. Artık ikisi aynı kenarda: panel parmağın altından
        açılıyor.

        Genişlik `max-w-sm` ile sınırlı — büyük telefon/küçük tablette %78,
        24rem'i aşınca çekmece değil "yarım sayfa" gibi görünmeye başlıyor.

        SÜRE: perde 0.4s, panel 0.55s. Panel bilinçli olarak daha yavaş ve
        `easeOut` benzeri bir eğriyle geliyor — hızlı başlayıp yavaşlayarak
        oturması ağırlık hissi veriyor. Kapanış (0.4s) açılıştan kısa:
        kullanıcı kapatmaya karar verdiğinde beklemek istemez, bu yüzden
        simetrik süre kullanmıyoruz.

        ⚠️ NEDEN PORTAL — VE NEDEN BU ŞART.

        Çekmece `position: fixed` ve `inset-0`, yani viewport'u kaplaması
        gerekiyor. Ama `fixed` her zaman viewport'a göre konumlanmaz:
        `transform`, `filter`, `will-change` VEYA `backdrop-filter` taşıyan
        bir ata, sabit konumlu torunları için KAPSAYAN BLOK olur.

        Başlığa buzlu cam görünümü için `backdrop-blur` eklendiğinde tam
        olarak bu oldu: çekmece artık viewport'u değil BAŞLIK KUTUSUNU
        referans alıyor, `inset-0` da 844px yerine 96px yüksekliğe
        çözülüyordu. Ölçüldü: panel 304×96px'lik bir şeride sıkışmıştı.

        Sınıfı geri almak semptomu geçirirdi ama tuzağı yerinde bırakırdı —
        başlığa ileride eklenecek herhangi bir filtre/transform aynı hatayı
        sessizce geri getirir. Paneli `document.body`ye portallamak sorunu
        yapısal olarak bitiriyor: artık başlığın DOM alt ağacında değil.
      */}
      {isClient
        ? createPortal(
            <AnimatePresence>
              {isOpen ? (
                <div className="fixed inset-0 z-50 xl:hidden">
            {/* -------------------------------------------------- PERDE */}
            <motion.button
              type="button"
              tabIndex={-1}
              aria-label="Close menu"
              onClick={() => setOpenOnPath(null)}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute inset-0 w-full cursor-default bg-ink/60 backdrop-blur-[2px]"
            />

            {/* ------------------------------------------------ ÇEKMECE */}
            <motion.nav
              id="mobile-nav"
              ref={panelRef}
              aria-label={t("header.mobileNavAria")}
              role="dialog"
              aria-modal="true"
              initial={reduceMotion ? false : { x: "100%" }}
              animate={{ x: 0 }}
              exit={reduceMotion ? undefined : { x: "100%" }}
              transition={{
                duration: 0.55,
                /* Hızlı başlayıp uzun uzun yavaşlayan eğri: "kayarak oturma". */
                ease: [0.16, 1, 0.3, 1],
              }}
              className="absolute inset-y-0 right-0 flex w-[78%] max-w-sm flex-col border-l border-line bg-shell text-ink shadow-panel"
            >
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-6 sm:h-20">
                <Logo variant="horizontal" decorative className="h-8 w-auto" />
                {/*
                  Çekmecenin İÇİNDE de bir kapatma düğmesi var: tetikleyici
                  ekranın öbür ucunda (sağ üstte) kaldı ve panel açıkken
                  perdenin altında. Kapatmak için oraya uzanmak gerekmemeli.
                */}
                <button
                  type="button"
                  onClick={() => setOpenOnPath(null)}
                  aria-label={t("header.closeMenu")}
                  className="-mr-2 inline-flex size-11 items-center justify-center text-ink-40 transition-colors hover:text-sea"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>

              <ul className="flex flex-1 flex-col overflow-y-auto px-6 py-2">
                {headerNav.map((item, index) => {
                  const key = isGroup(item) ? item.label : item.href;

                  /*
                    Grup, İÇİNDEKİ sayfalardan biri açıkken kendiliğinden
                    açılıyor: kullanıcı "Buying Process"teyken çekmeceyi
                    açtığında kapalı bir "Guides" başlığı görüp nerede
                    olduğunu kaybetmesin.
                  */
                  const groupHasActiveChild =
                    isGroup(item) && item.children.some((c) => isActive(c.href));
                  const expanded = isGroup(item)
                    ? (openAccordion ?? (groupHasActiveChild ? item.label : null)) ===
                      item.label
                    : false;

                  return (
                    <motion.li
                      key={key}
                      /* Bağlantılar da panelle AYNI yönden geliyor (sağdan). */
                      initial={reduceMotion ? false : { opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.45,
                        /*
                          Bağlantılar panelin ARKASINDAN kademeli geliyor:
                          panel 0.55s sürüyor, ilk bağlantı 0.12s'de başlıyor.
                          Hepsi aynı anda görünseydi panel bir "levha" gibi
                          akardı; kademe ona derinlik veriyor.
                        */
                        delay: reduceMotion ? 0 : 0.12 + index * 0.045,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      {isGroup(item) ? (
                        <>
                          {/*
                            AKORDEON BAŞLIĞI.

                            `<button>`, `<a>` değil: "Guides" bir sayfa değil,
                            bir kapsayıcı. Bağlantı gibi işaretlemek ekran
                            okuyucuya gidilecek bir yer sözü verir ve tıklayan
                            kullanıcı hiçbir yere gitmez.
                          */}
                          <button
                            type="button"
                            onClick={() =>
                              setOpenAccordion(expanded ? "" : item.label)
                            }
                            aria-expanded={expanded}
                            aria-controls={`nav-group-${item.label}`}
                            className={cn(
                              "flex w-full items-center justify-between gap-4 border-b border-line py-4 text-left font-display text-base font-semibold uppercase tracking-[0.06em] transition-colors hover:text-sea",
                              groupHasActiveChild ? "text-sea" : "text-ink",
                            )}
                          >
                            {tNav(item.label)}
                            <ChevronDown
                              aria-hidden="true"
                              className={cn(
                                "size-4 shrink-0 transition-transform duration-300",
                                expanded && "rotate-180",
                              )}
                            />
                          </button>

                          <AnimatePresence initial={false}>
                            {expanded ? (
                              <motion.ul
                                id={`nav-group-${item.label}`}
                                initial={
                                  reduceMotion ? false : { height: 0, opacity: 0 }
                                }
                                animate={{ height: "auto", opacity: 1 }}
                                exit={
                                  reduceMotion
                                    ? undefined
                                    : { height: 0, opacity: 0 }
                                }
                                transition={{
                                  duration: 0.32,
                                  ease: [0.16, 1, 0.3, 1],
                                }}
                                /* `overflow-hidden` şart: yükseklik animasyonu
                                   sırasında alt bağlantılar dışarı taşmasın. */
                                className="overflow-hidden"
                              >
                                {item.children.map((child) => (
                                  <li key={child.href}>
                                    <Link
                                      href={child.href}
                                      aria-current={
                                        isActive(child.href) ? "page" : undefined
                                      }
                                      className={cn(
                                        "block border-b border-line/60 py-3 pl-4 text-sm transition-colors hover:text-sea",
                                        isActive(child.href)
                                          ? "text-sea"
                                          : "text-ink-70",
                                      )}
                                    >
                                      {tNav(child.label)}
                                    </Link>
                                  </li>
                                ))}
                              </motion.ul>
                            ) : null}
                          </AnimatePresence>
                        </>
                      ) : (
                        <Link
                          href={item.href}
                          aria-current={isActive(item.href) ? "page" : undefined}
                          className={cn(
                            "block border-b border-line py-4 font-display text-base font-semibold uppercase tracking-[0.06em] transition-colors hover:text-sea",
                            isActive(item.href) ? "text-sea" : "text-ink",
                          )}
                        >
                          {tNav(item.label)}
                        </Link>
                      )}
                    </motion.li>
                  );
                })}

                </ul>

              {/*
                ÇEKMECE ALT BLOĞU — kaydırılan listenin DIŞINDA.

                Dil/para birimi seçicileri önce listenin son <li>'siydi. Sorun
                şu: liste `overflow-y-auto` taşıyor ve CSS'te bir eksen
                `visible` olmaktan çıkınca diğeri de `auto`ya düşer — yani
                mutlak konumlu açılır panel yatayda da KIRPILIYORDU. Blok
                buraya, `shrink-0` bir alt bölüme taşındı; panel artık
                hiçbir şeyi kesmeden yukarı doğru açılıyor.
              */}
              <div className="shrink-0 space-y-4 border-t border-line px-6 py-6">
                <LocaleSwitcher tone="light" layout="stacked" />
                <a
                  href={`tel:${contact.phoneE164}`}
                  className="flex items-center justify-center gap-2 bg-gold px-5 py-3 font-sans text-xs font-bold uppercase tracking-widest text-ink"
                >
                  <Phone className="size-4" aria-hidden="true" />
                  {contact.phoneDisplay}
                </a>
                {/*
                  İKİNCİ HAT — birincinin ALTINDA ama dolu bir düğme DEĞİL.

                  İki özdeş altın blok üst üste konulsaydı çekmecenin tek
                  birincil eylemi ikiye bölünürdü; ikinci numara çerçeveli
                  bir varyant olarak duruyor: aynı hizada, açıkça ikincil.
                */}
                {contact.phoneSecondaryDisplay && contact.phoneSecondaryE164 ? (
                  <a
                    href={`tel:${contact.phoneSecondaryE164}`}
                    className="flex items-center justify-center gap-2 border border-line px-5 py-3 font-sans text-xs font-bold uppercase tracking-widest text-ink transition-colors hover:border-sea hover:text-sea"
                  >
                    <Phone className="size-4" aria-hidden="true" />
                    {contact.phoneSecondaryDisplay}
                  </a>
                ) : null}
              </div>
              </motion.nav>
            </div>
          ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </header>
  );
}

/**
 * MASAÜSTÜ AÇILIR MENÜ.
 *
 * Üç ayrı açma yolu var ve üçü de gerekli:
 *
 *   1. HOVER — istenen davranış. Ama tek başına bırakılırsa klavye
 *      kullanıcısı menüye asla ulaşamaz.
 *   2. FOCUS — Tab ile tetikleyiciye gelindiğinde açılır, odak gruptan
 *      çıkınca kapanır. `onBlur` + `relatedTarget` ile ölçülüyor: odağın
 *      hâlâ grubun İÇİNDE olup olmadığına bakıyoruz, yoksa alt bağlantıya
 *      geçerken menü kendi altından kapanırdı.
 *   3. TIKLAMA — dokunmatik ekranda hover diye bir şey yok. Dizüstünde de
 *      bazı kullanıcılar tıklamayı bekler. `<button aria-expanded>` bu
 *      yüzden gerçek bir düğme.
 *
 * KAPANMA GECİKMESİ (110ms): tetikleyiciden menüye inerken imleç iki
 * eleman arasındaki boşluktan geçiyor. Gecikme olmasaydı menü tam
 * ulaşılacakken kapanırdı — "kaçan menü" hatası. `mt-3` boşluğu da
 * `pt-3`'lük görünmez bir köprüyle dolduruldu, ikisi birlikte hareketi
 * affediyor.
 */
function NavGroup({
  item,
  glass,
  open,
  onOpen,
  onClose,
  isActive,
  reduceMotion,
}: {
  item: { label: string; children: readonly HeaderNavLink[] };
  /** Başlık fotoğrafın üstünde mi — tetikleyicinin rengi buna bağlı. */
  glass: boolean;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  isActive: (href: string) => boolean;
  reduceMotion: boolean;
}) {
  const { tNav, tNavDescription } = useT();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(onClose, 110);
  };

  useEffect(() => cancelClose, []);

  const hasActiveChild = item.children.some((child) => isActive(child.href));

  return (
    <li
      className="relative"
      onMouseEnter={() => {
        cancelClose();
        onOpen();
      }}
      onMouseLeave={scheduleClose}
      onFocus={onOpen}
      onBlur={(event) => {
        /* Odak grubun içindeki başka bir öğeye geçtiyse kapatma. */
        if (!event.currentTarget.contains(event.relatedTarget as Node)) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !open) return;
        onClose();
        triggerRef.current?.focus();
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? onClose() : onOpen())}
        aria-expanded={open}
        aria-controls={`desktop-${item.label}`}
        className={cn(
          "inline-flex items-center gap-1.5 whitespace-nowrap text-[0.8125rem] uppercase tracking-[0.1em] transition-colors",
          open || hasActiveChild
            ? glass
              ? "text-gold"
              : "text-sea"
            : glass
              ? "text-shell/85 hover:text-gold"
              : "text-ink-70 hover:text-sea",
        )}
      >
        {tNav(item.label)}
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-3.5 transition-transform duration-300",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            id={`desktop-${item.label}`}
            initial={reduceMotion ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            /*
              `pt-3` görünmez köprü (yukarıdaki nota bakın); panelin kendi
              üst boşluğu değil, tetikleyici ile panel arasındaki fare
              yolunu kapatan şey.
            */
            className="absolute left-1/2 top-full z-50 w-80 -translate-x-1/2 pt-3"
          >
            {/*
              `rounded-2xl` AÇIKÇA yazılıyor: globals.css'teki taban kural
              `rounded` sınıfı taşımayan her elemanın köşesini sıfırlıyor.
              Yuvarlatma bu projede opt-in — ve açılır menü, kartlarla
              birlikte onu hak eden iki yüzeyden biri.

              Gölge markanın lacivertinden türetildi (16,62,96), nötr
              siyahtan değil: koyu başlığın altına düşen gri bir gölge
              kirli görünüyordu.
            */}
            <ul className="rounded-sm border border-line bg-white p-2 shadow-panel">
              {item.children.map((child) => (
                <li key={child.href}>
                  <Link
                    href={child.href}
                    aria-current={isActive(child.href) ? "page" : undefined}
                    className={cn(
                      "block rounded-sm px-4 py-3 transition-colors",
                      isActive(child.href)
                        ? "bg-sea-tint text-sea-deep"
                        : "hover:bg-shell-deep",
                    )}
                  >
                    <span className="block font-display text-sm font-semibold text-sea-deep">
                      {tNav(child.label)}
                    </span>
                    {child.description ? (
                      <span className="mt-1 block text-xs leading-relaxed text-ink-40">
                        {tNavDescription(child.href, child.description)}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  );
}
