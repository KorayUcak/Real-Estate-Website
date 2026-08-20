import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { LegalBody } from "@/components/legal-body";
import { PageHero } from "@/components/page-hero";
import { LEGAL_LAST_UPDATED, termsSections } from "@/lib/legal";
import { breadcrumbSchema } from "@/lib/schema";
import { currentLocale } from "@/lib/current-locale";
import { getT } from "@/lib/i18n/server";
import { HOME_CRUMB, pageMetadata, type Crumb } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

/**
 * ⚠️ METİN HUKUKÇU ONAYINDAN GEÇMEDİ — gerekçesi ve kontrol listesi
 * `lib/legal.ts` başında. Bu dosya yalnızca dizgi ve metadata.
 */

const PAGE_TITLE = "Terms of Use";
const PAGE_DESCRIPTION =
  "The terms on which you may use the Coast 2 Coast Properties Turkey website, including how to read our property listings and converted prices.";

const CRUMBS: Crumb[] = [HOME_CRUMB, { name: "Terms", path: "/terms" }];

export async function generateMetadata(): Promise<Metadata> {
  const locale = await currentLocale();

  return pageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: "/terms",
    locale,
  });
}

export default async function TermsPage() {
  const t = await getT();
  const settings = await getSettings();

  return (
    <>
      <JsonLd schema={[breadcrumbSchema(CRUMBS)]} />

      <main id="main">
        {/* Görselsiz hero — gerekçe /privacy-policy sayfasında. */}
        <PageHero
          eyebrow="Legal"
          title="Terms of Use"
          lede="How to read what we publish here — the listings, the guides and the converted prices — and the basis on which you use this site."
          crumbs={CRUMBS}
        />

        <section aria-labelledby="terms-body" className="bg-shell py-section">
          <div className="container-page">
            <h2 id="terms-body" className="sr-only">{t("common.termsFull")}</h2>

            <p className="eyebrow text-ink-40">
              Last updated {LEGAL_LAST_UPDATED}
            </p>

            <div className="mt-8 sm:mt-10">
              <LegalBody sections={termsSections(settings)} />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
