import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * PROXY — Next.js 16'da `middleware.ts` bu ada dönüştü (davranış aynı).
 * Bkz. node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md
 *
 * ⚠️ BU BİR GÜVENLİK KATMANI DEĞİL, BİR KULLANICI DENEYİMİ KATMANI.
 *
 * Next.js dokümantasyonu bunu açıkça söylüyor: proxy "tam bir oturum
 * yönetimi veya yetkilendirme çözümü olarak kullanılmamalı" ve yalnızca
 * "iyimser kontroller" (optimistic checks) için uygundur. Sebep: proxy her
 * rotada, ÖN YÜKLENEN (prefetch) rotalar dâhil çalışır — burada veritabanı
 * veya imza doğrulaması yapmak her isteğe maliyet biner.
 *
 * Bu yüzden burada yalnızca ÇEREZİN VARLIĞINA bakılıyor, geçerliliğine
 * değil. Sahte bir çerezle bu kapıdan geçilebilir — ve geçilmesi sorun
 * değil, çünkü asıl kontrol `lib/admin/auth.ts` içindeki DAL'da, her sayfa
 * ve her route handler tarafından ayrı ayrı yapılıyor.
 *
 * Buradaki tek kazanç: oturumu olmayan ziyaretçi, panelin kabuğunu bir an
 * bile görmeden doğrudan giriş ekranına düşer.
 */

const ADMIN_COOKIE = "c2c_admin";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /* Giriş sayfasının kendisi korunamaz — yoksa sonsuz yönlendirme olur. */
  if (pathname === "/admin/login") return NextResponse.next();

  const hasSessionCookie = Boolean(request.cookies.get(ADMIN_COOKIE)?.value);

  if (!hasSessionCookie) {
    const loginUrl = new URL("/admin/login", request.url);

    /*
      Giriş sonrası kullanıcıyı gitmek istediği yere döndürmek için.
      Yalnızca PATHNAME taşınıyor, tam URL değil: istemciden gelen bir
      URL'yi olduğu gibi `redirect()`e vermek açık yönlendirme (open
      redirect) açığıdır — saldırgan `?next=https://kotu-site` yazar.
      Giriş eylemi bu değeri ayrıca "/admin ile başlamalı" diye süzüyor.
    */
    loginUrl.searchParams.set("next", pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  /*
    Yalnızca panel sayfaları. `/api/admin/*` BİLEREK dışarıda: bir API
    isteğinin 307 ile HTML giriş sayfasına yönlendirilmesi, fetch çağıran
    istemci için anlaşılmaz bir hata üretir. O rotalar DAL üzerinden
    temiz bir 401 JSON döndürüyor.
  */
  matcher: ["/admin/:path*"],
};
