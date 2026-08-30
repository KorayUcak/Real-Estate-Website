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
  /*
    SAYI, dize değil: gerçek yorumlar 1..10 diye numaralandı. Tip `string`
    kalsaydı `reviewsJson as Review[]` dönüşümü derlenmezdi — TypeScript
    örtüşmeyen iki tip arasında `as` kullanılmasına izin vermiyor. Yani
    veri ile tipin ayrışması sessizce geçmiyor, derlemede duruyor.
  */
  id: number;
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
 * ⚠️ `sort` DİZİYİ YERİNDE DEĞİŞTİRİR ve statik import modül düzeyinde
 * paylaşılan TEK bir nesne — doğrudan sıralamak, o modülü içe aktaran her
 * yerin sırasını da kalıcı olarak değiştirirdi. Burada güvenli olmasının
 * sebebi `filter`ın zaten YENİ bir dizi döndürmesi; `sort` o kopyayı
 * diziyor. (Önceki sürümde bu işi başta duran bir `slice()` yapıyordu;
 * `filter` eklenince gereksizleşti.)
 */
export function getReviews(): Review[] {
  return (reviewsJson as Review[])
    .filter(isUsable)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * BOZUK KAYIT SAYFAYA ÇIKMAZ.
 *
 * `reviewsJson as Review[]` DENETLENMEYEN bir dönüşüm: TypeScript JSON'un
 * içeriğini doğrulamıyor, yalnızca öyle olduğunu varsayıyor. Bu dosya elle
 * düzenleniyor — on gerçek yorum Google'dan tek tek yapıştırılacak — ve
 * tek bir yazım hatası (`author` yerine `authorName`) tipe takılmadan
 * ekrana "undefined" olarak basılırdı. `rating` eksikse ortalama da `NaN`
 * olur ve rozette "NaN" yazardı.
 *
 * Eleme SESSİZ DEĞİL: hatalı kayıt listeden düşünce yorum sayısı da düşer,
 * yani gözden kaçmaz. Alternatif olan "hata fırlat" ise 227 sayfanın
 * tamamının derlemesini durdururdu — tek bir yorumdaki virgül hatası için
 * orantısız bir ceza.
 */
function isUsable(review: Review): boolean {
  return (
    typeof review?.authorName === "string" &&
    review.authorName.trim().length > 0 &&
    typeof review?.text === "string" &&
    review.text.trim().length > 0 &&
    typeof review?.date === "string" &&
    Number.isFinite(review?.rating)
  );
}
