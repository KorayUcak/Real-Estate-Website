import { Clarity } from "@/components/clarity";
import { JsonLd } from "@/components/json-ld";
import { LocaleProvider } from "@/components/locale-provider";
import { SiteFooter } from "@/components/site-footer";
import { SettingsProvider } from "@/components/settings-provider";
import { SiteHeader } from "@/components/site-header";
import Image from "next/image";
import { getRates } from "@/lib/currency";
import { imagery } from "@/lib/imagery";
import { organizationSchema, websiteSchema } from "@/lib/schema";
import { getSettings } from "@/lib/settings";

/**
 * HERKESE AÇIK SİTENİN KABUĞU.
 *
 * `(site)` bir rota grubu — parantez URL'e girmez, dolayısıyla buradaki
 * `page.tsx` hâlâ `/` adresini karşılar. Grubun tek amacı, başlık/footer
 * ve dil-para birimi bağlamını /admin'den AYIRMAK: yönetim paneli aynı
 * kök layout'un altındayken vitrinin gezinme çubuğunu ve footer'ını
 * miras alıyordu.
 *
 * Kök layout (app/layout.tsx) artık yalnızca <html>/<body> ve fontlar.
 */
export default async function SiteLayout({ children }: LayoutProps<"/">) {
  /**
   * Kurlar sunucuda çözülür (12 saatlik cache). Böylece istemci ekstra istek
   * yapmaz, ilk boyamada fiyatlar hazırdır ve sayfalar statik kalmaya devam eder.
   */
  const rates = await getRates();

  /* Ayarlar sunucuda bir kez okunuyor; istemci bileşenleri bağlamdan alıyor. */
  const settings = await getSettings();

  return (
    <>
      {/*
        ÖLÜDENİZ SİLUETİ — sabit arka plan katmanı.

        `position: fixed` bir katman + üstünden akan yarı saydam bölümler:
        kullanıcı kaydırdıkça manzara yerinde durur, içerik onun üzerinden
        geçer. Klasik parallax hissi, tek bir boyama katmanıyla.

        Neden `background-attachment: fixed` DEĞİL: iOS Safari bu değeri
        pratikte desteklemiyor (arka planı `scroll` gibi çizip kaydırmada
        tırmalanma yaratıyor). Sabit konumlu bir eleman her yerde aynı
        çalışır — mobil öncelikli olmanın bedeli bu ayrıntı.

        `-z-10` + şeffaf body: katman sayfa içeriğinin arkasında ama
        html'in taban renginin önünde durur.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 select-none overflow-hidden"
      >
        <Image
          src={imagery.silhouette.src}
          alt=""
          fill
          sizes="100vw"
          /*
            Dekoratif olduğu için `priority` yok — LCP yarışında gerçek
            hero görselinin önüne geçmemeli.

            opacity-[0.22]: bölüm tülleriyle çarpıldıktan sonra en açık
            bölümde ~%12 net görünürlük veren değer. Tek başına yüksek
            duruyor gibi görünse de siluet hiçbir zaman çıplak
            gösterilmiyor; üstünde daima bir tül var.
          */
          className="object-cover opacity-[0.22]"
        />
        {/*
          Çok hafif bir dikey geçiş: siluetin en üst ve en alt kenarını
          zemine bağlar. Önceki sürümde bu katman neredeyse opak beyazdı
          ve siluetin görünürlüğünü tek başına yok ediyordu.
        */}
        <div className="absolute inset-0 bg-gradient-to-b from-shell/60 via-transparent to-shell/40" />
      </div>

      {/* Klavye ve ekran okuyucu kullanıcıları için içeriğe atlama bağlantısı */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:bg-sea-deep focus:px-5 focus:py-3 focus:text-sm focus:text-shell"
      >
        Skip to content
      </a>

      {/*
        Kurumsal kimlik ve site düğümü kök layout'ta bir kez basılır:
        her sayfada tekrarlanan Organization bloğu yerine tek @id referansı,
        Google'ın entity grafiğinde tek ve tutarlı bir kayıt oluşturur.
      */}
      <JsonLd schema={[organizationSchema(settings), websiteSchema()]} />

      <SettingsProvider value={settings}>
        <LocaleProvider rates={rates}>
          <SiteHeader />
          {children}
          <SiteFooter settings={settings} />
        </LocaleProvider>
      </SettingsProvider>

      <Clarity />
    </>
  );
}
