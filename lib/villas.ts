import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import type { Villa } from "@/lib/types";
import { coerceLocalized } from "@/lib/localized";

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

  return (parsed as Villa[]).map(normalizeLocalizedFields);
});

/**
 * ⚠️ OKUMA SINIRINDA TEK SAVUNMA NOKTASI.
 *
 * `title`/`description`/`whyThisOne` artık üç dilli nesneler (bkz.
 * lib/localized.ts) ve `data/villas.json` `scripts/migrate-villas-i18n.mjs`
 * ile dönüştürüldü. Ama dosya elle de düzenlenebiliyor ve bir yedekten geri
 * yüklenebiliyor: eski biçimde (`title: "Villa Mavi"`) tek bir kayıt bile
 * gelirse `getLocalizedField` onda `.en` arar, `undefined` bulur ve ekranda
 * SESSİZ bir boşluk kalır — tipler bunu yakalayamaz çünkü JSON `unknown`.
 *
 * Burada bir kez normalize etmek, o kaydı okuyan onlarca yerin tek tek
 * savunma yazmasından iyi.
 */
function normalizeLocalizedFields(villa: Villa): Villa {
  return {
    ...villa,
    title: coerceLocalized<string>(villa.title),
    description: coerceLocalized<string[]>(villa.description),
    /* İkinci dalga: bunlar da düz değerden üç dilliye geçti. Göç edilmemiş
       bir dosya (ya da `adapt-villas.js` çıktısı) hâlâ düz gelebilir. */
    headline: coerceLocalized<string>(villa.headline),
    features: coerceLocalized<string[]>(villa.features),
    seo: {
      ...villa.seo,
      title: coerceLocalized<string>(villa.seo?.title),
      description: coerceLocalized<string>(villa.seo?.description),
      keywords: villa.seo?.keywords ?? [],
    },
    /* Opsiyonel alan: YOKSA yok kalsın — boş bir kayıt uydurmak,
       ilan sayfasında olmayan bir bölümü var göstermek olurdu. */
    whyThisOne:
      villa.whyThisOne === undefined
        ? undefined
        : coerceLocalized<string[]>(villa.whyThisOne),
  };
}

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

/**
 * PORTFÖYDE GEÇEN TÜM ÖZELLİKLER — panel formundaki açılır listeyi besler.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * NEDEN SABİT BİR DİZİ DEĞİL. Listeyi koda gömmek onu ilk özel özellik
 * eklendiği anda eskitirdi: yönetici "Wine cellar" yazar, kayda girer, ama
 * bir sonraki ilanda açılır listede yine yoktur ve yeniden yazması gerekir —
 * bu sefer "Wine Cellar" diye. İki hafta sonra veride üç varyant olur ve
 * hiçbiri filtrelenemez. Listeyi veriden türetmek bu döngüyü kırıyor:
 * bir kez yazılan özellik ertesi ilanda seçilebilir hâle geliyor.
 *
 * `getAllVillasForAdmin` kullanılıyor, `getAllVillas` değil: yayından
 * kaldırılmış bir ilandaki özellik de meşru bir seçenek. Panelde
 * çağrıldığı için görünürlük filtresi burada yanlış olurdu.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Sıralama ALFABETİK, sıklığa göre değil. Sıklık sırası listeyi her kayıtta
 * yeniden diziyor; yönetici "Sea view"in nerede olduğunu kas hafızasıyla
 * öğrenemiyor. Sabit bir sıra, otuz maddelik bir listede aramaktan hızlı.
 */
export async function getKnownFeatures(): Promise<string[]> {
  const villas = await getAllVillasForAdmin();

  /*
    Tekilleştirme KÜÇÜK HARFE göre, ama ekrana ilk görülen yazım çıkıyor.
    Veride "Sea view" ve "Sea View" birlikte bulunabilir; ikisini de listeye
    koymak yöneticiye aynı şeyi iki kez sunmak olurdu.
  */
  const seen = new Map<string, string>();

  for (const villa of villas) {
    /*
      ⚠️ LİSTE `en` ÜZERİNDEN KURULUYOR, aktif dilden değil.

      Bu seçici yönetici formunda duruyor ve rozetlerin KANONİK yazımını
      öneriyor. Aktif dilden beslenseydi, Türkçe çevirisi girilmiş bir
      rozet ("Deniz manzarası") listeye ayrı bir madde olarak düşer,
      yönetici onu seçtiğinde `en` alanına Türkçe bir değer yazılırdı —
      yani kanonik dil sessizce bozulurdu.
    */
    for (const feature of villa.features.en) {
      const key = feature.trim().toLowerCase();
      if (key && !seen.has(key)) seen.set(key, feature.trim());
    }
  }

  return [...seen.values()].sort((a, b) =>
    /* `localeCompare` düz `<` yerine: "Çift cam" gibi Türkçe karakterli bir
       özellik ASCII sıralamasında listenin sonuna düşerdi. */
    a.localeCompare(b, "en"),
  );
}
