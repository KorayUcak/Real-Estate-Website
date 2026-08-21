"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BedDouble,
  Building2,
  ChevronDown,
  Check,
  House,
  LandPlot,
  LayoutGrid,
  MapPin,
  Rows3,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { EASE_OUT_EXPO } from "@/components/reveal";
import { PropertyCard } from "@/components/property-card";
import { SelectMenu } from "@/components/select-menu";
import { cn } from "@/lib/cn";
import {
  BEDROOM_OPTIONS,
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  PRICE_STEP,
  SORT_OPTIONS,
  activeFilterCount,
  categoryOf,
  decodeFilters,
  decodeSort,
  defaultFilters,
  encodeFilters,
  filterVillas,
  priceBounds,
  sortVillas,
  type PropertyCategory,
  type PropertyFilters,
  type SortKey,
} from "@/lib/property-filters";
import { serviceAreas } from "@/lib/site";
import type { PropertyCardData } from "@/lib/property-card-data";
import { useT } from "@/components/translation";
import type { TranslationKey } from "@/lib/i18n";

/**
 * İlan tarayıcı — filtre çubuğu + animasyonlu ızgara.
 *
 * Sunucu bileşeni olan sayfa TÜM ilanları prop olarak verir; filtreleme
 * tamamen istemcide, ağ isteği olmadan yapılır. İki kazanç:
 *  1. `useSearchParams` kullanılmadığı için prerender iptali yaşanmaz,
 *     sayfa statik (SSG) kalır.
 *  2. Filtre değişimi anlıktır — spinner yok, sayfa yenilenmiyor.
 *
 * Ölçek notu: portföy bilerek kısa tutuluyor. Liste birkaç yüz ilana
 * çıkarsa bu bileşen sanallaştırma ile birlikte sunucu tarafı filtrelemeye
 * taşınmalıdır.
 */
/**
 * İlan gezgini.
 *
 * Prop olarak tam `Villa` DEĞİL, dar görünüm modeli alıyor: bu bir istemci
 * bileşeni ve aldığı her şey RSC payload'ı olarak sayfa kaynağına yazılıyor.
 * Tam nesne geçildiğinde 57 ilanın koordinatı kaynağa giriyordu, 21'i Miami.
 */

/**
 * Bir "sayfa" = 12 kart. Üç sütunlu ızgarada tam dört sıra, ikide altı;
 * her kırılma noktasında dolu bir dikdörtgen bırakıyor.
 */
const PAGE_SIZE = 12;
/**
 * "İstemcide miyiz" — portal yalnızca tarayıcıda kurulabilir.
 * Gerekçe ve `useSyncExternalStore` tercihi `site-header.tsx`te uzun uzun
 * yazılı; burada aynı kalıp tekrarlanıyor.
 */
const noopSubscribe = () => () => {};
const useIsClient = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

