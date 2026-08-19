import type { Metadata } from "next";
import { AdminTopBar } from "@/components/admin/admin-top-bar";
import { getAdminSession } from "@/lib/admin/auth";

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
  );
}
