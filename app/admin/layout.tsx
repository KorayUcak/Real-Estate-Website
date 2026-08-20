import type { Metadata, Viewport } from "next";
import { Inter, Montserrat, Playfair_Display } from "next/font/google";
import { AdminTopBar } from "@/components/admin/admin-top-bar";
import { getAdminSession } from "@/lib/admin/auth";
import { SITE_URL } from "@/lib/site";
import "../globals.css";

/**
 * PANELİN KÖK LAYOUT'U.
 *
 * Rota tabanlı i18n gelene kadar burası sıradan bir iç layout'tu ve
 * <html>/<body> kabuğunu `app/layout.tsx`ten miras alıyordu. Vitrinin
 * tamamı `app/[lang]/` altına taşınınca o kök ortadan kalktı: panelin dil
 * öneki almaması gerektiği için onu da taşımak yanlış olurdu (/tr/admin
 * diye bir yönetim paneli yok).
 *
 * Dolayısıyla panel artık KENDİ kökü. Fontlar ve globals.css burada
 * yeniden tanımlanıyor — `next/font` aynı dosyaları paylaştığı için
 * ikinci bir indirme oluşmuyor, yalnızca CSS değişkenleri bu ağaçta da
 * tanımlı hâle geliyor.
 *
 * `lang="en"` SABİT ve doğru: panel tek dilli.
 */
const montserrat = Montserrat({
  subsets: ["latin", "latin-ext"], // latin-ext: Türkçe ş/ğ/ı karakterleri
  variable: "--font-montserrat",
  display: "swap",
  /*
    600 ve 700 de alınıyor: başlıkların tamamı 800 değil. Kart başlıkları
    ve panel etiketleri daha hafif kesitlerde diziliyor ve tarayıcının
    eksik kesiti sentezlemesine (fake bold) izin vermek, geometrik bir
    ailede harf formlarını gözle görülür biçimde bozar.
  */
  weight: ["600", "700", "800"],
});

/**
 * SADECE MARKA İŞARETİ İÇİN — başlıklar için DEĞİL.
 *
 * Başlıklar Montserrat'a geçti; logo geçmedi ve bu bilinçli. `logo.tsx`
 * içindeki SVG geometrisi Playfair'in kapital yüksekliğine ve genişliğine
 * göre ayarlanmış: metin taban çizgileri, çatı ile kelime işareti
 * arasındaki 7 birimlik optik boşluk ve viewBox yüksekliği o orana
 * bağlı. Aileyi değiştirmek logoyu "güncellemek" değil, yeniden çizmek
 * demek — Montserrat aynı puntoda belirgin şekilde daha geniş, ortalanmış
 * kelime işareti 280 birimlik viewBox'tan taşardı.
 *
 * Tek kesit (600) indiriliyor: yığın `--font-playfair` tanımsız kalsaydı
 * logo sistem serifine (Georgia/Palatino) düşerdi ve marka işareti
 * ziyaretçinin işletim sistemine göre değişirdi — bir lüks markada kabul
 * edilemez.
 */
const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["600"],
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f2337",
  colorScheme: "light",
};

/**
 * ADMIN KABUĞU — üst menü, kenar çubuğu YOK.
 *
 * ⚠️ BU LAYOUT BİR GÜVENLİK SINIRI DEĞİLDİR. Yalnızca kabuğu çizer.
 * Gerçek yetki kontrolü her `page.tsx` ve her route handler içinde
 * `requireAdmin()` / `assertAdmin()` ile yapılır — gerekçesi
 * `lib/admin/auth.ts` başında.
 *
 * Buradaki `getAdminSession()` çağrısı yalnızca üst menünün "çıkış yap"
 * düğmesini gösterip göstermeyeceğine karar vermek için; korumaya
 * KATKISI YOK ve olduğu sanılmamalı.
 *
 * DÜZEN KARARLARI:
 *   - Kenar çubuğu yok: içerik tam genişlik kullanıyor. İlan tablosu ve
 *     ilan formu geniş, çok sütunlu yapılar; 260px'lik sabit bir çubuk
 *     tam da en çok ihtiyaç duyulan yerden yer çalıyordu.
 *   - Zemin `shell-deep`, kartlar `shell`: sitenin krem paleti korunuyor
 *     ama panel bir ton koyu zeminle "arka oda" gibi duruyor, vitrin gibi
 *     değil. Yönetici hangi tarafta olduğunu bir bakışta anlıyor.
 */
export const metadata: Metadata = {
  /**
   * ⚠️ İKİNCİ KÖK LAYOUT'UN KENDİ `metadataBase`İ OLMAK ZORUNDA.
   *
   * Bu alan `app/[lang]/layout.tsx` içinde zaten tanımlıydı, ama metadata
   * layout'lar arasında MİRAS ALINMIYOR — panel ayrı bir kök (rota tabanlı
   * i18n'de vitrin `app/[lang]/` altına taşınınca zorunlu oldu). Sonuç:
   * build her panel rotası için "metadataBase not set, using
   * http://localhost:3000" uyarısı veriyordu.
   *
   * Panel `noindex` olsa bile bu önemli: uyarı gerçek bir eksikliği
   * gösteriyor ve göreli bir OG yolu eklenirse sessizce localhost'a
   * çözülürdü.
   *
   * SABİT DEĞİL `SITE_URL`: alan adı tek kaynaktan geliyor (lib/site.ts) ve
   * canonical, hreflang, sitemap, schema `@id` ile OG url alanlarının
   * tamamı aynı yerden besleniyor. Buraya elle bir alan adı yazmak, o
   * zincirin dışında kalan tek değer olurdu.
   */
  metadataBase: new URL(SITE_URL),
  title: "Admin — Coast 2 Coast",
  /*
    Panel arama motorlarına KAPALI. robots.ts'teki disallow kuralı
    taramayı engeller, bu meta etiketi ise başka bir yerden link gelirse
    dizine girmeyi engeller — ikisi farklı işler yapar ve ikisi de gerekli.
  */
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLayout({
  children,
}: LayoutProps<"/admin">) {
  const { isAuth } = await getAdminSession();

  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${playfair.variable} ${inter.variable} h-full`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-sans text-ink">
    <div className="flex min-h-screen flex-col bg-shell-deep">
      <AdminTopBar isAuth={isAuth} />

      {/*
        `flex-1` + `w-full`: içerik alanı kalan yüksekliği kaplıyor, böylece
        kısa sayfalarda bile zemin rengi ekranın altına kadar iniyor.
        `max-w-[110rem]` tam genişliği sonsuza bırakmıyor — 1760px üstünde
        tablo satırları okunamayacak kadar uzuyordu.
      */}
      <main className="mx-auto w-full max-w-[110rem] flex-1 px-5 py-8 sm:px-8 sm:py-10">
        {children}
      </main>
    </div>
      </body>
    </html>
  );
}