export function PropertyExplorer({ villas }: { villas: PropertyCardData[] }) {
  const { t } = useT();

  /** Mobil filtre çekmecesi — `sm` altında dört açılır kutunun yerine geçer. */
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const isClient = useIsClient();

  /**
   * GÖVDE KAYDIRMA KİLİDİ.
   *
   * ⚠️ ASIL HATA BUYDU. Çekmece açıkken sayfa ARKADA kaymaya devam
   * ediyordu: karartma katmanına ya da çekmecenin başlık/alt şeridine
   * yapılan her sürükleme altındaki ilan listesini kaydırıyordu. Kullanıcı
   * çekmeceyi kapattığında listenin bambaşka bir yerinde buluyordu kendini
   * — ekranda "düzen bozuldu" olarak görünen şey buydu.
   *
   * `overflow: hidden` TEK BAŞINA YETMİYOR: iOS Safari onu yok sayıyor ve
   * gövdeyi yine kaydırıyor. Güvenilir olan tek yöntem gövdeyi `position:
   * fixed` yapıp mevcut kaydırma konumunu negatif `top` olarak vermek;
   * kapanışta o konuma geri dönülüyor. Konum saklanmazsa çekmece her
   * açıldığında sayfa başa fırlar.
   */
  useEffect(() => {
    if (!mobileFiltersOpen) return;

    const { body } = document;
    const scrollY = window.scrollY;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";

    return () => {
      Object.assign(body.style, previous);
      /* `instant`: kilit kalkarken yumuşak kaydırma bir zıplama gibi görünür. */
      window.scrollTo({ top: scrollY, behavior: "instant" as ScrollBehavior });
    };
  }, [mobileFiltersOpen]);

  /**
   * Ekran `sm` üstüne çıkarsa çekmeceyi kapat.
   *
   * Çekmece `sm:hidden`; genişleyen bir viewport onu GÖRÜNMEZ yapardı ama
   * durum `true` kalır ve yukarıdaki effect gövdeyi kilitli tutardı —
   * kullanıcı hiçbir şey göremeden sayfayı kaydıramaz hâle gelirdi.
   */
  useEffect(() => {
    if (!mobileFiltersOpen) return;
    const query = window.matchMedia("(min-width: 640px)");
    const close = () => setMobileFiltersOpen(false);
    query.addEventListener("change", close);
    return () => query.removeEventListener("change", close);
  }, [mobileFiltersOpen]);
  const reduceMotion = useReducedMotion();
  const { format } = useLocale();
  const headingId = useId();

  const bounds = useMemo(() => priceBounds(villas), [villas]);

  /**
   * Derin link: `/properties#area=oludeniz&beds=3`.
   *
   * URL hash'i React'in dışında yaşayan bir durumdur; `useSyncExternalStore`
   * ile bağlanır. Effect içinde setState çağırmaya kıyasla farkı: sunucu
   * anlık görüntüsü ("hash yok" → tam liste) ile istemcinin ilk render'ı
   * çelişmez, fazladan bir render turu doğmaz ve geri/ileri tuşları da
   * kendiliğinden çalışır.
   */
  const hash = useSyncExternalStore(
    subscribeToHash,
    getHashSnapshot,
    getServerHashSnapshot,
  );

  const hashFilters = useMemo(
    () => decodeFilters(hash, bounds),
    [hash, bounds],
  );

  /**
   * Kullanıcı filtre çubuğuna dokunduğu andan itibaren seçim onundur —
   * `null` olduğu sürece hash'ten gelen değer geçerlidir.
   */
  const [userFilters, setUserFilters] = useState<PropertyFilters | null>(null);
  const filters = userFilters ?? hashFilters;

  const setFilters = useCallback(
    (
      update:
        | PropertyFilters
        | ((current: PropertyFilters) => PropertyFilters),
    ) => {
      setUserFilters((current) => {
        const base = current ?? hashFilters;
        return typeof update === "function" ? update(base) : update;
      });
    },
    [hashFilters],
  );

  /**
   * Sıralama filtrelerden AYRI bir durum: filtre "hangi ilanlar", sıralama
   * "hangi sırada". `PropertyFilters` içine sıkıştırılsaydı `filterVillas`
   * hiç kullanmadığı bir alanı taşımak zorunda kalırdı.
   *
   * Filtrelerle aynı hash sözleşmesini paylaşıyor (`#sort=price-asc`) ki
   * paylaşılan bir link yalnızca seçimi değil düzeni de taşısın.
   */
  const [userSort, setUserSort] = useState<SortKey | null>(null);
  const sort = userSort ?? decodeSort(hash);

  /**
   * IZGARA / LİSTE.
   *
   * Hash sözleşmesine BİLİNÇLİ olarak girmiyor. Filtre ve sıralama
   * paylaşılabilir olmalı — "Ovacık'ta 3+ yatak, ucuzdan pahalıya" bir
   * bağlantı olarak anlamlı. Görünüm tercihi ise kişisel bir konfor ayarı;
   * linki alan kişiye kendi tercihini değil göndericininkini dayatmak
   * için bir sebep yok.
   */
  const [view, setView] = useState<"grid" | "list">("grid");

  /*
    SIRALAMA DİLİMLEMEDEN ÖNCE. Ters sırada yapılsaydı "Price: Low to High"
    yalnızca görünen 12 kartı kendi arasında sıralar, portföyün en ucuz evi
    47. sırada gizli kalırdı — sessizce yanlış bir liste.
  */
  const results = useMemo(
    () => sortVillas(filterVillas(villas, filters), sort),
    [villas, filters, sort],
  );

  /* ------------------------------------------------- KADEMELİ GÖSTERİM */

  /**
   * Kaç kart basılacak.
   *
   * 57 ilanın tamamı aynı anda basıldığında sayfa 342 `<img>` ve 57 embla
   * örneği taşıyordu; hiçbiri ilk boyada görünmüyordu. İlk 12'yle açılmak
   * DOM'u, hidrasyon maliyetini ve tarayıcının sıraya aldığı görsel
   * isteklerini aynı anda düşürüyor.
   */
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  /**
   * Filtre değişince pencere başa dönmeli: "Load more"a üç kez basıp
   * ardından Ovacık'a geçen kullanıcı, 9 sonucun üstünde 48'lik bir pencere
   * devralmamalı — ve daha kötüsü, filtreyi genişlettiğinde hiç görmediği
   * ilanların açılmış sayıldığını sanmamalı.
   *
   * Effect DEĞİL, render sırasında düzeltme (React'in türetilmiş durum
   * kalıbı): effect ile yapılsaydı önce eski sayaçla bir kare basılır,
   * sonra düzeltilirdi. `encodeFilters` zaten filtrelerin kararlı bir metin
   * karşılığını üretiyor; kimlik için ayrı bir serileştirme yazmıyoruz.
   */
  const filterKey = useMemo(
    /* Sıralama da anahtarın parçası: düzen değişince ilk 12 artık başka
       12 ilandır, açılmış pencereyi korumanın bir anlamı kalmaz. */
    () => `${encodeFilters(filters, bounds)}|${sort}`,
    [filters, bounds, sort],
  );
  const [renderedKey, setRenderedKey] = useState(filterKey);

  if (renderedKey !== filterKey) {
    setRenderedKey(filterKey);
    setVisibleCount(PAGE_SIZE);
  }

  const visible = useMemo(
    () => results.slice(0, visibleCount),
    [results, visibleCount],
  );
  const remaining = results.length - visible.length;

  /**
   * Son tıklamada buton DOM'dan çıkıyor ve odak `<body>`ye düşüyor — klavye
   * kullanıcısı için sayfanın başına ışınlanmak demek. Buton kaybolduğunda
   * odağı hemen üstündeki sayaca alıyoruz; sayaç `role="status"` olduğu için
   * ekran okuyucu da yeni durumu okuyor.
   */
  const statusRef = useRef<HTMLParagraphElement>(null);
  const cameFromButton = useRef(false);

  useEffect(() => {
    if (!cameFromButton.current) return;
    cameFromButton.current = false;

    /*
      Karar render SONRASINDAKİ `remaining` ile veriliyor, tıklama anındaki
      sayaçla değil: iki tıklama aynı toplu güncellemeye düşerse kapanıştaki
      değer tahminden farklı olur. Buton hâlâ ekrandaysa odak zaten onun
      üstünde — dokunmak, kullanıcıyı kendi bastığı yerden koparmak olur.
    */
    if (remaining > 0) return;
    statusRef.current?.focus();
  }, [visibleCount, remaining]);

  const loadMore = () => {
    cameFromButton.current = true;
    setVisibleCount((current) => current + PAGE_SIZE);
  };

  const activeCount = activeFilterCount(filters, bounds);
  const priceTouched =
    filters.minPrice > bounds.min || filters.maxPrice < bounds.max;

  /* Sıralama bir filtre değil, bir tercih — "{t("explorer.clearFilters")}" onu bozmaz. */
  const reset = () => setFilters(defaultFilters(bounds));

  const toggleArea = (slug: string) =>
    setFilters((current) => ({
      ...current,
      areas: current.areas.includes(slug)
        ? current.areas.filter((item) => item !== slug)
        : [...current.areas, slug],
    }));

  const toggleCategory = (category: PropertyCategory) =>
    setFilters((current) => ({
      ...current,
      categories: current.categories.includes(category)
        ? current.categories.filter((item) => item !== category)
        : [...current.categories, category],
    }));

  /** Bölge listesi ilan sayılarıyla birlikte: sonuç vermeyen seçenek tıklanamaz. */
  const areaOptions = useMemo(
    () =>
      serviceAreas.map((area) => ({
        ...area,
        count: villas.filter((villa) => villa.areaSlug === area.slug)
          .length,
      })),
    [villas],
  );

  const categoryOptions = useMemo(
    () =>
      CATEGORY_ORDER.map((category) => ({
        value: category,
        label: t(CATEGORY_LABEL[category] as TranslationKey),
        icon: CATEGORY_ICON[category],
        count: villas.filter((villa) => categoryOf(villa) === category).length,
      })),
    /* `t` bağımlılıkta: dil değişince etiketler yeniden hesaplanmalı.
       `useT()` onu dile göre memolar, yani her render'da yeni referans
       üretip memoyu boşa çıkarmıyor. */
    [villas, t],
  );

  const areaLabel =
    filters.areas.length === 0
      ? t("explorer.anyArea")
      : filters.areas.length === 1
        ? (areaOptions.find((area) => area.slug === filters.areas[0])?.name ??
          t("explorer.oneArea"))
        : t("explorer.areaCount", { count: filters.areas.length });

  const priceLabel = priceTouched
    ? `${format(filters.minPrice)} – ${format(filters.maxPrice)}`
    : t("explorer.anyPrice");

  const bedroomsLabel =
    filters.minBedrooms === 0
      ? t("explorer.anyBedrooms")
      : `${filters.minBedrooms}+`;

  const typeLabel =
    filters.categories.length === 0
      ? t("explorer.anyType")
      : filters.categories.map((category) => CATEGORY_LABEL[category]).join(", ");


  /*
    FİLTRE PANELLERİ — İKİ YERDE KULLANILMAK ÜZERE AYRILDI.

    Aynı seçenek listeleri hem masaüstündeki açılır kutularda hem de mobil
    çekmecede görünüyor. JSX'i iki kez yazmak, bir seçeneğin yalnızca bir
    yüzeyde güncellenmesiyle sonuçlanırdı — bu bileşende zaten yaşanmış bir
    hata türü.
  */
  const locationPanel = (
<ul className="flex flex-col">
  {areaOptions.map((area) => {
    const selected = filters.areas.includes(area.slug);
    const empty = area.count === 0;

    return (
      <li key={area.slug}>
        <button
          type="button"
          disabled={empty}
          aria-pressed={selected}
          onClick={() => toggleArea(area.slug)}
          className={cn(
            "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors",
            empty
              ? "cursor-not-allowed text-ink-40/60"
              : "text-sea-deep hover:bg-shell-deep",
          )}
        >
          <span className="inline-flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className={cn(
                "inline-flex size-4 shrink-0 items-center justify-center border transition-colors",
                selected
                  ? "border-sea bg-sea text-shell"
                  : "border-line",
              )}
            >
              {selected ? <Check className="size-3" /> : null}
            </span>
            {area.name}
          </span>
          <span className="text-xs tabular-nums text-ink-40">
            {area.count}
          </span>
        </button>
      </li>
    );
  })}
