"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * BÖLGE HARİTASI ÇEKİRDEĞİ — Leaflet burada, SADECE burada.
 *
 * ⚠️ BU DOSYA SUNUCUDA ÇALIŞAMAZ. Leaflet modül seviyesinde `window`a
 * dokunuyor, yani import edildiği anda SSR'ı patlatır. Bu yüzden doğrudan
 * import EDİLMEZ: `area-map.tsx` onu `ssr: false` ile dinamik yükler.
 * Ayrı dosya olmasının tek sebebi bu sınır (aynı ayrım yönetici tarafında
 * `admin/location-map.tsx` ↔ `admin/location-picker.tsx` olarak da var).
 */

export type AreaMapPoint = {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  /** Pinin gittiği Google Haritalar adresi — bkz. lib/turkey.ts `areaMapsUrl`. */
  href: string;
  /** Etiket pinin hangi yanına yazılsın (çakışma önleme, lib/turkey.ts). */
  labelSide: "left" | "right";
  /** Ekran okuyucuya okunan tam cümle — çeviri sunucudan geliyor. */
  ariaLabel: string;
};

/**
 * KAROLAR: STANDART OpenStreetMap — tam renkli.
 *
 * ⚠️ BURASI ÖNCE CARTO "Positron"DU ve bilinçli olarak DEĞİŞTİRİLDİ.
 * Positron gri-beyaz bir taban: kartografik olarak temiz, ama bir yaşam
 * tarzı/emlak markası için cansız. Müşterinin istediği şey açıktı —
 * "deniz mavi, kara yeşil görünsün". Fethiye kıyısında bunu gerçekten
 * veren tek keysiz sağlayıcı standart OSM: koylar canlı mavi, Babadağ'ın
 * çam ormanları belirgin yeşil.
 *
 * (Değerlendirilen alternatifler: CARTO Voyager hâlâ pastel — deniz açık
 * gri-mavi; Esri World Topo kabartmalı ama karayı gri-bejde bırakıyor.)
 *
 * ⚠️ ÖLÇEK NOTU — TRAFİK BÜYÜRSE BURAYA DÖNÜN. OSM'in karo sunucusu
 * bağıştan dönüyor ve kullanım politikası ağır/ticari trafiği kendi
 * üzerinden geçirmemenizi istiyor. Tek bir pazarlama sayfası için sorun
 * değil; sayfa ayda on binlerce görüntülenmeye çıkarsa doğru hamle bir
 * sağlayıcıya geçmek. Tek satırlık takas:
 *
 *   https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png
 *   (+ subdomains="abcd", + detectRetina, + CARTO atıf satırı)
 */
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/**
 * ETİKETLER BU YAKINLAŞTIRMADAN İTİBAREN GÖRÜNÜR.
 *
 * ⚠️ SABİT DEĞİL, KARTOGRAFİK BİR KARAR. Dokuz pinin tamamı çerçeveye
 * sığdığında masaüstü zoom 10'a, dar bir telefon ekranı ise zoom 9'a
 * oturuyor. 9'da Hisarönü ile Ovacık arasında ~4px kalıyor: etiketler
 * okunmaz bir yığına dönüşüyordu. 10'da aynı çift ~8px dikey + ~16px yatay
 * mesafede ve zıt yanlara yazıldığı için rahatça ayrışıyor.
 *
 * Yani telefonda harita önce dokuz altın nokta olarak açılıyor, parmakla
 * yakınlaştırıldığında adlar beliriyor. Ad okumadan da yola devam etmek
 * mümkün: her bölge kartının altında aynı bağlantı metin olarak duruyor.
 */
const LABEL_MIN_ZOOM = 10;

/** Pin + etiket, tek bir `<a>` olarak. */
function pinIcon(point: AreaMapPoint): L.DivIcon {
  return L.divIcon({
    className: "",
    /*
      ⚠️ POPUP YOK — İŞARETÇİNİN KENDİSİ BİR BAĞLANTI.

      Leaflet `Marker`ına `click` dinleyip `window.open` çağırmak da işe
      yarardı, ama gerçek bir `<a>` bedavaya üç şey daha veriyor:
      klavyeyle sekme sırasına giriyor, orta tıkla/⌘-tıkla açılıyor ve
      sağ tık menüsünde "bağlantıyı kopyala" çıkıyor. Leaflet buna engel
      değil: DOM olaylarında `preventDefault`ı yalnızca `contextmenu`
      için çağırıyor, `click` için değil.
    */
    html: `
      <a
        href="${point.href}"
        target="_blank"
        rel="noopener noreferrer"
        class="area-pin area-pin--${point.labelSide}"
        aria-label="${escapeHtml(point.ariaLabel)}"
      >
        <span class="area-pin__dot" aria-hidden="true"></span>
        <span class="area-pin__label">${escapeHtml(point.name)}</span>
      </a>`,
    /*
      SIFIR BOYUT + SIFIR ÇAPA. Etiket metne göre değişken genişlikte,
      yani Leaflet'e verilebilecek doğru bir `iconSize` yok. Kökü sıfır
      boyutlu bırakıp konumlandırmayı CSS'e devretmek, işaretçinin
      referans noktasını tam olarak koordinatın üstüne oturtuyor; nokta
      ve etiket oradan `position: absolute` ile taşıyor.
    */
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

/** `html` dizesi elle kuruluyor — ad ve etiket buradan geçmek zorunda. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Yakınlaştırmaya göre etiketleri açıp kapatır — bkz. `LABEL_MIN_ZOOM`.
 * Sınıf harita KABININA yazılıyor, tek tek pinlere değil: dokuz elemanı
 * her `zoomend`de dolaşmak yerine tek bir sınıf değişimi.
 */
function LabelVisibility() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();

    const sync = () =>
      container.classList.toggle(
        "area-map--labelled",
        map.getZoom() >= LABEL_MIN_ZOOM,
      );

    sync();
    map.on("zoomend", sync);

    return () => {
      map.off("zoomend", sync);
    };
  }, [map]);

  return null;
}

