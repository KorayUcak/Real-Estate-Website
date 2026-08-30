import reviewsJson from "@/data/reviews.json";

/**
 * MÜŞTERİ YORUMLARI — statik veri, çalışma zamanı okuması yok.
 *
 * ⚠️ `lib/villas.ts` GİBİ DEĞİL, `lib/posts.ts` GİBİ. İlanlar diskten her
 * render'da okunuyor çünkü yönetici paneli onları yazıyor; yorumların
 * paneli yok ve elle düzenleniyorlar. Statik `import` build anında modül
 * grafiğine giriyor: sıfır dosya sistemi erişimi, sıfır çalışma zamanı
 * maliyeti. Dosya değiştiğinde yeni bir dağıtım gerekiyor — on satırlık
 * bir dosya için doğru takas.
 *
 * ⚠️ YORUM METİNLERİ ÇEVRİLMİYOR — bilinçli ve önemli.
 *
 * Bunlar Google profilinden gelen GERÇEK müşteri cümleleri. Bir kişinin
 * yazdığı değerlendirmeyi makineyle Türkçeleştirip tırnak içinde ona
 * atfetmek, söylemediği bir cümleyi söyletmek olur. Sayfanın çevrilen
 * kısmı yalnızca ARAYÜZ: başlık, açıklama, yıldız etiketi, CTA.
 * Yorumun kendisi yazıldığı dilde kalıyor.
 */

export type Review = {
  id: string;
  authorName: string;
  /** Sayfa yalnızca 5 yıldızlıları yayımlıyor; alan yine de veride tutuluyor. */
  rating: number;
  /** ISO 8601 (YYYY-MM-DD) — ekranda aktif dile göre biçimleniyor. */
  date: string;
  text: string;
};

/**
 * Yayımlanacak yorumlar — EN YENİSİ ÖNCE.
 *
 * Sıralama veri dosyasına bırakılmadı: dosya elle düzenleniyor ve yeni bir
 * yorum büyük ihtimalle sona eklenecek. Tarihe göre sıralamak, o eklemenin
 * sayfanın en altında kaybolmasını engelliyor.
 *
 * `slice()` önce: `sort` diziyi YERİNDE değiştiriyor ve statik import
 * modül düzeyinde paylaşılan tek bir nesne — sıralamayı doğrudan uygulamak
 * o modülü içe aktaran her yerin sırasını da değiştirirdi.
 */
export function getReviews(): Review[] {
  return (reviewsJson as Review[])
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));
}
