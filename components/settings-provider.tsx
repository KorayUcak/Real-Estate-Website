"use client";

import { createContext, useContext } from "react";
import type { SiteSettings } from "@/lib/settings";

/**
 * AYARLARIN İSTEMCİ TARAFI KÖPRÜSÜ.
 *
 * `lib/settings.ts` `server-only` ve `node:fs` kullanıyor — bir istemci
 * bileşeni onu import EDEMEZ. Ama telefon numarası ve WhatsApp bağlantısı
 * tam olarak istemci bileşenlerinde lazım (başlık, talep paneli, formlar).
 *
 * NEDEN PROP DRILLING DEĞİL: `contact.phoneDisplay` başlıkta, çekmecede,
 * talep panelinde, iki formda ve inline CTA'da geçiyor. Bunları prop olarak
 * taşımak, aradaki her bileşene ilgilenmediği bir parametre eklemek
 * demekti — ve yeni bir tüketici eklendiğinde zinciri baştan kurmak.
 *
 * Bağlam sunucudan BİR KEZ dolduruluyor: `(site)/layout.tsx` `getSettings()`
 * çağırıp değeri buraya veriyor. İstemcide hiçbir istek yapılmıyor, yani
 * numara ilk boyamada hazır — `LocaleProvider` ile aynı kalıp.
 */

const SettingsContext = createContext<SiteSettings | null>(null);

export function SettingsProvider({
  value,
  children,
}: {
  value: SiteSettings;
  children: React.ReactNode;
}) {
  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings(): SiteSettings {
  const context = useContext(SettingsContext);

  /*
    Sessizce varsayılana düşmek yanlış olurdu: sağlayıcı unutulduğunda site
    ÇALIŞIR ama eski/yanlış bir telefon numarası gösterir — teşhisi zor,
    sonucu doğrudan kayıp müşteri olan bir hata. Erken ve gürültülü patla.
  */
  if (!context) {
    throw new Error("useSettings must be used inside <SettingsProvider>.");
  }

  return context;
}

/**
 * İstemci tarafı WhatsApp bağlantısı. `lib/settings.ts` içindeki
 * `whatsappHref` ile aynı işi yapar ama o modül `server-only`;
 * mantık tek satır olduğu için kopyalamak, ayrı bir paylaşılan modül
 * kurmaktan ucuz.
 */
export function useWhatsappLink(message: string): string {
  const { contact } = useSettings();
  return `https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
