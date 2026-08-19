"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LayoutDashboard, LogOut, Settings } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/cn";

/**
 * ÜST GEZİNME — kenar çubuğu yerine.
 *
 * İstemci bileşeni olmasının tek sebebi `usePathname`: aktif sekmeyi
 * işaretlemek için. Oturum durumu sunucudan prop olarak geliyor, burada
 * okunmuyor — istemci bileşenleri DAL'ı import edemez (ve etmemeli).
 */

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/properties", label: "Properties", icon: Building2, exact: false },
  { href: "/admin/settings", label: "Settings", icon: Settings, exact: false },
] as const;

export function AdminTopBar({ isAuth }: { isAuth: boolean }) {
  const pathname = usePathname();

  /*
    Dashboard `/admin` üzerinde oturuyor ve her admin rotası bu önekle
    başlıyor — `startsWith` kullansaydık Dashboard sekmesi HER sayfada
    aktif görünürdü. `exact` bayrağı tam olarak bunu ayırıyor.
  */
  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-shell/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[110rem] items-center gap-4 px-5 sm:gap-8 sm:px-8">
        {/*
          Logo panelde de duruyor ama BAĞLANTI DEĞİL — daha doğrusu, siteye
          değil panelin köküne bağlanıyor. Yönetici içerik düzenlerken
          yanlışlıkla vitrine düşüp sekmesini kaybetmesin.
        */}
        <Link
          href="/admin"
          aria-label="Admin dashboard"
          className="shrink-0 py-3"
        >
          <Logo variant="horizontal" decorative className="h-9 w-auto text-sea-deep" />
        </Link>

        {/*
          Oturum yokken sekmeler GİZLİ. Giriş ekranında görünmelerinin tek
          sonucu, tıklayan kullanıcının aynı ekrana geri düşmesiydi — var
          olmayan bir yetkiyi ima eden ölü bağlantılar.
        */}
        <nav aria-label="Admin" className="flex-1">
          <ul className="flex items-center gap-1 sm:gap-2">
            {(isAuth ? NAV : []).map((item) => {
              const active = isActive(item.href, item.exact);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    /*
                      Aktif sekme ALTTAN çizgiyle işaretleniyor, dolgu
                      rengiyle değil: dolgu, üst bandı bir düğme sırasına
                      çeviriyordu. `-mb-px` çizgiyi başlığın kendi alt
                      kenarlığının üzerine oturtuyor, 1px kayma olmuyor.
                    */
                    className={cn(
                      "-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-4 font-sans text-[0.8125rem] font-medium transition-colors sm:px-4",
                      active
                        ? "border-gold text-sea-deep"
                        : "border-transparent text-ink-40 hover:text-sea",
                    )}
                  >
                    <item.icon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          {/*
            Siteyi görüntüle — yeni sekmede. Yönetici değişikliğini canlı
            sayfada kontrol etmek isteyecek ve bunu panelden çıkmadan
            yapabilmeli.
          */}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden font-sans text-xs uppercase tracking-[0.14em] text-ink-40 transition-colors hover:text-sea md:inline"
          >
            View site ↗
          </a>

          {isAuth ? (
            /*
              Çıkış bir <form> POST'u, bağlantı değil: GET ile durum
              değiştiren bir uç nokta, tarayıcı ön yüklemesi veya bir
              <img> etiketi tarafından tetiklenebilir.
            */
            <form action="/api/admin/logout" method="post">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-sm border border-line px-3 py-2 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-70 transition-colors hover:border-sea hover:text-sea"
              >
                <LogOut className="size-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </header>
  );
}
