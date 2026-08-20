"use client";

import Script from "next/script";
import { useConsent } from "@/components/consent-provider";

/**
 * Microsoft Clarity (heatmap + oturum kaydı) — RIZAYA BAĞLI.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * ⚠️ BU BİLEŞENİN TEK İŞİ ŞUNU GARANTİ ETMEK: kullanıcı "Accept all"
 * demeden clarity.ms'e TEK BİR İSTEK GİTMEZ.
 *
 * Eskiden bu bir sunucu bileşeniydi ve script'i koşulsuz basıyordu; yani
 * her ziyaretçi, hiçbir şey seçmeden önce izleniyordu. UK PECR reg. 6
 * altında bunun adı ihlal.
 *
 * NEDEN "yükle ama pasifleştir" DEĞİL: bazı kurulumlar script'i yükleyip
 * `clarity("consent", false)` çağırır. Bu yetmez — script'i indirmek zaten
 * clarity.ms'e IP adresini ve referrer'ı taşıyan bir istek demektir ve
 * PECR'ın yasakladığı şey tam olarak rıza öncesi bu erişim. Doğru olan
 * script'i HİÇ RENDER ETMEMEK; React ağaçta olmayan bir <Script> için ağ
 * isteği yapmaz.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `afterInteractive`: rıza verildikten sonra bile ölçüm, Core Web Vitals'ı
 * bloklamayan aşamada yükleniyor.
 *
 * Proje kimliği `.env.local` içinde NEXT_PUBLIC_CLARITY_PROJECT_ID;
 * tanımlı değilse (yerel geliştirme) script zaten hiç render edilmez.
 */
export function Clarity() {
  const { analyticsAllowed } = useConsent();
  const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

  if (!analyticsAllowed || !projectId) return null;

  return (
    <Script id="ms-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", ${JSON.stringify(projectId)});`}
    </Script>
  );
}