/**
 * DOKUNMATİKTE TEK PARMAKLA KAYDIRMA — yalnızca yakınlaştırıldıktan sonra.
 *
 * ⚠️ SAYFA KAYDIRMASINI ÇALAN HATA BUYDU. Leaflet'te sürükleme açıkken
 * telefonda haritanın üstüne denk gelen bir parmak hareketi sayfayı değil
 * haritayı kaydırır: kullanıcı sayfayı aşağı indirmeye çalışırken ekran
 * yerinde çakılı kalır. Uzun bir sayfada 400px'lik bir tuzak.
 *
 * Çözüm haritayı ölü bir görsele çevirmek değil: varsayılan görünümde
 * ZATEN dokuz pinin hepsi çerçevede olduğu için kaydırılacak bir şey yok.
 * Parmakla yakınlaştıran biri ise artık çerçeve dışını görmek istiyordur —
 * sürükleme tam o anda açılıyor, geri uzaklaştırınca yeniden kapanıyor.
 *
 * Masaüstü etkilenmiyor (`L.Browser.mobile` false): fareyle sürükleme her
 * zaman açık, tekerlek yakınlaştırması ise ayrıca kapalı — aynı sebeple.
 */
function TouchDragGate() {
  const map = useMap();

  useEffect(() => {
    if (!L.Browser.mobile) return;

    /* Referans, `fitBounds` sonrası oturan yakınlaştırma. */
    const base = map.getZoom();

    const sync = () => {
      if (map.getZoom() > base) map.dragging.enable();
      else map.dragging.disable();
    };

    sync();
    map.on("zoomend", sync);

    return () => {
      map.off("zoomend", sync);
      /* Bileşen giderken kilidi bırak — bir sonraki montaj temiz başlasın. */
      map.dragging.enable();
    };
  }, [map]);

  return null;
}

/*
  ⚠️ ERİŞİLEBİLİR AD BURADA DEĞİL, SARMALAYICI `<div>`DE.

  İki sebep: `MapContainer` `role` prop'unu kabul etmiyor (tipleri
  `MapContainerProps` ile sınırlı), ve daha önemlisi — etiket kabın üstünde
  olduğunda harita YÜKLENİRKEN de yerinde duruyor. İşaretçinin kendisine
  bağlansaydı, iskelet gösterilirken sayfada adlandırılmamış bir boşluk
  olurdu. Bkz. about-turkey/page.tsx içindeki `.area-map` kabı.
*/
export function AreaMapCanvas({ points }: { points: AreaMapPoint[] }) {
  /*
    `bounds` yalnızca ilk render'da okunuyor (Leaflet `center`/`zoom` gibi
    davranır). Pinler sabit veri olduğu için bu doğru davranış: kullanıcı
    haritayı gezdirdikten sonra bir yeniden render onu başa sarmıyor.
  */
  const bounds = useMemo(
    () => L.latLngBounds(points.map((point) => [point.lat, point.lng])),
    [points],
  );

  const icons = useMemo(
    () => new Map(points.map((point) => [point.slug, pinIcon(point)])),
    [points],
  );

  return (
    <MapContainer
      bounds={bounds}
      /* Etiketler çerçevenin dibine yapışmasın diye cömert bir iç boşluk. */
      boundsOptions={{ padding: [56, 56] }}
      /*
        TEKERLEK YAKINLAŞTIRMASI KAPALI. Uzun bir sayfada imleç haritanın
        üstünden geçerken sayfa durup harita yakınlaşırdı. Yakınlaştırmanın
        kalan yolları açık: +/− düğmeleri, çift tıklama, dokunmatikte
        parmak arası.
      */
      scrollWheelZoom={false}
      /* Uzaklaşınca haritanın iki-üç kopyası yan yana dizilmesin. */
      worldCopyJump={false}
      minZoom={7}
      maxZoom={16}
      className="size-full"
      style={{ background: "var(--color-shell-deep, #f3efe7)" }}
    >
      <TileLayer
        url={TILE_URL}
        attribution={TILE_ATTRIBUTION}
        /*
          ⚠️ `detectRetina` KALDIRILDI — Positron'dan gelen bir ayardı.

          CARTO `{r}` yer tutucusuyla gerçek @2x karo sunuyor. OSM SUNMUYOR:
          `detectRetina` orada retina ekranlarda bir üst yakınlaştırma
          seviyesinden DÖRT KAT karo çekip küçültüyor. Yani her görüntüleme
          OSM'e dört kat istek demek — hem politika açısından yanlış hem de
          gereksiz yere yavaş.

          `subdomains` de gitti: `tile.openstreetmap.org` tek konak üzerinden
          servis ediyor, `{s}` biçimi kullanımdan kaldırıldı.
        */
        maxZoom={19}
      />

      <LabelVisibility />
      <TouchDragGate />

      {points.map((point) => (
        <Marker
          key={point.slug}
          position={[point.lat, point.lng]}
          icon={icons.get(point.slug)}
          /* Üst üste binen pinlerde imlecin altındaki öne gelsin. */
          riseOnHover
          /*
            Leaflet'in klavye desteği KAPALI ve bu bilinçli: işaretçinin
            kendisine `tabindex` verirse, içindeki `<a>` ile birlikte AYNI
            pin sekme sırasında iki durak olurdu. Odaklanması gereken
            bağlantı; o zaten doğal olarak odaklanabilir.
          */
          keyboard={false}
        />
      ))}
    </MapContainer>
  );
}
