import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Car,
  Check,
  HeartPulse,
  Home,
  MessageCircle,
  Phone,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import { FaqAccordion } from "@/components/faq-accordion";
import { JsonLd } from "@/components/json-ld";
import { LeadForm } from "@/components/lead-form";
import { PageHero } from "@/components/page-hero";
import { imagery } from "@/lib/imagery";
import { getSettings, whatsappHref } from "@/lib/settings";
import {
  DASK_COVERAGE_CAP,
  DASK_COVERED,
  DASK_NOT_COVERED,
  INSURANCE_FAQS,
  POLICY_TYPES,
  PRIVATE_COVERED,
  PRIVATE_NOT_COVERED,
  QUOTE_CHECKLIST,
} from "@/lib/insurance";
import { breadcrumbSchema, faqSchema, serviceSchema } from "@/lib/schema";
import { HOME_CRUMB, pageMetadata, type Crumb } from "@/lib/seo";

const PAGE_TITLE = "Property Insurance in Turkey: DASK & Home Cover";
const PAGE_DESCRIPTION =
  "Compulsory DASK earthquake insurance explained alongside private buildings and contents cover for Fethiye property owners — what each one covers, what it does not, and how premiums are actually calculated.";

const PATH = "/insurance";
const CRUMBS: Crumb[] = [HOME_CRUMB, { name: "Insurance", path: PATH }];

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: PATH,
    keywords: [
      "DASK insurance Turkey",
      "property insurance Turkey",
      "earthquake insurance Turkey",
      "home insurance Fethiye",
      "contents insurance Turkey villa",
      "buildings insurance Turkish property",
    ],
    type: "article",
  });
}

/** Partner sağlayıcının kapsadığı diğer branşlar — eski sitedeki üçlü. */
const OTHER_COVER = [
  { icon: Home, label: "Home insurance" },
  { icon: Car, label: "Car insurance" },
  { icon: HeartPulse, label: "Health insurance" },
];

