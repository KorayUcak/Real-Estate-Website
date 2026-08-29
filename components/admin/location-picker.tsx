"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo } from "react";
import { Crosshair, MapPin, MapPinOff } from "lucide-react";
import { FieldError } from "@/components/admin/form-fields";
import { cn } from "@/lib/cn";
import { getServiceArea } from "@/lib/site";
import type { LatLng } from "@/components/admin/location-map";

/**
 * KONUM SEÇİCİ — haritadan pin, elle sayı DEĞİL.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * NEDEN VAR. Form önceden iki serbest metin alanı soruyordu: "Latitude"
 * ve "Longitude". Bu, yöneticiden bir başka sekmede Google Haritalar açıp
 * sağ tıklayıp koordinat kopyalamasını, sonra iki alana ayrı ayrı
 * yapıştırmasını istemek demekti. İki alanın yer değiştirmesi (enlem
 * kutusuna boylam) sessiz bir hata: kayıt geçerli, pin Umman Körfezi'nde.
 *
 * Haritada seçmek bu hatayı yapısal olarak imkânsız kılıyor — tıklanan
 * yer neyse kaydedilen o.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * SAYI ALANLARI KALDIRILMADI, İKİNCİL HÂLE GELDİ (bkz. property-form.tsx).
 * Elde hazır bir koordinat varsa yapıştırmak hâlâ en hızlı yol; harita da
 * o değeri anında gösterip doğrulamayı sağlıyor.
 */

/**
 * ⚠️ `ssr: false` ZORUNLU. `location-map.tsx` Leaflet'i modül seviyesinde
 * import ediyor, Leaflet ise import anında `window`a bakıyor. Sunucuda
 * render edilmeye çalışılırsa derleme değil ÇALIŞMA ZAMANI hatası verir.
 *
 * Bu çağrının bir istemci bileşeninin içinde olması da şart: `ssr: false`
 * sunucu bileşenlerinde desteklenmiyor.
 */
const LocationMap = dynamic(
  () => import("@/components/admin/location-map").then((m) => m.LocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex size-full items-center justify-center bg-shell-deep text-xs text-ink-40">
        Loading map…
      </div>
    ),
  },
);

/** Hiçbir bölge seçilmediğinde harita nereye baksın — Fethiye limanı. */
const DEFAULT_CENTRE: LatLng = { lat: 36.6213, lng: 29.1164 };

/** Leaflet'in ham float'ı yerine 6 basamak — bkz. location-map.tsx. */
function round(value: number): string {
  return String(Number(value.toFixed(6)));
}

/** Alan dizesi geçerli bir sayı mı? `""`, `"-"`, `"abc"` → değil. */
function parse(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function LocationPicker({
  latitude,
  longitude,
  onChange,
  areaSlug,
  error,
}: {
  latitude: string;
  longitude: string;
  /** Form durumunu GÜNCELLEYEN tek yol — ikisi birlikte yazılır. */
  onChange: (latitude: string, longitude: string) => void;
  /** Seçili bölge; pin yokken haritanın nereye bakacağını belirler. */
  areaSlug: string;
  error?: string;
}) {
  const lat = parse(latitude);
  const lng = parse(longitude);

  /*
    Pin YALNIZCA iki değer de geçerliyse var. Tek koordinat bir konum
    değil: enlem 36, boylam boş → harita Gine Körfezi'ne pin bırakırdı.
    Yönetici ikinci alanı yazarken bunu bir an için görmemeli.
  */
  const pin: LatLng | null =
    lat !== null &&
    lng !== null &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
      ? { lat, lng }
      : null;

  const centre = useMemo(
    () => getServiceArea(areaSlug)?.coordinates ?? DEFAULT_CENTRE,
    [areaSlug],
  );

  const handlePick = useCallback(
    (point: LatLng) => onChange(round(point.lat), round(point.lng)),
    [onChange],
  );

  const clear = useCallback(() => onChange("", ""), [onChange]);

  const centreOnArea = useCallback(
    () => onChange(round(centre.lat), round(centre.lng)),
    [centre, onChange],
  );

  const areaName = getServiceArea(areaSlug)?.name;

  return (
    /*
      `role="group"` + `aria-labelledby` — `<label>` DEĞİL.

      `<label for>` yalnızca form denetimlerine bağlanır; harita bir `<div>`
      ve labelable bir eleman değil, yani `for` sessizce hiçbir şeye
      bağlanmayan bir bağlantı olurdu. Gruplama, başlığı ve durum satırını
      haritaya bağlamanın doğru yolu: ekran okuyucu "Map position, group"
      diye duyuruyor ve içeri girdiğinde durum metnini de okuyor.
    */
    <div
      role="group"
      aria-labelledby="location-map-label"
      aria-describedby="location-map-status"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span
          id="location-map-label"
          className="block font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-70"
        >
          Map position
        </span>
        <span className="text-[0.6875rem] text-ink-40">
          Click the map or drag the pin
        </span>
      </div>

      {/*
        `aspect-*` DEĞİL, sabit yükseklik. Harita bir görsel değil bir
        araç: 16/9 bir oran dar bir panelde 180px'e kadar iner ve pin
        bırakacak yer kalmaz. Mobilde 18rem, masaüstünde 24rem — her iki
        durumda da sokak seviyesinde çalışmaya yetiyor.

        `isolate`: Leaflet kendi katmanlarına yüksek `z-index` veriyor
        (kontroller 1000'de). Yalıtım olmadan bu değerler formun
        üstünden taşıp yapışkan panel başlığının önüne geçiyor.
      */}
      <div
        className={cn(
          "relative isolate mt-2 h-72 overflow-hidden rounded-sm border sm:h-96",
          error ? "border-gold-deep" : "border-line",
        )}
      >
        <LocationMap pin={pin} centre={centre} onPick={handlePick} />
      </div>

      <FieldError id="location-map-error" message={error} />

      {/*
        DURUM ŞERİDİ — pinin ne anlama geldiğini KELİMEYLE söylüyor.
        Haritada bir işaretçi görmek "bu kaydedilecek mi yoksa yalnızca
        bölge merkezi mi" sorusunu cevaplamıyor; bu satır cevaplıyor.
      */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p
          id="location-map-status"
          className={cn(
            "inline-flex items-center gap-2 text-xs",
            pin ? "text-sea-deep" : "text-ink-40",
          )}
        >
          {pin ? (
            <>
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              Exact pin saved — {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
            </>
          ) : (
            <>
              <MapPinOff className="size-3.5 shrink-0" aria-hidden="true" />
              No pin — the listing map will show the centre of{" "}
              {areaName ?? "the selected area"} instead.
            </>
          )}
        </p>

        <div className="flex items-center gap-2">
          {/*
            "Bölge merkezine getir" — boş bir haritada nereden başlayacağını
            bilmeyen yönetici için. Pini bölgenin merkezine koyup oradan
            sürüklemek, ülke ölçeğinden yakınlaşmaktan hızlı.
          */}
          <button
            type="button"
            onClick={centreOnArea}
            className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-white px-3 py-1.5 text-xs text-ink-70 transition-colors hover:border-sea hover:text-sea-deep"
          >
            <Crosshair className="size-3.5" aria-hidden="true" />
            Drop pin on area centre
          </button>

          <button
            type="button"
            onClick={clear}
            disabled={!pin}
            className="rounded-sm border border-line bg-white px-3 py-1.5 text-xs text-ink-70 transition-colors hover:border-sea hover:text-sea-deep disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink-70"
          >
            Clear pin
          </button>
        </div>
      </div>
    </div>
  );
}
