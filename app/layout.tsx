import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { siteConfig, SITE_URL } from "@/lib/site";
import "./globals.css";

/**
 * next/font fontları build anında indirir ve kendi domain'imizden servis eder:
 * Google Fonts'a giden üçüncü taraf isteği, dolayısıyla ekstra DNS/TLS el sıkışması yok.
 * `display: swap` metnin font yüklenirken görünür kalmasını sağlar (CLS + LCP dostu).
 *
 * ────────────────────────────────────────────────────────────────────────
 * TİPOGRAFİ EŞLEŞMESİ — Playfair Display + Inter.
 *
 * Önceki kurulum iki groteskti (Montserrat + Roboto) ve bilinçli bir
 * tercihti: "yatırım platformu gibi görünmek". Sonuç fazla yumuşak ve fazla
 * genel geçitti — geometrik, yuvarlak harfli bir başlık ailesi lüks emlakta
 * otorite değil, teknoloji ürünü çağrışımı yapıyor.
 *
 * PLAYFAIR DISPLAY (başlıklar): yüksek kontrastlı, dikey eksenli bir
 * didone. İnce tırnakları ve keskin geçişleri büyük puntoda pahalı
 * görünür; emlak ilanı ve otel dünyasının yerleşik sesi bu.
 *
 * INTER (gövde + arayüz): tam tersi iş için. Yüksek x-height, açık harf
 * formları, ekranda yorulmayan bir okuma tabanı. Kontrast bilinçli:
 * başlık konuşur, gövde susar.
 *
 * KESİTLER: Playfair'den 500/600/700 alınıyor. 800/900 KASITLI olarak dışarıda —
 * yüksek kontrastlı bir serifi en ağır kesitinde büyük harfle dizmek
 * tırnakları ezip ucuz bir "poster" etkisi veriyor. Bu ailenin otoritesi
 * ağırlıktan değil, kontrasttan geliyor.
 */
const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"], // latin-ext: Türkçe ş/ğ/ı karakterleri
  variable: "--font-playfair",
  display: "swap",
  weight: ["500", "600", "700"],
});

/** Inter = gövde metni ve arayüz. Nötr, yoğun bilgi bloklarında yorulmayan bir grotesk. */
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  /**
   * metadataBase olmadan OG/canonical alanlarında göreli yol kullanılamaz.
   * Bu tanım sayesinde alt sayfalar sadece "/properties/..." yazıp geçebilir.
   */
  metadataBase: new URL(SITE_URL),

  /**
   * `template`: alt sayfalar yalnızca kendi başlığını verir, marka adı
   * otomatik eklenir. `default` ise ana sayfanın kendi başlığını ezmez —
   * ana sayfa page.tsx içinde `absolute` ile kendi başlığını belirler.
   */
  title: {
    default: `${siteConfig.name} | Luxury Villas for Sale in Fethiye`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,

  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name, url: SITE_URL }],
  creator: siteConfig.name,
  publisher: siteConfig.legalName,
  category: "real estate",

  /**
   * Canonical, kök seviyede tanımlanır ve her sayfada kendi yolu ile ezilir.
   * `languages`: şu an tek dilli yayındayız; TR içerik eklendiğinde
   * /tr rotası açılıp burası hreflang çiftine dönüşecek.
   */
  alternates: {
    canonical: "/",
    languages: {
      "en-GB": "/",
    },
  },

  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: "/",
    siteName: siteConfig.name,
    title: `${siteConfig.name} | Luxury Villas for Sale in Fethiye`,
    description: siteConfig.description,
  },

  twitter: {
    card: "summary_large_image",
    site: "@coast2coastpro",
    creator: "@coast2coastpro",
    title: `${siteConfig.name} | Luxury Villas for Sale in Fethiye`,
    description: siteConfig.description,
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large", // Google'ın büyük görsel önizlemesi = daha yüksek CTR
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  /** Telefon numaralarının iOS'ta otomatik linklenip tasarımı bozmasını engeller. */
  formatDetection: { telephone: false, address: false, email: false },

  // TODO: Search Console doğrulaması tamamlandığında kodu ekleyin.
  // verification: { google: "..." },
};

/**
 * ⚠️ BU LAYOUT ARTIK YALNIZCA <html>/<body> KABUĞU.
 *
 * Site kabuğu (başlık, footer, dil/para birimi bağlamı, arka plan silueti,
 * schema.org düğümleri, Clarity) `app/(site)/layout.tsx`e taşındı.
 *
 * SEBEP: /admin bu ağacın altında yaşıyor ve kök layout header/footer'ı
 * render ettiği sürece yönetim paneli, herkese açık sitenin gezinme
 * çubuğunun ve 30+ bağlantılı footer'ının ARASINDA görünüyordu. Brief
 * panelin "tam genişlik, minimal, odaklanmış" olmasını ve vitrine
 * bağlanmamasını istiyor; ikisi de bu ayrım olmadan mümkün değildi.
 *
 * `(site)` bir ROTA GRUBU: parantezli klasör adı URL'e girmez, yani
 * `app/(site)/page.tsx` hâlâ `/` adresini karşılar. Tek bir kök layout
 * korunuyor — iki ayrı kök layout kurmak, gruplar arası her geçişte tam
 * sayfa yeniden yüklemesi demekti (bkz. route-groups.md "Caveats").
 *
 * Fontlar ve `metadataBase` burada KALIYOR: ikisini de her iki taraf
 * kullanıyor ve ikinci bir kopya, iki ayrı font indirmesi anlamına gelirdi.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f2337",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-GB"
      className={`${playfair.variable} ${inter.variable} h-full`}
      /*
        Next 16 artık gezinme sırasında `scroll-behavior`'ı kendiliğinden
        devre dışı bırakmıyor. globals.css'te html için `scroll-behavior:
        smooth` tanımlı olduğundan, sayfa geçişlerinde eski davranışı
        (anında yukarı atlama) istiyorsak bunu açıkça bildirmemiz gerekiyor.
      */
      data-scroll-behavior="smooth"
      /*
        Eklentiler (parola yöneticileri, tema/erişilebilirlik uzantıları)
        <html> üzerine sunucuda olmayan sınıf ve öznitelikler enjekte eder.
        Bu, uygulamanın kendi hatası olmadığı hâlde hidrasyon uyarısı
        üretir; uyarıyı yalnızca BU eleman için susturuyoruz.
      */
      suppressHydrationWarning
    >
      <head>
        {/* Kur servisi için erken bağlantı — ilk fetch'te RTT kazandırır. */}
        <link rel="preconnect" href="https://open.er-api.com" />
      </head>
      <body className="flex min-h-full flex-col font-sans text-ink">
        {children}
      </body>
    </html>
  );
}