export default async function InsurancePage() {
  const settings = await getSettings();
  const quoteMessage =
    "Hello Coast 2 Coast — I'd like a quote for property insurance in Fethiye.";

  return (
    <>
      <JsonLd
        schema={[
          serviceSchema({
            name: "Property insurance guidance for Turkish property owners",
            description: PAGE_DESCRIPTION,
            path: PATH,
            serviceType: "Property insurance advisory",
            offers: POLICY_TYPES.map((policy) => ({
              name: policy.name,
              description: policy.summary,
            })),
          }),
          faqSchema(INSURANCE_FAQS),
          breadcrumbSchema(CRUMBS),
        ]}
      />

      <main id="main">
        <PageHero
          eyebrow="Insurance in Türkiye"
          title="DASK is compulsory. It is also nowhere near enough."
          lede="Every home in Türkiye must carry state-backed earthquake cover, and almost every owner assumes that is the job done. DASK itself is explicit that it insures the bare rebuild cost of the structure and nothing else — no contents, no theft, no water damage. Here is what each policy actually does."
          crumbs={CRUMBS}
          image={imagery.insurance}
        >
          <div className="flex flex-col gap-8 border-t border-line pt-6 sm:pt-10 sm:flex-row sm:items-center sm:justify-between">
            <ul className="flex flex-wrap gap-x-8 gap-y-4">
              {OTHER_COVER.map((item) => (
                <li
                  key={item.label}
                  className="inline-flex items-center gap-2.5 text-sm text-ink-70"
                >
                  <item.icon className="size-4 text-sea" aria-hidden="true" />
                  {item.label}
                </li>
              ))}
            </ul>
            <p className="text-xs leading-relaxed text-ink-40">
              Arranged with our local Fethiye provider, in English or Russian.
            </p>
          </div>
        </PageHero>

        {/* --------------------------------------------- ÜÇ POLİÇE TÜRÜ */}
        <section
          aria-labelledby="policies-heading"
          className="bg-shell py-section"
        >
          <div className="container-page">
            <header className="max-w-2xl">
              <p className="eyebrow text-sea">The three policies</p>
              <h2
                id="policies-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                What each one is for
              </h2>
              <p className="mt-4 sm:mt-5 text-ink-70">
                One is required by law, two are not — and the gap between them is
                where most owners discover they were underinsured.
              </p>
            </header>

            <ul className="mt-8 sm:mt-16 grid gap-6 sm:gap-10 lg:grid-cols-3">
              {POLICY_TYPES.map((policy) => (
                <li key={policy.id}>
                  <article className="flex h-full flex-col border border-line bg-shell-deep p-8 sm:p-10">
                    <policy.icon
                      className="size-6 text-sea"
                      aria-hidden="true"
                    />

                    <p
                      className={`mt-5 sm:mt-7 inline-flex self-start px-3 py-1 text-[11px] uppercase tracking-widest ${
                        policy.status === "Compulsory by law"
                          ? "bg-sea-deep text-shell"
                          : "bg-sea/15 text-sea"
                      }`}
                    >
                      {policy.status}
                    </p>

                    <h3 className="mt-4 sm:mt-5 font-display text-2xl leading-snug text-sea-deep">
                      {policy.name}
                    </h3>

                    <p className="mt-4 sm:mt-5 text-sm leading-relaxed text-ink-70">
                      {policy.summary}
                    </p>

                    <ul className="mt-5 sm:mt-7 space-y-4 border-t border-line pt-5 sm:pt-7">
                      {policy.detail.map((line) => (
                        <li
                          key={line}
                          className="flex gap-3 text-sm leading-relaxed text-ink-70"
                        >
                          <span
                            aria-hidden="true"
                            className="mt-2 size-1.5 shrink-0 bg-sea"
                          />
                          {line}
                        </li>
                      ))}
                    </ul>
                  </article>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ------------------------------- KAPSAM KARŞILAŞTIRMASI + TEKLİF */}
        <section
          aria-labelledby="coverage-heading"
          className="border-t border-line bg-shell-deep py-section"
        >
          <div className="container-page grid gap-8 sm:gap-16 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <header className="max-w-2xl">
                <p className="eyebrow text-sea">Covered vs not covered</p>
                <h2
                  id="coverage-heading"
                  className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
                >
                  Read this before you assume you are covered
                </h2>
                <p className="mt-4 sm:mt-5 text-ink-70">
                  The two lists below are the ones worth screenshotting. Almost
                  every unpleasant surprise after a claim sits in the right-hand
                  column.
                </p>
              </header>

              {/* ------------------------------------------------------ DASK */}
              <article className="mt-8 sm:mt-16 border border-line bg-shell p-8 sm:p-10">
                <h3 className="inline-flex items-center gap-3 font-display text-2xl text-sea-deep">
                  <TriangleAlert
                    className="size-5 text-sea"
                    aria-hidden="true"
                  />
                  DASK — compulsory earthquake cover
                </h3>

                {DASK_COVERAGE_CAP ? (
                  <p className="mt-4 sm:mt-5 text-sm text-ink-70">
                    Current maximum sum insured:{" "}
                    <strong className="font-medium text-sea-deep">
                      {DASK_COVERAGE_CAP}
                    </strong>
                    .
                  </p>
                ) : (
                  /*
                    Teyit edilmemiş bir tavan rakamı yayımlamak, okuyucunun
                    eksik sigortalı olduğunu fark etmemesine yol açar.
                    Rakam lib/insurance.ts içine girilene kadar bu satır görünür.
                  */
                  <p className="mt-4 sm:mt-5 text-sm text-ink-70">
                    The maximum sum insured is set by the state and revised every
                    year — ask us for the figure currently in force before you
                    rely on it.
                  </p>
                )}

                <div className="mt-6 sm:mt-10 grid gap-6 sm:gap-10 sm:grid-cols-2">
                  <div>
                    <h4 className="eyebrow border-b border-line pb-4 text-sea">
                      What DASK covers
                    </h4>
                    <ul className="mt-4 sm:mt-6 space-y-4">
                      {DASK_COVERED.map((item) => (
                        <li
                          key={item}
                          className="flex gap-3 text-sm leading-relaxed text-ink-70"
                        >
                          <Check
                            className="mt-0.5 size-4 shrink-0 text-gold-deep"
                            aria-hidden="true"
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="eyebrow border-b border-line pb-4 text-ink-40">
                      What DASK does not cover
                    </h4>
                    <ul className="mt-4 sm:mt-6 space-y-4">
                      {DASK_NOT_COVERED.map((item) => (
                        <li
                          key={item}
                          className="flex gap-3 text-sm leading-relaxed text-ink-70"
                        >
                          <X
                            className="mt-0.5 size-4 shrink-0 text-ink-40"
                            aria-hidden="true"
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>

              {/* ----------------------------------------- ÖZEL SİGORTA */}
              <article className="mt-6 sm:mt-10 border border-line bg-shell p-8 sm:p-10">
                <h3 className="inline-flex items-center gap-3 font-display text-2xl text-sea-deep">
                  <ShieldCheck className="size-5 text-sea" aria-hidden="true" />
                  Private buildings and contents cover
                </h3>

                <div className="mt-6 sm:mt-10 grid gap-6 sm:gap-10 sm:grid-cols-2">
                  <div>
                    <h4 className="eyebrow border-b border-line pb-4 text-sea">
                      Typically covered
                    </h4>
                    <ul className="mt-4 sm:mt-6 space-y-4">
                      {PRIVATE_COVERED.map((item) => (
                        <li
                          key={item}
                          className="flex gap-3 text-sm leading-relaxed text-ink-70"
                        >
                          <Check
                            className="mt-0.5 size-4 shrink-0 text-gold-deep"
                            aria-hidden="true"
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="eyebrow border-b border-line pb-4 text-ink-40">
                      Usually excluded
                    </h4>
                    <ul className="mt-4 sm:mt-6 space-y-4">
                      {PRIVATE_NOT_COVERED.map((item) => (
                        <li
                          key={item}
                          className="flex gap-3 text-sm leading-relaxed text-ink-70"
                        >
                          <X
                            className="mt-0.5 size-4 shrink-0 text-ink-40"
                            aria-hidden="true"
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            </div>

            {/* -------------------------------------- CRO: STICKY TEKLİF */}
            <aside
              aria-labelledby="quote-heading"
              className="lg:col-span-4 lg:col-start-9"
            >
              <div className="lg:sticky lg:top-24 lg:max-h-[calc(100svh-7rem)] lg:overflow-y-auto">
                <div className="border border-line bg-shell p-7 sm:p-8">
                  <h2
                    id="quote-heading"
                    className="font-display text-2xl leading-snug text-sea-deep"
                  >
                    Request an insurance quote
                  </h2>

                  <p className="mt-4 text-sm leading-relaxed text-ink-70">
                    Send us the square metres from your TAPU and roughly what you
                    want covered. We will come back with a comparison in English —
                    DASK, buildings and contents priced separately so you can see
                    what each one costs.
                  </p>

                  <div className="mt-5 sm:mt-7 flex flex-col gap-3">
                    <a
                      href={whatsappHref(settings.contact.whatsappNumber, quoteMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-sea px-6 py-3.5 text-sm font-medium text-shell transition-colors hover:bg-sea"
                    >
                      <MessageCircle className="size-4" aria-hidden="true" />
                      Quote on WhatsApp
                    </a>
                    <a
                      href={`tel:${settings.contact.phoneE164}`}
                      className="inline-flex items-center justify-center gap-2 border border-line px-6 py-3.5 text-sm font-medium text-sea-deep transition-colors hover:bg-shell-deep"
                    >
                      <Phone className="size-4" aria-hidden="true" />
                      {settings.contact.phoneDisplay}
                    </a>
                  </div>

                  <div className="mt-5 sm:mt-8 border-t border-line pt-6 sm:pt-8">
                    <LeadForm
                      variant="panel"
                      enquiryType="Insurance"
                      submitLabel="Request a quote"
                      showBudget={false}
                      defaultMessage="I'd like a quote for property insurance. My property is approximately ___ m² in ___ (area), built in ___."
                      whatsappMessage={quoteMessage}
                    />
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* ------------------------------------------------- HAZIRLIK LİSTESİ */}
        <section
          aria-labelledby="checklist-heading"
          className="bg-shell py-section"
        >
          <div className="container-page">
            <header className="max-w-2xl">
              <p className="eyebrow text-sea">Before you get quotes</p>
              <h2
                id="checklist-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                Six things to have in front of you
              </h2>
              <p className="mt-4 sm:mt-5 text-ink-70">
                Gathering these first turns a vague quote into an accurate one —
                and an accurate quote is the only kind that pays out what you
                expect.
              </p>
            </header>

            <ul className="mt-8 sm:mt-16 grid gap-x-12 gap-y-8 sm:gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {QUOTE_CHECKLIST.map((item, index) => (
                <li key={item.title} className="border-t border-line pt-6 sm:pt-8">
                  <p className="font-display text-sm text-ink-40">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-4 font-display text-xl leading-snug text-sea-deep">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-ink-70">
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ------------------------------------------------------------ SSS */}
        <section
          aria-labelledby="faq-heading"
          className="border-t border-line bg-shell-deep py-section"
        >
          <div className="container-page grid gap-8 sm:gap-16 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="eyebrow text-sea">Straight answers</p>
              <h2
                id="faq-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                Insurance questions owners ask
              </h2>
              <p className="mt-4 sm:mt-5 text-ink-70">
                If you are buying rather than renewing, DASK is arranged as part
                of the purchase — see{" "}
                <Link
                  href="/buying-process"
                  className="text-sea-deep underline underline-offset-4"
                >
                  the buying process
                </Link>
                .
              </p>
            </div>

            <div className="lg:col-span-6 lg:col-start-7">
              <FaqAccordion faqs={INSURANCE_FAQS} groupName="insurance-faq" />
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- UYARI + CTA */}
        <section aria-labelledby="insurance-cta" className="bg-shell py-section">
          <div className="container-page">
            <p className="mb-8 sm:mb-14 inline-flex max-w-3xl items-start gap-3 border border-line bg-shell-deep p-6 text-xs leading-relaxed text-ink-70">
              <TriangleAlert
                className="mt-0.5 size-4 shrink-0 text-sea"
                aria-hidden="true"
              />
              <span>
                <strong className="font-medium text-sea-deep">Important:</strong>{" "}
                Coast 2 Coast Properties Turkey is a property consultancy, not a
                regulated insurance broker. The cover described here is typical
                rather than universal — every insurer words its policy
                differently, and the DASK maximum sum insured is set by the state
                and changes annually. Always read the policy schedule and the
                exclusions before you buy, and confirm the current figures with
                the provider.
              </span>
            </p>

            <div className="grid gap-8 sm:gap-12 bg-sea-deep px-8 py-10 sm:py-16 text-shell sm:px-14 lg:grid-cols-12 lg:items-center lg:px-20 lg:py-24">
              <div className="lg:col-span-7">
                <h2
                  id="insurance-cta"
                  className="font-display text-3xl leading-tight sm:text-4xl"
                >
                  Not sure whether you are properly covered?
                </h2>
                <p className="mt-4 sm:mt-6 max-w-xl leading-relaxed text-shell/80">
                  Send us your current policy and we will tell you plainly what it
                  does and does not cover — in English, without a sales pitch
                  attached.
                </p>
              </div>

              <div className="flex flex-col gap-4 lg:col-span-4 lg:col-start-9">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-shell px-8 py-4 text-sm font-medium text-sea-deep transition-colors hover:bg-white"
                >
                  Get in touch
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <a
                  href={whatsappHref(settings.contact.whatsappNumber, quoteMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 border border-shell/40 px-8 py-4 text-sm font-medium transition-colors hover:bg-shell/10"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  Quote on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
