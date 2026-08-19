import Script from "next/script";

/**
 * Microsoft Clarity (heatmap + session recording).
 *
 * `afterInteractive`: sayfa etkileşimli hâle geldikten sonra yüklenir, yani
 * LCP/INP gibi Core Web Vitals metriklerini bloklamaz. Analitik script'lerini
 * `beforeInteractive` ile yüklemek klasik bir performans hatasıdır.
 *
 * Proje kimliği .env.local içinde NEXT_PUBLIC_CLARITY_PROJECT_ID olarak tanımlanır;
 * tanımlı değilse (ör. yerel geliştirmede) script hiç render edilmez.
 */
export function Clarity() {
  const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

  if (!projectId) return null;

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
