import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import type { Villa } from "@/lib/types";

/**
 * ⚠️ STATİK `import` → ÇALIŞMA ZAMANI OKUMASI. Bu dosyanın tamamı bu yüzden değişti.
 *
 * Eskiden burada `import villasJson from "@/data/villas.json"` vardı. O satır
 * veriyi BUILD ANINDA modül grafiğine gömer: derlenmiş çıktı, dosyanın o anki
 * kopyasını içerir. Yani admin paneli `data/villas.json`u diske yazsa bile
 * yayındaki site ESKİ kopyayı sunmaya devam ederdi — CMS çalışıyor görünür,
 * hiçbir değişiklik siteye yansımazdı. Bu, JSON tabanlı bir CMS'in sessizce
 * hiçbir şey yapmamasının en yaygın sebebi.
 *
 * Artık dosya her render'da diskten okunuyor. Sayfalar STATİK KALMAYA devam
 * ediyor: build sırasında bir kez okunup prerender ediliyorlar, admin bir
 * kayıt yazdıktan sonra `revalidatePath` çağırınca ilgili sayfa bir sonraki
 * istekte yeniden üretiliyor (ISR). Yani hız aynı, veri taze.
 *
 * `cache()` React'in render-pass memoizasyonu: tek bir sayfa render'ında
 * `getAllVillas()` + `getVillasByArea()` + `getFeaturedVillas()` üç kez
 * çağrılsa bile dosya BİR KEZ okunur.
 *
 * `server-only`: bu modül artık `node:fs` kullanıyor. Bir istemci bileşeni
 * yanlışlıkla import ederse build ANINDA hata versin istiyoruz — çalışma
 * zamanında anlaşılmaz bir bundler hatasıyla değil.
 */
export const VILLAS_PATH = path.join(process.cwd(), "data", "villas.json");

const readVillasFile = cache(async (): Promise<Villa[]> => {
  const raw = await readFile(VILLAS_PATH, "utf8");
  const parsed: unknown = JSON.parse(raw);

  /*
    Dosya elle veya admin paneli üzerinden bozulursa TÜM site 500 verir.
    Boş diziye düşmek, sitenin "ilan yok" göstermesi demek — kötü, ama
    tamamen çökmesinden iyi. Hata loglanır çünkü sessizce boş liste
    döndürmek teşhis edilemez bir arıza olurdu.
  */
  if (!Array.isArray(parsed)) {
    console.error(`[villas] ${VILLAS_PATH} bir dizi değil — boş liste dönülüyor.`);
    return [];
  }

  return parsed as Villa[];
});

/**
 * HAM liste — `off-market` kayıtlar DÂHİL.
 *
 * Yalnızca admin paneli içindir: yönetici yayından kaldırdığı bir ilanı
 * panelde görmeye devam etmeli, yoksa geri yayınlayamaz. Herkese açık
 * hiçbir sayfa bunu çağırmamalı.
 */
export async function getAllVillasForAdmin(): Promise<Villa[]> {
  return readVillasFile();
}

export async function getAllVillas(): Promise<Villa[]> {
  const villas = await readVillasFile();
  return villas.filter((villa) => villa.status !== "off-market");
}

export async function getFeaturedVillas(limit = 3): Promise<Villa[]> {
  const villas = await getAllVillas();

  return villas
    .filter((villa) => villa.featured)
    .sort((a, b) => b.price.gbp - a.price.gbp)
    .slice(0, limit);
}

export async function getVillaBySlug(slug: string): Promise<Villa | undefined> {
  const villas = await readVillasFile();
  return villas.find((villa) => villa.slug === slug);
}

export async function getVillasByArea(areaSlug: string): Promise<Villa[]> {
  const villas = await getAllVillas();
  return villas.filter((villa) => villa.location.areaSlug === areaSlug);
}

/** generateStaticParams için — tüm ilan sayfaları build anında üretilir. */
export async function getAllVillaSlugs(): Promise<string[]> {
  const villas = await getAllVillas();
  return villas.map((villa) => villa.slug);
}

/**
 * Bölge → yayındaki ilan sayısı.
 *
 * Üç sayfa (ana sayfa, /properties, /about-turkey) bölge kartlarında sayı
 * gösteriyor ve üçü de aynı şeyi `serviceAreas.map(a => getVillasByArea(a.slug).length)`
 * ile hesaplıyordu. Getter'lar async olunca o kalıp `Promise.all` sarmalayıcısı
 * gerektiriyor; tek bir sözlük döndürmek hem çağrı yerlerini sadeleştiriyor
 * hem de listeyi bir kez dolaşıyor.
 */
export async function getAreaCounts(): Promise<Record<string, number>> {
  const villas = await getAllVillas();

  return villas.reduce<Record<string, number>>((counts, villa) => {
    const slug = villa.location.areaSlug;
    counts[slug] = (counts[slug] ?? 0) + 1;
    return counts;
  }, {});
}
