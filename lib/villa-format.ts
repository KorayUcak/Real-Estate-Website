import { getServiceArea } from "@/lib/site";
import type { Villa } from "@/lib/types";

/**
 * İLAN KAYDI ÜZERİNDE SAF YARDIMCILAR — istemcide de çalışır.
 *
 * NEDEN `lib/villas.ts`ten AYRILDILAR. O modül artık `node:fs` ile diskten
 * okuyor ve `server-only` ile işaretli. `enquiry-panel.tsx` bir istemci
 * bileşeni ve yalnızca `villaSummaryLine`a ihtiyaç duyuyordu — yani saf,
 * veri okumayan bir fonksiyon için tüm dosya sistemi katmanını istemci
 * paketine sürüklüyordu. `server-only` bunu build hatası olarak yakaladı.
 *
 * Buradaki iki fonksiyon da yalnızca kendisine VERİLEN kaydı dönüştürür;
 * hiçbir şey okumaz. Bu yüzden her iki tarafta da güvenle kullanılabilir.
 */

/** "4 bed · 3 bath · 265 m²" gibi kısa özet satırı. */
export function villaSummaryLine(
  villa: Pick<Villa, "bedrooms" | "bathrooms" | "buildSizeSqm">,
): string {
  /*
    0 bir ölçü değil, "bilinmiyor" demek — taşınan üç ilanda `buildSizeSqm`
    boş geldi. "0 m²" basmak yanlış bilgi olurdu, o yüzden segment düşüyor.
  */
  return [
    villa.bedrooms > 0 ? `${villa.bedrooms} bed` : null,
    villa.bathrooms > 0 ? `${villa.bathrooms} bath` : null,
    villa.buildSizeSqm > 0 ? `${villa.buildSizeSqm} m²` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * Haritada kullanılabilir koordinat — ya da null.
 *
 * WordPress taşımasında 57 ilanın 21'i Houzez'in varsayılan pin'i ile geldi:
 * 25.68654, -80.431345. Bu MIAMI, FLORIDA. Bir ilan sayfasında o pin'i
 * göstermek, mülkün yerini yanlış beyan etmektir.
 *
 * Bu yüzden koordinat DOĞRUDAN okunmaz; harita çizen her bileşen bu
 * fonksiyondan geçmek zorundadır:
 *   - gerçek koordinat varsa onu döner,
 *   - yoksa bölgenin merkezini döner (yaklaşık ama doğru şehirde),
 *   - bölge de çözülemiyorsa null döner ve harita HİÇ render edilmez.
 */
export function safeMapCoordinates(
  villa: Villa,
): { lat: number; lng: number; approximate: boolean } | null {
  if (!villa.location.isPlaceholder) {
    return { ...villa.location.coordinates, approximate: false };
  }

  const area = getServiceArea(villa.location.areaSlug);
  if (area) return { ...area.coordinates, approximate: true };

  return null;
}
