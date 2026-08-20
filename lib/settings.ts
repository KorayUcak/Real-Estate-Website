import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import {
  contact as staticContact,
  siteConfig,
  social as staticSocial,
} from "@/lib/site";

/**
 * DÜZENLENEBİLİR SİTE AYARLARI — `data/settings.json`.
 *
 * `lib/site.ts` ile iş bölümü kasıtlı:
 *
 *   lib/site.ts        → KOD sabitleri. Gezinme listeleri, bölge tanımları,
 *                        tipler, ofis koordinatı. Bunlar içerik değil yapı.
 *   data/settings.json → İŞLETMENİN değiştirdiği alanlar. Ad, adres,
 *                        telefon, e-posta, sosyal medya. Admin buraya yazar.
 *
 * Varsayılanlar `lib/site.ts`ten geliyor: settings.json silinse veya bozulsa
 * bile site doğru NAP bilgisiyle ayakta kalır. Dosya, kodun ÜSTÜNE yazan bir
 * katman — kodun YERİNE geçen değil.
 */
export const SETTINGS_PATH = path.join(process.cwd(), "data", "settings.json");

export type SiteSettings = {
  /**
   * ⚠️ Yalnızca GÖRÜNEN metni etkiler (footer, iletişim sayfası, schema.org).
   * Sayfa başlıklarındaki "%s | …" şablonu ve OG görselindeki marka adı
   * `lib/site.ts` içindeki `siteConfig.name`den geliyor ve build sabitidir.
   * Gerekçe: marka adı `@id` URL'lerine ve metadata şablonlarına dokunuyor;
   * onu çalışma zamanında değiştirmek bir içerik düzenlemesi değil, bir
   * yeniden markalaşma işidir.
   */
  companyName: string;
  contact: {
    phoneDisplay: string;
    phoneE164: string;
    /**
     * İKİNCİ HAT — opsiyonel.
     *
     * Zorunlu olsaydı, alanı taşımayan eski bir `settings.json` (ve panelden
     * gelen her gövde) tip düzeyinde geçersiz olurdu. Opsiyonel olduğu için
     * eksik alan sessizce `lib/site.ts` varsayılanına düşüyor — dosyanın
     * "kodun ÜSTÜNE yazan katman" olma sözleşmesiyle aynı davranış.
     */
    phoneSecondaryDisplay?: string;
    phoneSecondaryE164?: string;
    whatsappNumber: string;
    email: string;
    openingHours: string;
    address: {
      full: string;
      street: string;
      district: string;
      city: string;
      country: string;
      countryName: string;
    };
  };
  social: {
    instagram: string;
    facebook: string;
    x: string;
    linkedin: string;
  };
  updatedAt: string;
};

/** Dosya okunamazsa/bozuksa dönülecek güvenli taban — koddaki değerler. */
export const DEFAULT_SETTINGS: SiteSettings = {
  companyName: siteConfig.name,
  contact: {
    phoneDisplay: staticContact.phoneDisplay,
    phoneE164: staticContact.phoneE164,
    phoneSecondaryDisplay: staticContact.phoneSecondaryDisplay,
    phoneSecondaryE164: staticContact.phoneSecondaryE164,
    whatsappNumber: staticContact.whatsappNumber,
    email: staticContact.email,
    openingHours: staticContact.openingHours,
    address: { ...staticContact.address },
  },
  social: { ...staticSocial, linkedin: "" },
  updatedAt: "",
};

/**
 * Alan alan birleştirme (tek seviyeli spread DEĞİL): JSON'da eksik bir alt
 * alan varsa yalnız o alan varsayılana düşer. `{...defaults, ...parsed}`
 * olsaydı `contact` nesnesi TAMAMEN değişir ve dosyada `email` yoksa
 * e-posta `undefined` olurdu — sayfada "undefined" yazan bir mailto: linki.
 */
export function mergeSettings(parsed: Partial<SiteSettings>): SiteSettings {
  return {
    companyName: parsed.companyName || DEFAULT_SETTINGS.companyName,
    contact: {
      ...DEFAULT_SETTINGS.contact,
      ...parsed.contact,
      address: {
        ...DEFAULT_SETTINGS.contact.address,
        ...parsed.contact?.address,
      },
    },
    social: { ...DEFAULT_SETTINGS.social, ...parsed.social },
    updatedAt: parsed.updatedAt ?? "",
  };
}

export const getSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const raw = await readFile(SETTINGS_PATH, "utf8");
    return mergeSettings(JSON.parse(raw) as Partial<SiteSettings>);
  } catch {
    return DEFAULT_SETTINGS;
  }
});

/**
 * Schema.org `sameAs` için düz liste — boş olanlar elenir.
 * Boş bir dize yayınlamak, Google'a var olmayan bir profil bildirmektir.
 */
export function socialProfileList(settings: SiteSettings): string[] {
  return Object.values(settings.social).filter(Boolean);
}

/**
 * WhatsApp derin bağlantısı.
 *
 * ⚠️ NUMARA ARTIK ZORUNLU BİR PARAMETRE. Eskiden `lib/site.ts` içindeki
 * sabitten okunuyordu; ayarlar panelden düzenlenebilir hâle gelince bu,
 * "yönetici numarayı değiştirir, 15 CTA eski numarayı aramaya devam eder"
 * demekti. Parametreyi opsiyonel yapmak da aynı hatayı sessizleştirirdi —
 * zorunlu olduğu için TypeScript her çağrı yerini işaretliyor ve unutulan
 * bir yer derlenmiyor.
 */
export function whatsappHref(whatsappNumber: string, message: string): string {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}
