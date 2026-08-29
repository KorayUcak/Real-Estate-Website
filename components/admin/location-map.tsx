"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * HARİTA ÇEKİRDEĞİ — Leaflet burada, SADECE burada.
 *
 * ⚠️ BU DOSYA SUNUCUDA ÇALIŞAMAZ. Leaflet modül seviyesinde `window`a
 * dokunuyor, dolayısıyla import edildiği anda SSR'ı patlatır. Bu yüzden
 * doğrudan import EDİLMEZ: `location-picker.tsx` onu `ssr: false` ile
 * dinamik yükler. Ayrı dosya olmasının tek sebebi bu sınır.
 *
 * KİMLİK DOĞRULAMALI PANELDE OSM KAROLARI: harita kütüphanesi projede yoktu
 * (ilan sayfasındaki harita anahtarsız bir Google `iframe`'i ve çapraz köken
 * olduğu için tıklama bildiremez). Leaflet + OpenStreetMap seçildi çünkü
 * API anahtarı, faturalandırma hesabı ya da istemciye sızacak bir kimlik
 * bilgisi gerektirmiyor. Kullanım OSM'in kabul edilebilir kullanım
 * politikası içinde kalıyor: harita yalnızca giriş yapmış yöneticiye,
 * ilan başına birkaç kez açılıyor.
 */

/**
 * PİN — Leaflet'in varsayılan ikonu DEĞİL, `divIcon`.
 *
 * Varsayılan `L.Icon.Default` işaretçi görsellerini `leaflet/dist/images/`
 * altından göreli yolla çözüyor. Bu yol paketleyiciden geçmiyor, yani
 * üretim derlemesinde ikon 404 veriyor ve haritada görünmez bir işaretçi
 * kalıyor — Leaflet'in en bilinen tuzağı. `divIcon` saf HTML: çözülecek
 * bir varlık yok, üstelik pin marka renginde.
 */
const PIN_ICON = L.divIcon({
  className: "",
  /*
    ⚠️ BİÇİM SATIR İÇİ `style` İLE VERİLEMEZ — globals.css'e taşındı.

    Önceki hâli `border-radius`ı burada, satır içinde veriyordu ve pin
    YILLARCA damla değil düz bir eşkenar dörtgen olarak çizildi. Sebep
    globals.css'teki keskin köşe kuralı: `border-radius: 0 !important`.
    Satır içi bir bildirim, stil sayfasındaki `!important`i YENEMEZ —
    cascade'de "important author" katmanı satır içi normal bildirimin
    üstünde. Hata sessizdi çünkü pin yine görünüyordu, sadece yanlış
    biçimde.

    Artık iki sınıf var: `.keep-radius` o kuralın dışına çıkarıyor,
    `.admin-pin` biçimi veriyor. İkisi de globals.css'te, gerekçesiyle.
  */
  html: `<span class="admin-pin keep-radius"></span>`,
  iconSize: [26, 26],
  /* Ucu tıklanan noktada dursun diye: döndürülmüş karenin sol-alt köşesi. */
  iconAnchor: [13, 26],
});

export type LatLng = { lat: number; lng: number };

/**
 * ⚠️ HASSASİYET BURADA KIRPILIYOR, FORMDA DEĞİL.
 *
 * Leaflet ham float döndürüyor (36.62130000000001). Kırpılmazsa alan her
 * sürüklemede gürültülü bir sayı gösteriyor ve `existing` ile karşılaştırma
 * yapan her yer "değişti" sanıyor. 6 basamak ≈ 11 cm; bir villa pini için
 * fazlasıyla yeterli.
 */
const PRECISION = 6;

export function roundCoord(value: number): string {
  return String(Number(value.toFixed(PRECISION)));
}

/**
 * Hedef GÖRÜNÜR DEĞİLSE haritayı oraya taşır — görünüyorsa dokunmaz.
 *
 * `MapContainer` `center` prop'unu yalnızca ilk render'da okuyor, yani
 * bölge değiştiğinde ya da alana koordinat yapıştırıldığında haritayı
 * taşıyacak bir şeye ihtiyaç var. Bu bileşen o işi yapıyor.
 *
 * ⚠️ KOŞULSUZ `setView` BİR HATAYDI. Pin de bir "hedef" olduğu için, her
 * tıklama ve her sürükleme haritayı yeniden ortalıyordu: yönetici kenara
 * bir pin bırakıyor, harita altından kayıp pini ortaya alıyor, bir sonraki
 * tıklama artık başka bir yere denk geliyordu. Yakınlaştırma da her
 * seferinde 15'e zorlanıyordu — sokak seviyesinde çalışan biri her
 * tıklamada geri sıçrıyordu.
 *
 * Sınır testi ikisini de çözüyor: KULLANICININ yaptığı hareketler zaten
 * görünür alanın içinde kalıyor, dolayısıyla harita hiç oynamıyor. Yalnızca
 * ekran dışına düşen bir hedef — yeni bir bölge, yapıştırılmış bir
 * koordinat — görünümü hareket ettiriyor.
 */
function Recentre({ target, zoom }: { target: LatLng; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    const point = L.latLng(target.lat, target.lng);

    if (map.getBounds().contains(point)) return;

    map.setView(point, zoom);
    /*
      Bağımlılıklar SAYI olarak veriliyor, nesne olarak değil: `target` her
      render'da yeni bir nesne referansı ve etki her seferinde çalışırdı.
    */
  }, [map, target.lat, target.lng, zoom]);

  return null;
}

/** Boş haritaya tıklama = pin bırak. */
function ClickToPlace({ onPick }: { onPick: (point: LatLng) => void }) {
  useMapEvents({
    click: (event) => onPick(event.latlng),
  });

  return null;
}

export function LocationMap({
  pin,
  centre,
  onPick,
}: {
  /** Seçili konum; yoksa harita bölge merkezini gösterir ve işaretçi çizmez. */
  pin: LatLng | null;
  /** Pin yokken bakılacak yer — seçili bölgenin merkezi. */
  centre: LatLng;
  onPick: (point: LatLng) => void;
}) {
  /* Pin varsa yakın plan, yoksa bölgeyi gösterecek kadar geniş. */
  const target = pin ?? centre;
  const zoom = pin ? 15 : 12;

  const handlers = useMemo(
    () => ({
      dragend(event: L.DragEndEvent) {
        onPick((event.target as L.Marker).getLatLng());
      },
    }),
    [onPick],
  );

  return (
    <MapContainer
      center={[target.lat, target.lng]}
      zoom={zoom}
      scrollWheelZoom={false}
      /*
        TEKERLEK YAKINLAŞTIRMASI KAPALI. Uzun bir formda sayfayı
        kaydırırken imleç haritanın üstünden geçtiğinde sayfa durur ve
        harita yakınlaşırdı — yöneticinin en istemediği şey.
        Yakınlaştırmanın kalan iki yolu açık: sol üstteki +/− düğmeleri
        ve çift tıklama.
      */
      className="size-full"
      style={{ background: "var(--color-shell-deep, #f3efe7)" }}
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={19}
      />

      <Recentre target={target} zoom={zoom} />
      <ClickToPlace onPick={onPick} />

      {pin ? (
        <Marker
          position={[pin.lat, pin.lng]}
          icon={PIN_ICON}
          draggable
          autoPan
          eventHandlers={handlers}
          /* Klavye ile taşınabilir: Leaflet işaretçisi odaklanabilir ve
             ok tuşlarını kabul eder — fare tek giriş yolu olmasın. */
          keyboard
        />
      ) : null}
    </MapContainer>
  );
}
