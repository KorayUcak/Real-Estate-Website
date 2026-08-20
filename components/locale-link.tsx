"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useLocale } from "@/components/locale-provider";
import { localizedPath, routeFromLanguage } from "@/lib/locale";

/**
 * DİL FARKINDA DAHİLİ BAĞLANTI.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * NEDEN GEREKLİ: rota tabanlı i18n'de bağlantılar dilin İÇİNDE kalmalı.
 * Türkçe okuyan biri /tr/properties sayfasında "İletişim"e tıkladığında
 * /tr/contact'a gitmeli. Ham `<Link href="/contact">` onu İngilizce sayfaya
 * atardı — ve bu, dil seçimini tek bir tıklamada sessizce kaybetmek demek.
 *
 * Kırk bağlantı noktasının her birine elle önek yazmak yerine tek bir
 * bileşen: `href` kanonik (öneksiz) biçimde yazılmaya devam eder, önek
 * burada eklenir. Yeni bir sayfa eklendiğinde kimsenin dili düşünmesi
 * gerekmiyor.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * ⚠️ NE ZAMAN KULLANILMAZ: `/admin` altındaki bağlantılar. Panelin dili
 * yok ve `app/admin` ağacı `[lang]` dışında yaşıyor; oraya önek eklemek
 * var olmayan bir rota üretir. Panel bileşenleri düz `<Link>` kullanmaya
 * devam ediyor.
 */
export function LocaleLink({
  href,
  ...props
}: Omit<ComponentProps<typeof Link>, "href"> & { href: string }) {
  const { language } = useLocale();

  /*
    Yalnızca KÖK GÖRELİ yollar çevrilir.

    Dışarıda kalanlar ve neden:
      "#area-gocek"  → sayfa içi çapa; önek eklemek onu bozar.
      "mailto:"/"tel:" → şema taşıyan bağlantılar.
      "https://…"    → dış site.
      "/admin/…"     → dilsiz ağaç (yukarıdaki nota bakın).

    Kontrol `startsWith("/")` üzerinden: bu testi geçen her şey sitenin
    kendi sayfası, geri kalanı olduğu gibi geçer.
  */
  const localized =
    href.startsWith("/") && !href.startsWith("/admin")
      ? localizedPath(href, routeFromLanguage(language))
      : href;

  return <Link href={localized} {...props} />;
}
