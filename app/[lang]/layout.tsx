import type { Metadata, Viewport } from "next";
import { Inter, Montserrat, Playfair_Display } from "next/font/google";
import { notFound } from "next/navigation";
import { lang as langParam } from "next/root-params";
import {
  isRouteLocale,
  LANGUAGE_META,
  languageFromRoute,
  ROUTE_LOCALES,
} from "@/lib/locale";
import { siteConfig, SITE_URL } from "@/lib/site";
import "../globals.css";

/**
 * next/font fontları build anında indirir ve kendi domain'imizden servis eder:
 * Google Fonts'a giden üçüncü taraf isteği, dolayısıyla ekstra DNS/TLS el sıkışması yok.
 * `display: swap` metnin font yüklenirken görünür kalmasını sağlar (CLS + LCP dostu).
 *
 * ────────────────────────────────────────────────────────────────────────
 * TİPOGRAFİ EŞLEŞMESİ — Montserrat + Inter.
 *
 * ⚠️ BU AİLE BİR KEZ DEĞİŞTİ VE GERİ DÖNDÜ. Sıra: Montserrat → Playfair
 * Display → Montserrat. Playfair'e geçişin gerekçesi ("otorite kontrasttan
 * gelir, ağırlıktan değil") yanlış değildi; marka sahibinin istediği ton
 * değişti — serif başlıklar "fazla yumuşak" bulundu.
 *
 * MONTSERRAT (başlıklar): geometrik grotesk, 800 kesitte dizilir. Otorite
 * bu ailede doğrudan ağırlıktan ve dar harf aralığından geliyor. 900
 * (Black) bilinçli olarak dışarıda: büyük harfle dizilen başlıklarda harf
 * içleri kapanıyor ve başlık okunacak bir metin olmaktan çıkıp bir bloğa
 * dönüşüyor.
 *
 * INTER (gövde + arayüz): değişmedi. Yüksek x-height, açık harf formları,
 * ekranda yorulmayan bir okuma tabanı.
 *
 * PLAYFAIR DISPLAY: artık YALNIZCA logo kelime işareti için yükleniyor,
 * başlıklar için değil. Gerekçe tanımının başında.
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

/** Inter = gövde metni ve arayüz. Nötr, yoğun bilgi bloklarında yorulmayan bir grotesk. */
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
 * ⚠️ HERKESE AÇIK SİTENİN KÖK LAYOUT'U — <html>/<body> kabuğu.
 *
 * Site kabuğu (başlık, footer, dil/para birimi bağlamı, arka plan silueti,
 * schema.org düğümleri, rıza katmanı, Clarity) `(site)/layout.tsx`te.
 *
 * ─────────────────────────────────────────────────────────────────────
 * ARTIK İKİ KÖK LAYOUT VAR: burası ve `app/admin/layout.tsx`.
 *
 * Zorunlu oldu, tercih değil. Rota tabanlı i18n her sayfayı `app/[lang]/`
 * altına taşıyor; panel ise dil almamalı (/tr/admin diye bir şey yok,
 * yönetici arayüzü tek dilde). Panel bu ağacın altında kalsaydı ya
 * anlamsız bir dil öneki taşırdı ya da `[lang]` segmentine "admin"
 * değerini sokardı.
 *
 * `app/layout.tsx` bu yüzden KALDIRILDI: Next'te kök layout, üstünde
 * başka layout olmayan layout'tur; iki dal da kendi kökünü tanımlıyor.
 * BEDELİ: vitrin ile panel arasındaki geçiş tam sayfa yüklemesi olur
 * (docs/layout.md "Caveats"). Kabul edilebilir — kimse gün içinde
 * /properties ile /admin arasında gidip gelmiyor, ve panel zaten ayrı bir
 * oturum arkasında.
 *
 * Fontlar ve `metadataBase` iki kökte de tanımlı olmak zorunda; ikisi de
 * `next/font` üzerinden aynı dosyaları paylaştığı için ikinci bir indirme
 * oluşmuyor.
 * ─────────────────────────────────────────────────────────────────────
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f2337",
  colorScheme: "light",
};

/**
 * ÜÇ DİLİN HEPSİ STATİK ÜRETİLİR.
 *
 * `dynamicParams = false`: listede olmayan bir `[lang]` değeri (ör. /de/…)
 * çalışma zamanında render EDİLMEZ, doğrudan 404 döner. Bu olmasaydı
 * /xx/properties gibi sonsuz sayıda adres geçerli sayılır ve her biri
 * İngilizce içeriğin bir kopyasını yayınlardı — tarama bütçesini yiyen
 * klasik bir yinelenen içerik kaynağı.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return ROUTE_LOCALES.map((lang) => ({ lang }));
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  /*
    `next/root-params`: [lang] kök layout'un ÜSTÜNDE bir dinamik segment
    olduğu için değeri buradan okunuyor ve altındaki HER sunucu bileşeni
    aynı getter'ı prop geçmeden çağırabiliyor (Next 16). Eskiden bunun için
    dili on beş sayfanın props zincirinden geçirmek gerekirdi.
  */
  const locale = await langParam();

  /* Tip daraltma + savunma: proxy zaten yalnızca geçerli önekleri geçiriyor
     ama layout bunu varsaymamalı. */
  if (!isRouteLocale(locale)) notFound();

  const language = languageFromRoute(locale);
  const htmlLang = LANGUAGE_META[language].tag;

  return (
    <html
      /*
        ARTIK GERÇEKTEN DEĞİŞİYOR. Site kısmen çevriliyken bu nitelik
        sabit "en-GB" idi ve öyle olması doğruydu (gerekçe lib/locale.ts).
        Rota tabanlı i18n ile sayfa gövdesi de çevrildiği için işaret artık
        belgenin köküne ait: /tr adresindeki bir sayfa baştan sona Türkçe.
      */
      lang={htmlLang}
      className={`${montserrat.variable} ${playfair.variable} ${inter.variable} h-full`}
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
