import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { LegalBody } from "@/components/legal-body";
import { PageHero } from "@/components/page-hero";
import { LEGAL_LAST_UPDATED, privacySections } from "@/lib/legal";
import { breadcrumbSchema } from "@/lib/schema";
import { currentLocale } from "@/lib/current-locale";
import { getT } from "@/lib/i18n/server";
import { HOME_CRUMB, pageMetadata, type Crumb } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

/**
 * ⚠️ METİN HUKUKÇU ONAYINDAN GEÇMEDİ — gerekçesi ve kontrol listesi
 * `lib/legal.ts` başında. Bu dosya yalnızca dizgi ve metadata.
 */

const PAGE_TITLE = "Privacy Policy";
const PAGE_DESCRIPTION =
  "How Coast 2 Coast Properties Turkey collects, uses and protects the personal information you share when you enquire about a property in Fethiye.";

const CRUMBS: Crumb[] = [
  HOME_CRUMB,
  { name: "Privacy Policy", path: "/privacy-policy" },
];

export async function generateMetadata(): Promise<Metadata> {
  const locale = await currentLocale();

  return pageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: "/privacy-policy",
    locale,
  });
}

export default async function PrivacyPolicyPage() {
  const t = await getT();
  /* Şirket künyesi panelden geliyor — hukuki metindeki adres ile footer'daki
     adresin ayrışması mümkün değil. */
  const settings = await getSettings();

  return (
    <>
      <JsonLd schema={[breadcrumbSchema(CRUMBS)]} />

      <main id="main">
        {/*
          PageHero'ya GÖRSEL VERİLMİYOR. Diğer iç sayfalarda manzara bandı
          var; hukuki bir belgede fotoğraf, metni okunacak bir şey olmaktan
          çıkarıp süse çevirir. Görselsiz varyant `veil-tint` zemine düşüyor,
          yani tipografi ve dikey ritim sitenin geri kalanıyla aynı kalırken
          sayfanın tonu değişiyor.
        */}
        <PageHero
          eyebrow="Legal"
          title="Privacy Policy"
          lede="What we collect when you enquire, why we collect it, who sees it and what you can ask us to do with it."
          crumbs={CRUMBS}
        />

        <section aria-labelledby="privacy-body" className="bg-shell py-section">
          <div className="container-page">
            <h2 id="privacy-body" className="sr-only">{t("common.privacyFull")}</h2>

            <p className="eyebrow text-ink-40">
              Last updated {LEGAL_LAST_UPDATED}
            </p>

            <div className="mt-8 sm:mt-10">
              <LegalBody sections={privacySections(settings)} />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
