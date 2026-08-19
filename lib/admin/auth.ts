import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin/session";

/**
 * DATA ACCESS LAYER — yetki kontrolünün TEK yeri.
 *
 * ⚠️ NEDEN LAYOUT'TA KONTROL YETMİYOR. Next.js kimlik doğrulama rehberi bu
 * konuda açık (node_modules/next/dist/docs/01-app/02-guides/authentication.md,
 * "Layouts and auth checks"): bir layout, altındaki rota segmentlerinin render
 * edilip edilmeyeceğini KONTROL ETMEZ. Segmentleri router render eder; layout
 * onları gizlese bile kod çalışır ve çıktı RSC payload'ına girer. Üstelik
 * layout'lar kısmi render nedeniyle her gezinmede yeniden çalışmaz — yani
 * oturum her rota değişiminde kontrol edilmez.
 *
 * Bu yüzden kontrol veriye EN YAKIN yerde yapılır: her admin sayfası ve her
 * yazma yapan route handler kendi başına `requireAdmin()` / `assertAdmin()`
 * çağırır. `app/admin/layout.tsx` yalnızca kabuğu (üst menü) çizer.
 *
 * `cache()`: tek render'da birden çok bileşen çağırsa bile çerez bir kez
 * çözülür ve karar bir kez verilir.
 */
export const getAdminSession = cache(async (): Promise<{ isAuth: boolean }> => {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return { isAuth: verifySessionToken(token) };
});

/**
 * SAYFALAR için. Oturum yoksa /admin/login'e yönlendirir.
 *
 * `redirect()` bir istisna fırlatarak çalışır, dolayısıyla bu çağrıdan sonra
 * yazılan kod yetkisiz istekte HİÇ çalışmaz — istediğimiz davranış bu.
 */
export async function requireAdmin(): Promise<void> {
  const { isAuth } = await getAdminSession();
  if (!isAuth) redirect("/admin/login");
}

/**
 * ROUTE HANDLER'LAR için. Yönlendirme değil, 401 döner.
 *
 * Kullanımı bilinçli olarak "erken dönüş" kalıbında:
 *
 *   const denied = await assertAdmin();
 *   if (denied) return denied;
 *
 * Dönen değer `Response | null` olduğu için çağıran tarafın onu kontrol
 * etmesi TypeScript tarafından zorlanmaz — ama boolean dönen bir sürüm
 * (`if (!await isAdmin())`) unutulmaya çok daha açıktı; burada dönen nesne
 * doğrudan `return` edilebilir bir cevap olduğu için doğru kullanım en
 * kısa kullanım oluyor.
 */
export async function assertAdmin(): Promise<Response | null> {
  const { isAuth } = await getAdminSession();

  if (isAuth) return null;

  return Response.json(
    { error: "Unauthorized" },
    {
      status: 401,
      /* Panel bir tarayıcı arayüzü; tarayıcının kendi parola kutusunu
         açmaması için WWW-Authenticate başlığı BİLİNÇLİ olarak yok. */
      headers: { "Cache-Control": "no-store" },
    },
  );
}
