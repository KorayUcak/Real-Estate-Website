import "server-only";

import { revalidatePath } from "next/cache";

/**
 * İlan verisi değiştikten sonra tazelenecek yollar — TEK LİSTE.
 *
 * Bu listeyi her uç noktada elle tekrarlamak, dördüncü uç nokta
 * eklendiğinde birinin unutulması demekti; sonuç da "kaydettim ama sitede
 * görünmüyor" şeklinde, sebebi kolay bulunmayan bir hata olurdu.
 *
 * Sayfalar statik üretiliyor, dolayısıyla bu çağrı OLMADAN diskteki JSON
 * değişse bile yayındaki HTML eski kalır.
 *
 * ─────────────────────────────────────────────────────────────────────
 * ⚠️ NEDEN HEM DESEN HEM DE BİREBİR YOL — ölçülmüş bir hata.
 *
 * Başlangıçta yalnızca `revalidatePath("/properties/[slug]", "page")`
 * çağrılıyordu. Ölçüm şunu gösterdi: build anında PRERENDER EDİLMİŞ bir
 * ilan silindiğinde `/properties/<slug>` adresi 404 değil, **200** dönmeye
 * devam ediyordu (`x-nextjs-cache: HIT`, `x-nextjs-prerender: 1`) — yani
 * silinen ilanın sayfası hâlâ yayındaydı. Hiç var olmamış bir slug doğru
 * biçimde 404 veriyordu; fark tam olarak build çıktısındaki o kayıttı.
 *
 * Bu, SEO açısından sessiz ama ciddi bir hata: satılmış ya da kaldırılmış
 * bir ilan dizinde kalır, üstelik arama motoruna "bu sayfa sağlıklı"
 * (200) der.
 *
 * Next.js dokümantasyonu ayrımı açıkça yapıyor: "Use a literal path when
 * you want to refresh a single page. Use a route pattern plus type to
 * refresh all matching pages." İkisi aynı şey değil — desen, o rotanın
 * gelecekte üretilecek çıktısını geçersiz kılıyor; build'den gelen SOMUT
 * bir kaydı düşürmek içinse birebir yol gerekiyor.
 *
 * Bu yüzden `slugs` parametresi var ve çağıranlar onu geçmek ZORUNDA:
 * güncellemede slug değiştiyse ESKİ ve YENİ slug'ın ikisi de verilmeli,
 * yoksa eski adres yayında kalır.
 */
export function revalidateProperties(...slugs: string[]): void {
  /* Ana sayfa: öne çıkanlar karuseli + bölge sayıları. */
  revalidatePath("/");

  /* Liste sayfası ve ItemList schema'sı. */
  revalidatePath("/properties");

  /*
    Dinamik segmentin TÜM örnekleri: her ilan sayfasının altında "diğer
    ilanlar" bloğu var, yani bir kaydın değişmesi diğerlerinin çıktısını
    da bayatlatıyor.
  */
  revalidatePath("/properties/[slug]", "page");

  /* Bölge kartlarındaki "şu an N ilan" sayacı. */
  revalidatePath("/about-turkey");

  /* lastModified ve yeni/silinen URL'ler. */
  revalidatePath("/sitemap.xml");

  /*
    Ve etkilenen HER ilanın birebir adresi — yukarıdaki nota bakın.
    Boş/yinelenen değerler eleniyor: `revalidatePath("/properties/")`
    yanlış bir kayıt hedefler.
  */
  for (const slug of new Set(slugs.filter(Boolean))) {
    revalidatePath(`/properties/${slug}`);
  }
}