</ul>
  );

  const pricePanel = (
<PriceRange
  bounds={bounds}
  min={filters.minPrice}
  max={filters.maxPrice}
  format={format}
  onChange={(next) =>
    setFilters((current) => ({ ...current, ...next }))
  }
/>
  );

  const bedroomsPanel = (
<div className="flex flex-wrap gap-2">
  {BEDROOM_OPTIONS.map((count) => {
    const selected = filters.minBedrooms === count;

    return (
      <button
        key={count}
        type="button"
        aria-pressed={selected}
        onClick={() =>
          setFilters((current) => ({
            ...current,
            minBedrooms: count,
          }))
        }
        className={cn(
          "inline-flex items-center gap-1.5 border px-4 py-2 text-sm transition-colors",
          selected
            ? "border-sea-deep bg-sea-deep text-shell"
            : "border-line text-sea-deep hover:border-sea-deep",
        )}
      >
        {count === 0 ? (
          "Any"
        ) : (
          <>
            <BedDouble className="size-3.5" aria-hidden="true" />
            {count}+
          </>
        )}
      </button>
    );
  })}
</div>
  );

  const typePanel = (
<div className="flex flex-col gap-2">
  {categoryOptions.map((option) => {
    const selected = filters.categories.includes(option.value);
    const empty = option.count === 0;

    return (
      <button
        key={option.value}
        type="button"
        disabled={empty}
        aria-pressed={selected}
        onClick={() => toggleCategory(option.value)}
        className={cn(
          "flex items-center justify-between gap-3 border px-4 py-2.5 text-sm transition-colors",
          empty && "cursor-not-allowed border-line/60 text-ink-40/60",
          !empty && selected && "border-sea-deep bg-sea-deep text-shell",
          !empty &&
            !selected &&
            "border-line text-sea-deep hover:border-sea-deep",
        )}
      >
        <span className="inline-flex items-center gap-2.5">
          <option.icon className="size-4" aria-hidden="true" />
          {t(option.label as TranslationKey)}
        </span>
        <span className="text-xs tabular-nums opacity-60">
          {option.count}
        </span>
      </button>
    );
  })}
</div>
  );

  /** Mobil çekmecede başlık + panel; masaüstünde açılır kutu içeriği. */
  const FILTER_SECTIONS = [
    /*
      `active` AÇIK BAYRAK — etiketi "hiçbiri" metniyle karşılaştırmıyoruz.

      İlk sürüm `value !== t("explorer.anyArea")` gibi bir kıyas yapıyordu
      ve sessizce bozuldu: konum etiketi "All areas" sabitinden geliyordu,
      sözlükteki karşılığı ise "Any area" idi. Eşleşmeyince filtre hiç
      seçim yokken bile ETKİN görünüyordu. Metne dayalı durum tespiti bu
      yüzden her zaman kırılgan — durumu durumdan okuyoruz.
    */
    { key: "location", label: t("explorer.location"), value: areaLabel, active: filters.areas.length > 0, node: locationPanel },
    { key: "price", label: t("explorer.price"), value: priceLabel, active: priceTouched, node: pricePanel },
    { key: "bedrooms", label: t("explorer.bedrooms"), value: bedroomsLabel, active: filters.minBedrooms > 0, node: bedroomsPanel },
    { key: "type", label: t("explorer.type"), value: typeLabel, active: filters.categories.length > 0, node: typePanel },
  ] as const;

  return (
    <>
      {/* ------------------------------------------------------ FİLTRE ÇUBUĞU */}
      {/*
        `sticky top-24 lg:top-28`: site başlığı da sticky ve 6rem/7rem
        yüksekliğinde (yığılmış logoya geçince büyüdü). Bu iki değer BİRBİRİNE
        BAĞLI — başlık yüksekliği değişip burası unutulursa filtre çubuğu ya
        başlığın altına girer ya da arada boşluk bırakır.
        Filtreler ekranın üstünde kaldığı için kullanıcı ızgaranın ortasındayken
        de kriterini değiştirebilir — bu, liste sayfalarında en çok kullanılan
        etkileşimdir ve yukarı kaydırmaya zorlamak dönüşümü düşürür.
      */}
      <div className="sticky top-24 z-30 border-b border-line bg-white/85 backdrop-blur-xl lg:top-28">
        <div className="container-page flex flex-wrap items-center gap-2 py-3 sm:py-4">
          {/* ------------------------------------------------ SERBEST ARAMA */}
          {/*
            Çubuğun İLK öğesi ve tek büyüyen öğesi (`flex-1`): kullanıcının
            aklındaki şey "Ovacık'ta havuzlu" gibi bir cümledir, açılır
            listelerin kombinasyonu değil. Küçük ekranda tam satır kaplıyor,
            geniş ekranda diğer kontrollerin solunda kalıyor.
          */}
          <SearchField
            value={filters.query}
            onChange={(query) =>
              setFilters((current) => ({ ...current, query }))
            }
          />

          {/*
            MASAÜSTÜ FİLTRELERİ — `sm` ve üstü.

            Mobilde gizleniyor çünkü dört açılır kutu 390px'te sarıp beş
            satıra çıkıyordu: yapışkan çubuk 844px'lik ekranın ~520px'ini,
            yani %62'sini kaplıyordu. Kullanıcı ilanları kaydırırken
            ekranın üçte ikisi filtre çubuğuydu.

            `sm:contents`: kapsayıcı görsel olarak YOK OLUYOR, çocukları
            doğrudan üstteki `flex-wrap` çubuğunun öğesi hâline geliyor.
            Böylece masaüstü düzeni birebir eskisi gibi sarıyor — araya
            fazladan bir flex kutusu girmiyor.
          */}
          <div className="hidden sm:contents">
            {FILTER_SECTIONS.map((section) => (
              <FilterPopover
                key={section.key}
                label={section.label}
                value={section.value}
                active={section.active}
                width={
                  section.key === "location" ? undefined : "w-[min(20rem,calc(100vw-3rem))]"
                }
              >
                {section.node}
              </FilterPopover>
            ))}
          </div>

          {/*
            MOBİL FİLTRE DÜĞMESİ — dört kutunun yerine tek düğme.

            Etkin filtre sayısı düğmenin üstünde rozet olarak duruyor;
            çekmeceyi açmadan "bir şey seçili mi" sorusunun cevabı görünür
            kalıyor. Bu olmadan daraltılmış bir filtre arayüzü, kullanıcının
            neden az sonuç gördüğünü gizler.
          */}
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            aria-expanded={mobileFiltersOpen}
            className="inline-flex shrink-0 items-center gap-2 rounded-sm border border-line bg-white px-4 py-2.5 text-sm text-sea-deep transition-colors hover:border-sea-deep sm:hidden"
          >
            <SlidersHorizontal className="size-4 text-sea" aria-hidden="true" />
            {t("explorer.filters")}
            {activeCount > 0 ? (
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-sea-deep text-[11px] font-semibold text-shell">
                {activeCount}
              </span>
            ) : null}
          </button>

          {/* ------------------------------------------- SIRALAMA + SAYAÇ */}
          {/*
            MOBİLDE KENDİ SATIRI (`w-full`), `sm`den itibaren çubuğun sağ ucu
            (`sm:ml-auto sm:w-auto`).

            Önceki hâlde üçü de doğrudan `flex-wrap` çubuğunun öğesiydi ve
            sıralama hapı `ml-auto` ile sağa itiliyordu. 375px'te hap kendi
            satırında sağa yapışıyor, `shrink-0` taşıyan sayaç ise onun
            üstüne biniyordu — okunamayan bir "SORT / 57 homes" yığını.
            Üçünü tek kapsayıcıya almak sarma davranışını öngörülebilir
            kılıyor: dar ekranda tam satır, geniş ekranda tek grup.
          */}
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:ml-auto sm:w-auto sm:flex-none">
            <SelectMenu
              tone="pill"
              label={t("explorer.sort")}
              value={sort}
              onChange={(value) => setUserSort(value as SortKey)}
              /* SORT_OPTIONS.label bir ÇEVİRİ ANAHTARI (bkz.
                 lib/property-filters.ts); menüye çözülmüş hâli veriliyor. */
              options={SORT_OPTIONS.map((o) => ({
                ...o,
                label: t(o.label as TranslationKey),
              }))}
              align="end"
              className="min-w-0 sm:ml-auto"
            />

            {/* ---------------------------------------------------- SIFIRLA */}
            <AnimatePresence initial={false}>
              {activeCount > 0 ? (
                <motion.button
                  type="button"
                  onClick={reset}
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
                  className="inline-flex shrink-0 items-center gap-2 px-3 py-2.5 text-sm text-ink-70 underline-offset-4 transition-colors hover:text-sea-deep hover:underline sm:px-4"
                >
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  {t("explorer.reset")}
                </motion.button>
              ) : null}
            </AnimatePresence>

            {/*
              GÖRÜNÜR SAYAÇ KALDIRILDI ("57 homes") — ama duyuru KALDI.

              Bu paragrafın iki işi vardı: rakamı göstermek ve `aria-live`
              ile filtre değiştiğinde sonucu ekran okuyucuya bildirmek.
              Yalnızca birincisi istenmiyor. Elemanı tamamen silmek, klavye
              ve ekran okuyucu kullanıcısını "filtreye bastım, bir şey oldu
              mu?" sorusuyla baş başa bırakırdı — filtreleme geri bildirimi
              olmayan bir etkileşimdir.

              `sr-only` bunu çözüyor: görsel arayüzde rakam yok, yardımcı
              teknolojide duyuru sürüyor.
            */}
            <p aria-live="polite" className="sr-only">
              {results.length === 1
                ? t("explorer.resultCountOne")
                : t("explorer.resultCountOther", { count: results.length })}
            </p>

            {/*
              IZGARA / LİSTE ANAHTARI.

              `role="group"` içinde iki `aria-pressed` düğme — `radiogroup`
              DEĞİL. Radyo grubu ok tuşlarıyla gezilmeyi ve tek bir tab
              durağı olmayı şart koşar; burada iki bağımsız aç/kapa düğmesi
              daha dürüst bir model ve klavyede Tab ile sırayla geziliyor.

              Sağ uçta, sıralamanın yanında: ikisi de "sonuçları nasıl
              görüyorum" sorusunun cevabı. Filtreler ("hangileri") soldaki
              kümede kalıyor.
            */}
            <div
              role="group"
              aria-label={t("explorer.layout")}
              className="ml-auto flex shrink-0 items-center rounded-sm border border-line bg-white p-0.5 sm:ml-0"
            >
              {(
                [
                  { value: "grid", label: "Grid view", Icon: LayoutGrid },
                  { value: "list", label: "List view", Icon: Rows3 },
                ] as const
              ).map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setView(value)}
                  aria-pressed={view === value}
                  aria-label={label}
                  className={cn(
                    "inline-flex size-8 items-center justify-center rounded-sm transition-colors",
                    view === value
                      ? "bg-sea-deep text-shell"
                      : "text-ink-40 hover:text-sea",
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.5} aria-hidden="true" />
                </button>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/*
        ⚠️ ÇEKMECE YAPIŞKAN ÇUBUĞUN DIŞINDA — ve bu zorunlu.

        İlk sürümde çubuğun içindeydi ve `position: fixed` viewport'a değil
        ÇUBUĞA göre konumlandı: panel ekranın 284px yukarısına çıkıp
        başlığın arkasında kayboldu.

        Sebep CSS'in az bilinen ama kesin bir kuralı: `backdrop-filter`
        (çubuktaki `backdrop-blur-xl`) o elemanı, içindeki `fixed`
        torunları için bir KAPSAYICI BLOK hâline getirir — aynı `transform`
        ve `filter` gibi. Yani "fixed" artık ekranı değil, o kutuyu
        referans alır. Çekmeceyi kardeş seviyeye almak tek doğru çözüm;
        z-index ile örtbas edilebilecek bir sorun değil.
      */}
      {/* ------------------------------------------------ MOBİL FİLTRE ÇEKMECESİ */}
      {/*
        `sm` altında dört açılır kutunun yerini alan tam ekran katman.

        NEDEN AÇILIR KUTU DEĞİL DE ÇEKMECE: mobilde bir popover ya ekranın
        dışına taşar ya da klavye açıldığında konumu kayar. Alttan gelen
        tam yükseklikli bir panel her iki sorunu da ortadan kaldırıyor ve
        dört filtreyi aynı anda görünür kılıyor — kullanıcı hangi kriteri
        değiştirdiğini görmek için kutu kutu dolaşmıyor.

        z-[70]: başlık z-50, dil seçici paneli z-[100], rıza şeridi z-[110].
        Çekmece başlığın üstünde ama rıza şeridinin altında kalmalı — rıza
        her şeyin önünde durmaya devam etmeli.
      */}
      {/*
        PORTAL — çekmece doğrudan <body> altına basılıyor.

        Bu bileşen ağacında zaten bir kez `position: fixed` kaybedildi:
        çekmece yapışkan çubuğun içindeyken `backdrop-filter` onu kapsayıcı
        blok yapmış ve panel ekranın 284px yukarısına çıkmıştı. Kardeş
        seviyeye almak o vakayı çözdü ama aynı tuzağı kapatmadı — ileride
        herhangi bir üst kapsayıcıya `transform`, `filter`, `perspective`
        ya da `contain` eklenirse hata aynen geri gelir ve tekrar
        "z-index sorunu" gibi görünür.

        Portal bunu yapısal olarak imkânsız kılıyor: <body> altında
        kapsayıcı blok üretecek bir ata yok.
      */}
      {isClient
        ? createPortal(
            <AnimatePresence>
              {mobileFiltersOpen ? (
                /*
                  `h-[100dvh]` — `inset-0` DEĞİL.

                  iOS'ta `fixed inset-0` BÜYÜK viewport'u referans alır:
                  adres çubuğu görünürken kutunun altı tarayıcı arayüzünün
                  ARKASINDA kalır ve "Sonuçları göster" düğmesi erişilemez
                  olur. `dvh` görünür yüksekliği takip ettiği için alt şerit
                  her durumda ekranda.
                */
                <div className="fixed inset-x-0 top-0 z-[70] h-[100dvh] sm:hidden">
            <motion.button
              type="button"
              aria-label={t("explorer.closeFilters")}
              onClick={() => setMobileFiltersOpen(false)}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={t("explorer.filtersTitle")}
              initial={reduceMotion ? false : { y: "100%" }}
              animate={{ y: 0 }}
              exit={reduceMotion ? undefined : { y: "100%" }}
              transition={{ duration: 0.32, ease: EASE_OUT_EXPO }}
              className="absolute inset-x-0 bottom-0 flex max-h-[88%] flex-col border-t border-line bg-shell"
            >
              <header className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4">
                <p className="font-display text-lg text-sea-deep">
                  {t("explorer.filtersTitle")}
                </p>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  aria-label={t("explorer.closeFilters")}
                  className="inline-flex size-9 items-center justify-center rounded-sm border border-line text-ink-40 transition-colors hover:border-sea hover:text-sea"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </header>

              {/* Kaydırılan gövde: dört bölüm açık hâlde, üst üste. */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
                {FILTER_SECTIONS.map((section) => (
                  <section key={section.key} className="border-b border-line/70 pb-6 pt-6 first:pt-0 last:border-0">
                    <p className="eyebrow text-ink-40">{section.label}</p>
                    <div className="mt-4">{section.node}</div>
                  </section>
                ))}
              </div>

              {/*
                Sabit alt çubuk: sonuçları görmek için yukarı kaydırmak
                gerekmiyor. Sayı düğmenin üstünde — seçim yaparken canlı
                geri bildirim.
              */}
              <div className="flex shrink-0 items-center gap-3 border-t border-line px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                {activeCount > 0 ? (
                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex shrink-0 items-center gap-2 px-3 py-3 text-sm text-ink-70 underline-offset-4 transition-colors hover:text-sea-deep hover:underline"
                  >
                    <RotateCcw className="size-3.5" aria-hidden="true" />
                    {t("explorer.reset")}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="flex-1 bg-sea-deep px-6 py-3.5 text-sm font-medium text-shell transition-colors hover:bg-sea"
                >
                  {t("explorer.showResults")} ({results.length})
                </button>
              </div>
            </motion.div>
                </div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}

      {/*
        IZGARA ZEMİNİ.

        Kartlar saf beyaz (#fff); sayfa zemini ise `shell` (#fbfdfe) idi.
        İki değer arasında 1-2 birim fark var — pratikte kartların kenarı
        yalnızca `border-line` sayesinde görünüyordu, yüzeyin kendisi
        zeminle aynıydı. `shell-deep` (#eef5fa) kartı zeminden ayıran ilk
        gerçek kontrastı veriyor: gölge büyütmeden, çizgi kalınlaştırmadan.

        Marka paletinden seçildi (bkz. globals.css). Tailwind'in `slate-50`
        tonu nötr-gri, palet ise bilinçli olarak maviye çekilmiş; yan yana
        geldiğinde gri, mavinin yanında kirli görünüyor.
      */}
      <div className="bg-shell-deep pb-4">
      {/* -------------------------------------------------------- AKTİF ROZET */}
      <div className="container-page">
        <AnimatePresence initial={false}>
          {activeCount > 0 ? (
            <motion.ul
              initial={reduceMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
              className="flex flex-wrap items-center gap-2 overflow-hidden pt-4"
            >
              {activeCount > 0 && filters.query.trim().length > 0 ? (
                <Chip
                  onRemove={() =>
                    setFilters((current) => ({ ...current, query: "" }))
                  }
                  icon={Search}
                  label={`“${filters.query.trim()}”`}
                />
              ) : null}

              {filters.areas.map((slug) => (
                <Chip
                  key={slug}
                  onRemove={() => toggleArea(slug)}
                  icon={MapPin}
                  label={
                    areaOptions.find((area) => area.slug === slug)?.name ?? slug
                  }
                />
              ))}

              {filters.categories.map((category) => (
                <Chip
                  key={category}
                  onRemove={() => toggleCategory(category)}
                  icon={CATEGORY_ICON[category]}
                  label={t(CATEGORY_LABEL[category] as TranslationKey)}
                />
              ))}

              {filters.minBedrooms > 0 ? (
                <Chip
                  onRemove={() =>
                    setFilters((current) => ({ ...current, minBedrooms: 0 }))
                  }
                  icon={BedDouble}
                  label={`${filters.minBedrooms}+ bedrooms`}
                />
              ) : null}

              {priceTouched ? (
                <Chip
                  onRemove={() =>
                    setFilters((current) => ({
                      ...current,
                      minPrice: bounds.min,
                      maxPrice: bounds.max,
                    }))
                  }
                  label={`${format(filters.minPrice)} – ${format(filters.maxPrice)}`}
                />
              ) : null}
            </motion.ul>
          ) : null}
        </AnimatePresence>
      </div>

      {/* -------------------------------------------------------------- IZGARA */}
      <section aria-labelledby={headingId} className="container-page pb-16 pt-6 sm:pt-8">
        <h2 id={headingId} className="sr-only">
          {t("explorer.results")}
        </h2>

        {/*
          Liste görünümünde tek sütun ve daha dar bir boşluk: kartlar
          birbirinin altında bir "kayıt defteri" gibi okunuyor. Izgarada
          eskisi gibi 1 → 2 → 3 sütun.
        */}
        <ul
          className={cn(
            "grid items-stretch",
            view === "list"
              ? "grid-cols-1 gap-4"
              : "grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3",
          )}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((villa, index) => (
              <motion.li
                key={villa.id}
                className="flex"
                layout={!reduceMotion}
                initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={
                  reduceMotion ? undefined : { opacity: 0, scale: 0.95, y: -8 }
                }
                transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
              >
                <PropertyCard
                  villa={villa}
                  priority={index < 3}
                  layout={view}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        {/* ------------------------------------------------------ DAHA FAZLA */}
        {/*
          Blok yalnızca liste bir sayfadan uzunsa var. Üç sonucun altına
          "3 / 3 gösteriliyor" yazmak bilgi değil gürültü olurdu.

          Koşul `results.length` üzerinde — `remaining` üzerinde DEĞİL: son
          tıklamadan sonra sayaç ayakta kalmalı, yoksa odağı verdiğimiz
          eleman aynı karede yok olur.
        */}
        {results.length > PAGE_SIZE ? (
          <div className="mt-14 flex flex-col items-center gap-6 border-t border-line pt-12">
            <p
              ref={statusRef}
              tabIndex={-1}
              role="status"
              className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-ink-40 outline-none"
            >
              Showing {visible.length} of {results.length}
            </p>

            <AnimatePresence initial={false}>
              {remaining > 0 ? (
                <motion.button
                  type="button"
                  onClick={loadMore}
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
                  className="btn btn-outline-dark"
                >
                  {t("explorer.loadMore")}
                  <ChevronDown className="size-4" aria-hidden="true" />
                </motion.button>
              ) : null}
            </AnimatePresence>
          </div>
        ) : null}

        <AnimatePresence>
          {results.length === 0 ? (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
              className="flex flex-col items-center rounded-sm border border-dashed border-line bg-white/60 px-6 py-24 text-center"
            >
              <SlidersHorizontal className="size-6 text-ink-40" aria-hidden="true" />
              <p className="mt-6 font-display text-2xl text-sea-deep">
                {/* Aramada sonuç yoksa sebep büyük ihtimalle yazılan kelime,
                    açılır filtreler değil — mesaj o kelimeyi göstermeli. */}
                {filters.query.trim().length > 0
                  ? `No homes match “${filters.query.trim()}”`
                  : "Nothing matches those filters"}
              </p>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-70">
                {t("explorer.emptyBody")}
            </p>
              <button
                type="button"
                onClick={reset}
                className="mt-8 inline-flex items-center gap-2 bg-sea-deep px-7 py-3.5 text-sm font-medium text-shell transition-colors hover:bg-sea"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                {t("explorer.clearFilters")}
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>
      </div>
    </>
  );
}

/* ---------------------------------------------------------- HASH DEPOSU */

function subscribeToHash(onStoreChange: () => void) {
  window.addEventListener("hashchange", onStoreChange);
  /** popstate: geri/ileri tuşları hashchange tetiklemeyebilir. */
  window.addEventListener("popstate", onStoreChange);

  return () => {
    window.removeEventListener("hashchange", onStoreChange);
    window.removeEventListener("popstate", onStoreChange);
  };
}

function getHashSnapshot(): string {
  return window.location.hash;
}

/** Sunucuda hash yoktur: prerender edilen HTML daima tam listeyi gösterir. */
function getServerHashSnapshot(): string {
  return "";
}

const CATEGORY_ICON: Record<
  PropertyCategory,
  React.ComponentType<{ className?: string }>
> = {
  villa: House,
  apartment: Building2,
  plot: LandPlot,
};

/* ------------------------------------------------------------------ PARÇALAR */

/**
 * Serbest metin arama kutusu.
 *
 * DEBOUNCE YOK ve bu bilinçli: filtreleme 57 elemanlık, önceden normalize
 * edilmiş bir dizi üzerinde `String.includes` çalıştırıyor — ağ isteği değil,
 * mikrosaniyelik bir iş. Debounce burada yalnızca gecikme hissi eklerdi.
 * Liste birkaç bine çıkarsa ölçüp yeniden karar verilmeli.
 *
 * `type="search"` DEĞİL, `type="text"`: `search` tipi tarayıcının kendi
 * temizleme çarpısını basıyor ve o çarpı `onChange` üretmeden değeri
 * boşaltabiliyor. Temizleme düğmesini kendimiz kontrol ediyoruz.
 */
function SearchField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useT();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative w-full min-w-0 sm:w-auto sm:flex-1 sm:basis-44 xl:basis-56">
      <label htmlFor={inputId} className="sr-only">
        Search properties by keyword
      </label>

      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-40"
      />

      <input
        id={inputId}
        ref={inputRef}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          /* Escape kutuyu temizler — odak kutuda kalır ki yazmaya devam
             edilebilsin. Formun içinde olmadığı için Enter'ın işi yok. */
          if (event.key === "Escape" && value.length > 0) {
            event.preventDefault();
            onChange("");
          }
        }}
        placeholder={t("explorer.searchPlaceholder")}
        autoComplete="off"
        spellCheck={false}
        className="w-full rounded-sm border border-line bg-white py-2.5 pl-11 pr-10 text-sm text-sea-deep transition-colors placeholder:text-ink-40 hover:border-sea-deep focus:border-sea-deep focus:outline-none"
      />

      {value.length > 0 ? (
        <button
          type="button"
          onClick={() => {
            onChange("");
            /* Temizledikten sonra odak kutuya dönmeli: düğme kayboluyor ve
               odak <body>'ye düşerse kullanıcı çubuğun başına savrulur. */
            inputRef.current?.focus();
          }}
          className="absolute right-1.5 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-sm text-ink-40 transition-colors hover:bg-shell-deep hover:text-sea-deep"
        >
          <X className="size-3.5" aria-hidden="true" />
          <span className="sr-only">{t("explorer.clearSearch")}</span>
        </button>
      ) : null}
    </div>
  );
}

/**
 * Açılır filtre paneli.
 *
 * `<details>` yerine buton + panel: seçim yapıldıkça tetikleyicideki özet
 * metnin güncellenmesi ve panelin dışarı tıklamayla kapanması gerekiyor.
 * Erişilebilirlik sözleşmesi elle kuruluyor — `aria-expanded`, Escape ile
 * kapanma ve odağın tetikleyiciye geri dönmesi.
 */
function FilterPopover({
  label,
  value,
  active,
  width = "w-[min(18rem,calc(100vw-3rem))]",
  children,
}: {
  label: string;
  value: string;
  active: boolean;
  width?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      /** Odak kaybolmasın: panel kapanınca tetikleyiciye geri dön. */
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          "inline-flex items-center gap-2 rounded-sm border px-3.5 py-2.5 text-sm transition-colors",
          active
            ? "border-sea-deep bg-sea-deep text-shell"
            : "border-line bg-shell text-sea-deep hover:border-sea-deep",
        )}
      >
        <span className={cn("text-xs uppercase tracking-widest", active ? "text-shell/60" : "text-ink-40")}>
          {label}
        </span>
        <span className="max-w-[9rem] truncate">{value}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-3.5 shrink-0 transition-transform duration-300",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            id={panelId}
            role="group"
            aria-label={label}
            initial={reduceMotion ? false : { opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
            className={cn(
              "absolute left-0 top-[calc(100%+0.6rem)] z-40 origin-top rounded-sm border border-line bg-white p-4 shadow-panel",
              width,
            )}
          >
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Chip({
  label,
  icon: Icon,
  onRemove,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onRemove: () => void;
}) {
  const { t } = useT();
  return (
    <li>
      <button
        type="button"
        onClick={onRemove}
        className="group inline-flex items-center gap-2 rounded-sm border border-line bg-white px-3.5 py-1.5 text-xs text-sea-deep transition-colors hover:border-sea-deep"
      >
        {Icon ? <Icon className="size-3 text-sea" /> : null}
        {label}
        <X className="size-3 text-ink-40 transition-colors group-hover:text-sea-deep" />
        <span className="sr-only">{t("explorer.removeFilter")}</span>
      </button>
    </li>
  );
}

/**
 * Çift uçlu fiyat kaydırıcısı.
 *
 * Üst üste bindirilmiş iki `<input type="range">`: yerel eleman olduğu için
 * klavye, dokunmatik ve ekran okuyucu desteği bedavaya gelir — elle yazılmış
 * bir sürükleme mantığında bunların üçü de ayrı ayrı kırılır.
 * Ray `pointer-events:none`, yalnızca tutamaçlar tıklanabilir (globals.css).
 */
function PriceRange({
  bounds,
  min,
  max,
  format,
  onChange,
}: {
  bounds: { min: number; max: number };
  min: number;
  max: number;
  format: (gbp: number) => string;
  onChange: (next: { minPrice: number; maxPrice: number }) => void;
}) {
  const { t } = useT();
  const span = bounds.max - bounds.min;
  const toPercent = (value: number) => ((value - bounds.min) / span) * 100;

  /**
   * İki tutamaç sağ uçta üst üste binerse alttaki tıklanamaz hâle gelir.
   * Alt sınır üst bölgeye girdiğinde onu öne alıyoruz.
   */
  const minOnTop = toPercent(min) > 85;

  return (
    <div className="px-1 pb-1">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-lg text-sea-deep">{format(min)}</p>
        <span aria-hidden="true" className="text-ink-40">
          —
        </span>
        <p className="font-display text-lg text-sea-deep">{format(max)}</p>
      </div>

      <div className="relative mt-6 h-6">
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line"
        />
        <span
          aria-hidden="true"
          className="absolute top-1/2 h-[3px] -translate-y-1/2 bg-sea"
          style={{
            left: `${toPercent(min)}%`,
            right: `${100 - toPercent(max)}%`,
          }}
        />

        <input
          type="range"
          aria-label={t("explorer.minPrice")}
          min={bounds.min}
          max={bounds.max}
          step={PRICE_STEP}
          value={min}
          onChange={(event) =>
            onChange({
              minPrice: Math.min(Number(event.target.value), max - PRICE_STEP),
              maxPrice: max,
            })
          }
          className={cn(
            "range-input absolute inset-x-0 top-0 h-6 w-full",
            minOnTop ? "z-20" : "z-10",
          )}
        />
        <input
          type="range"
          aria-label={t("explorer.maxPrice")}
          min={bounds.min}
          max={bounds.max}
          step={PRICE_STEP}
          value={max}
          onChange={(event) =>
            onChange({
              minPrice: min,
              maxPrice: Math.max(Number(event.target.value), min + PRICE_STEP),
            })
          }
          className={cn(
            "range-input absolute inset-x-0 top-0 h-6 w-full",
            minOnTop ? "z-10" : "z-20",
          )}
        />
      </div>

      <p className="mt-5 text-xs leading-relaxed text-ink-40">
        {t("explorer.priceNote")}
      </p>
    </div>
  );
}
