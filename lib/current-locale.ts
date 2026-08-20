import { lang as langParam } from "next/root-params";
import {
  DEFAULT_ROUTE_LOCALE,
  isRouteLocale,
  languageFromRoute,
  type LanguageCode,
  type RouteLocale,
} from "@/lib/locale";

/**
 * GEÇERLİ DİL — sunucu tarafı tek okuma noktası.
 *
 * `next/root-params` yalnızca sunucu bileşenlerinde çalışıyor, bu yüzden
 * ayrı bir modülde duruyor: `lib/seo.ts` içine konsaydı o dosyayı tip için
 * içe aktaran bir istemci bileşeni derlemeyi düşürürdü.
 *
 * Doğrulama burada bir kez yapılıyor. `[lang]` teoride her dizeyi taşıyabilir
 * — pratikte `dynamicParams = false` bunu üçe kilitliyor ama katman
 * bunu varsaymamalı: geçersiz değer sessizce İngilizceye düşer, sayfa
 * çökmez.
 */
export async function currentLocale(): Promise<RouteLocale> {
  const value = await langParam();
  return isRouteLocale(value) ? value : DEFAULT_ROUTE_LOCALE;
}

/** Sözlük araması için `LanguageCode` biçimi (EN/TR/RU). */
export async function currentLanguage(): Promise<LanguageCode> {
  return languageFromRoute(await currentLocale());
}
