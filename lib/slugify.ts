/**
 * URL/dosya adı güvenli segment üretimi — SUNUCU VE İSTEMCİ ORTAK.
 *
 * Ortak olması şart: form, yönetici başlığı yazarken slug'ın canlı
 * önizlemesini gösteriyor. İstemci farklı bir kural uygularsa yönetici
 * "villa-mavi" görür, sunucu "villa-mavi-2" kaydeder ve fotoğraflar
 * başka bir klasöre yazılır. Tek bir uygulama, tek bir sonuç.
 *
 * ⚠️ YOL AŞIMI (path traversal) SAVUNMASI DA BURADA. Yüklenen görselin
 * klasörü bu fonksiyonun çıktısından türetiliyor; `../../../etc` gibi bir
 * değer temizlenmezse dosya `public/` dışına yazılır. Beyaz liste
 * yaklaşımı (yalnızca a-z, 0-9 ve tire) kara listeden güvenli: kaçırılacak
 * bir karakter yok.
 */

/** Türkçe harfler — NFD ayrıştırması bunları tek başına çözmez. */
const TURKISH: Record<string, string> = {
  ı: "i",
  İ: "i",
  ş: "s",
  Ş: "s",
  ğ: "g",
  Ğ: "g",
  ü: "u",
  Ü: "u",
  ö: "o",
  Ö: "o",
  ç: "c",
  Ç: "c",
};

export function slugify(value: string, maxLength = 80): string {
  return value
    .replace(/[ıİşŞğĞüÜöÖçÇ]/g, (char) => TURKISH[char] ?? char)
    .toLowerCase()
    /* NFD + birleşen işaretleri at: "é" → "e", "å" → "a". */
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    /* `slice` sondaki tireyi geri getirebilir — "villa-mavi-" gibi. */
    .replace(/-+$/g, "");
}
