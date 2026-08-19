import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * /robots.txt build anında üretilir.
 * `host` ve `sitemap` alanları, tarayıcıya kanonik alan adını ve URL listesini
 * doğrudan bildirir — yeni ilanların keşfedilme süresini ciddi biçimde kısaltır.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          /*
            Yönetim paneli. Bu satır panelin GİZLENDİĞİ anlamına gelmez —
            robots.txt herkese açık bir dosyadır ve burada bir yol saymak,
            onu meraklı birine DUYURMAK demektir. Asıl koruma oturum
            kapısıdır (lib/admin/auth.ts); bu kural yalnızca panelin
            arama sonuçlarında indekslenmesini önler.
          */
          "/admin",
          "/api/",
          "/_next/",
          // Arama sonucu / filtre kombinasyonları kopya içerik üretir.
          "/*?*sort=",
          "/*?*page=",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
