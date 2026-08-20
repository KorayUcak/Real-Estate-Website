import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEFAULT_ROUTE_LOCALE, isRouteLocale } from "@/lib/locale";

/**
 * PROXY — Next.js 16'da `middleware.ts` bu ada dönüştü (davranış aynı).
 * Bkz. node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md
 *
 * İKİ AYRI İŞ YAPIYOR ve ikisi de burada olmak zorunda çünkü ikisi de
 * isteğin sayfaya ULAŞMASINDAN ÖNCE karar veriyor:
 *
 *   1. /admin için iyimser oturum kontrolü  (aşağıdaki uyarıya bakın)
 *   2. Dil öneki yönlendirmesi              (/properties → /en/properties)
 */

const ADMIN_COOKIE = "c2c_admin";

/**
 * `app/` kökünde yaşayan, DİLİ OLMAYAN rotalar.
 *
 * Bunlar `app/[lang]/` altında değil — dosya konvansiyonu gereği kökte
 * duruyorlar. Yeniden yazma kapsamına girselerdi `/sitemap.xml` isteği
 * `/en/sitemap.xml`e gider ve var olmayan bir rotaya düşerdi.
 *
 * Uzantılı her yol (`.xml`, `.txt`, `.png`, `.ico`) aşağıdaki matcher
 * tarafından zaten eleniyor; bu liste yalnızca UZANTISIZ olanlar için.
 */
const ROOT_ROUTES = new Set([
  "/opengraph-image",
  "/twitter-image",
  "/manifest.webmanifest",
]);

/**
 * ⚠️ ADMIN KONTROLÜ BİR GÜVENLİK KATMANI DEĞİL, BİR DENEYİM KATMANI.
 *
 * Next.js dokümantasyonu bunu açıkça söylüyor: proxy "tam bir oturum
 * yönetimi veya yetkilendirme çözümü olarak kullanılmamalı" ve yalnızca
 * "iyimser kontroller" için uygundur. Sebep: proxy her rotada, ÖN YÜKLENEN
 * rotalar dâhil çalışır — burada veritabanı veya imza doğrulaması yapmak
 * her isteğe maliyet biner.
 *
 * Bu yüzden yalnızca ÇEREZİN VARLIĞINA bakılıyor, geçerliliğine değil.
 * Sahte bir çerezle bu kapıdan geçilebilir — ve geçilmesi sorun değil,
 * çünkü asıl kontrol `lib/admin/auth.ts` içindeki DAL'da, her sayfa ve her
 * route handler tarafından ayrı ayrı yapılıyor.
 */
function guardAdmin(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  /* Giriş sayfasının kendisi korunamaz — yoksa sonsuz yönlendirme olur. */
  if (pathname === "/admin/login") return NextResponse.next();

  if (request.cookies.get(ADMIN_COOKIE)?.value) return NextResponse.next();

  const loginUrl = new URL("/admin/login", request.url);

  /*
    Giriş sonrası kullanıcıyı gitmek istediği yere döndürmek için.
    Yalnızca PATHNAME taşınıyor, tam URL değil: istemciden gelen bir URL'yi
    olduğu gibi `redirect()`e vermek açık yönlendirme açığıdır — saldırgan
    `?next=https://kotu-site` yazar. Giriş eylemi bu değeri ayrıca
    "/admin ile başlamalı" diye süzüyor.
  */
  loginUrl.searchParams.set("next", pathname);

  return NextResponse.redirect(loginUrl);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) return guardAdmin(request);
  if (ROOT_ROUTES.has(pathname)) return NextResponse.next();

  const segment = pathname.split("/")[1];

  /*
    /en/… → /… KALICI YÖNLENDİRME.

    Dosya sisteminde İngilizce gerçekten `[lang]="en"` altında yaşıyor,
    yani /en/properties fiziksel olarak GEÇERLİ bir rota. Elde bırakılsaydı
    her İngilizce sayfa iki adresten yayınlanırdı — canonical etiketi
    Google'a hangisinin asıl olduğunu söyler ama yine de tarama bütçesi
    harcanır ve dahili linklerin bir kısmı yanlış adrese gider.

    308 (301 değil): yöntemi ve gövdeyi korur. Form gönderimi bir dil
    önekine denk gelirse POST, GET'e düşmez.
  */
  if (segment === DEFAULT_ROUTE_LOCALE) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(`/${DEFAULT_ROUTE_LOCALE}`.length) || "/";
    return NextResponse.redirect(url, 308);
  }

  /* /tr/… ve /ru/… zaten doğru adreste — dokunulmuyor. */
  if (isRouteLocale(segment)) return NextResponse.next();

  /*
    ÖNEKSİZ İSTEK → İÇERİDE /en/… OLARAK ÇÖZÜLÜR.

    `rewrite`, `redirect` DEĞİL: adres çubuğunda /properties kalır, Next
    içeride app/[lang]/(site)/properties/page.tsx dosyasını `lang="en"`
    ile render eder. Yönlendirme kullanılsaydı birincil pazarın her adresi
    bir atlama daha uzar ve /en öneki kullanıcıya görünürdü — tam olarak
    kaçınmak istediğimiz şey (gerekçe lib/locale.ts).
  */
  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_ROUTE_LOCALE}${pathname}`;

  return NextResponse.rewrite(url);
}

export const config = {
  /*
    Kapsam: /admin (oturum) + herkese açık her sayfa (dil).

    Dışarıda bırakılanlar:
      api        → dili yok; JSON uçları bir dil önekiyle 404 olurdu.
      _next      → derleyici çıktısı ve görsel optimizasyonu.
      uzantılılar→ `.xml`, `.txt`, `.ico`, `.png`… yani sitemap, robots ve
                   public/ altındaki her dosya. Nokta içeren yol testi
                   (`.*\\..*`) bunların hepsini tek kuralda eliyor.
  */
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
