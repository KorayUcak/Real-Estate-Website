"use client";

import dynamic from "next/dynamic";
import type { AreaMapPoint } from "@/components/area-map-canvas";

/**
 * BÖLGE HARİTASI — /about-turkey#areas bölümünün üst bloğu.
 *
 * Bu dosyanın tek işi SINIRI KORUMAK: Leaflet'i sunucudan uzak tutmak ve
 * karolar inene kadar ekranda düzgün bir iskelet bırakmak. Haritanın kendisi
 * `area-map-canvas.tsx` içinde.
 *
 * ⚠️ `ssr: false` ZORUNLU. `area-map-canvas.tsx` Leaflet'i modül seviyesinde
 * import ediyor, Leaflet ise import anında `window`a bakıyor. Sunucuda render
 * edilmeye çalışılırsa derleme değil ÇALIŞMA ZAMANI hatası verir.
 *
 * Bu çağrının bir İSTEMCİ bileşeninin içinde olması da şart: `ssr: false`
 * sunucu bileşenlerinde desteklenmiyor. Sayfanın kendisi sunucu bileşeni
 * olduğu için araya bu ince kabuk giriyor.
 *
 * Hidrasyon uyuşmazlığı da aynı sebeple imkânsız: sunucu bu ağacın yerine
 * yalnızca aşağıdaki iskeleti basar, harita ilk istemci render'ında belirir —
 * iki taraf hiçbir zaman farklı bir DOM üretmez.
 */

/**
 * ⚠️ `dynamic` MODÜL SEVİYESİNDE — bileşenin içinde DEĞİL.
 *
 * Render sırasında çağrılsaydı her render yeni bir lazy bileşen üretir,
 * React onu yeni bir tip sanar ve haritayı her seferinde söküp sıfırdan
 * kurardı: kullanıcının yakınlaştırması ve kaydırması her state
 * değişiminde sıfırlanırdı. (`react-hooks/static-components` kuralının
 * yakaladığı hata tam olarak bu.)
 */
const AreaMapCanvas = dynamic(
  () => import("@/components/area-map-canvas").then((m) => m.AreaMapCanvas),
  {
    ssr: false,
    /*
      İSKELET METİNSİZ, ve bu bilinçli: `loading` modül seviyesinde
      tanımlandığı için çeviri sözlüğüne erişemez, İngilizce sabit bir
      "Loading map…" ise sayfanın geri kalanı Türkçe/Rusçayken sırıtırdı.
      Nabız atan bir zemin dilden bağımsız olarak aynı şeyi söylüyor.

      Kabın tamamını (`size-full`) kaplıyor — yer tutmayan bir yükleyici,
      karolar indiği anda altındaki bölge kartlarını aşağı iter ve sayfanın
      en görünür yerinde bir düzen sıçraması (CLS) üretirdi.
    */
    loading: () => (
      <div className="size-full animate-pulse bg-shell-deep" aria-hidden="true" />
    ),
  },
);

export function AreaMap({ points }: { points: AreaMapPoint[] }) {
  return <AreaMapCanvas points={points} />;
}

export type { AreaMapPoint };
