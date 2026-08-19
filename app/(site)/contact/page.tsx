import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { LeadForm } from "@/components/lead-form";
import { breadcrumbSchema, contactPageSchema } from "@/lib/schema";
import { HOME_CRUMB, pageMetadata, type Crumb } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { getSettings, whatsappHref } from "@/lib/settings";

const PAGE_TITLE = "Contact Us — Property Consultants in Fethiye";
const PAGE_DESCRIPTION =
  " ";

const CRUMBS: Crumb[] = [HOME_CRUMB, { name: "Contact", path: "/contact" }];

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: "/contact",
    keywords: [
      "contact estate agent Fethiye",
      "Fethiye property enquiry",
      "Coast 2 Coast Properties Turkey contact",
      "buy villa Turkey enquiry",
    ],
  });
}

/**
 * Google Maps embed'i API anahtarı gerektirmeyen `output=embed` biçiminde
 * kullanılıyor. `loading="lazy"` şart: harita iframe'i ağır bir kaynaktır ve
 * hemen görünmediği hâlde LCP'yi ve etkileşime hazır olma süresini geciktirir.
 */
export default async function ContactPage() {
  const settings = await getSettings();
  const { contact } = settings;

  /*
    Harita sorgusu artık MODÜL KAPSAMINDA değil bileşenin içinde: adres
    panelden düzenlenebiliyor ve modül kapsamındaki bir sabit, sunucu
    süreci boyunca ilk okunan değerde donup kalırdı — yönetici adresi
    değiştirdikten sonra harita eski adresi göstermeye devam ederdi.
  */
  const mapQuery = encodeURIComponent(
    `${contact.address.full}, ${contact.address.countryName}`,
  );
  const MAP_SRC = `https://www.google.com/maps?q=${mapQuery}&hl=en&z=15&output=embed`;

  const CHANNELS = [
    {
      icon: Phone,
      label: "Türkiye office",
      value: contact.phoneDisplay,
      href: `tel:${contact.phoneE164}`,
      note: "Fastest between 09:00 and 19:00 Turkish time.",
    },
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: contact.phoneDisplay,
      href: whatsappHref(contact.whatsappNumber, 
        "Hello Coast 2 Coast — I'd like to talk about buying a villa in Fethiye.",
      ),
      note: "The fastest way to reach us — usually answered within the hour.",
    },
    {
      icon: Mail,
      label: "Email",
      value: contact.email,
      href: `mailto:${contact.email}`,
      note: "Attach anything you have found elsewhere and we will assess it.",
    },
  ];

  return (
    <>
      <JsonLd
        schema={[contactPageSchema(PAGE_DESCRIPTION), breadcrumbSchema(CRUMBS)]}
      />

      <main id="main">
        {/*
          Bu sayfada PageHero YOK — bilinçli bir karar. İletişim sayfasına gelen
          kullanıcının tek bir niyeti var: yazmak. Araya manzara bandı koymak,
          formu ilk ekranın dışına itiyordu. Bu yüzden breadcrumb ve sayfanın
          TEK <h1>'i doğrudan form bloğunun üstünde duruyor.
        */}

        {/* ------------------------------------------------- FORM + BİLGİLER */}
        <section aria-labelledby="enquiry-heading" className="bg-shell py-section">
          <div className="container-page">
            <Breadcrumbs crumbs={CRUMBS} />
          </div>

          <div className="container-page mt-6 sm:mt-10 grid gap-8 sm:gap-16 lg:grid-cols-12">
            {/* --------------------------------------------------------- FORM */}
            <div className="lg:col-span-7">
              <h1
                id="enquiry-heading"
                className="font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                Send an enquiry
              </h1>
              <p className="mt-4 sm:mt-5 max-w-xl leading-relaxed text-ink-70">
                Tell us your budget, your timeline and whether this is a holiday
                home, a rental asset or a move. Every message reaches a person,
                not an autoresponder — if it is urgent, WhatsApp is genuinely
                faster.
              </p>

              <div className="mt-8 sm:mt-12">
                <LeadForm variant="page" />
              </div>
            </div>

            {/* ----------------------------------------------------- KANALLAR */}
            <aside
              aria-labelledby="details-heading"
              className="lg:col-span-4 lg:col-start-9"
            >
              <div className="border border-line bg-shell-deep p-8 sm:p-10">
                <h2
                  id="details-heading"
                  className="font-display text-xl text-sea-deep"
                >
                  {siteConfig.legalName}
                </h2>

                <ul className="mt-5 sm:mt-8 space-y-5 sm:space-y-7">
                  {CHANNELS.map((channel) => (
                    <li key={channel.label}>
                      <p className="eyebrow text-ink-40">{channel.label}</p>
                      {/*
                        E-POSTA TAŞMASI — ve `break-words`in neden yetmediği.

                        `overflow-wrap: break-word` (Tailwind'de `break-words`)
                        uzun bir dizgeyi görsel olarak sarar ama elemanın
                        MIN-CONTENT ölçüsünü değiştirmez; spesifikasyon bunu
                        açıkça böyle tanımlar. Burada kırılan tam olarak oydu:
                        e-postanın 373px'lik min-content'i, `min-width:auto`
                        taşıyan grid öğesi üzerinden yukarı doğru yayılıp
                        iletişim sayfasının ızgara sütununu 467px'e, sayfayı da
                        375px viewport'ta 491px'e zorluyordu. Metin sarılmış
                        görünüyor, sayfa yine de yatayda taşıyordu.

                        `wrap-anywhere` (overflow-wrap: anywhere) min-content'i
                        de düşürür — tek satırlık farkın tamamı bu. `break-all`
                        de işe yarardı ama o her zaman keser; `anywhere`
                        yalnızca sığmadığında.
                      */}
                      <a
                        href={channel.href}
                        className="mt-2 flex items-start gap-3 font-display text-lg text-sea-deep underline-offset-4 hover:underline"
                      >
                        <channel.icon
                          className="mt-1.5 size-4 shrink-0 text-sea"
                          aria-hidden="true"
                        />
                        <span className="min-w-0 wrap-anywhere">
                          {channel.value}
                        </span>
                      </a>
                      <p className="mt-2 text-xs leading-relaxed text-ink-40">
                        {channel.note}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 sm:mt-10 space-y-5 sm:space-y-6 border-t border-line pt-6 sm:pt-8">
                  {/* Adres, schema.org PostalAddress ile birebir aynı olmalı (NAP tutarlılığı). */}
                  <address className="not-italic">
                    <p className="eyebrow text-ink-40">Office</p>
                    <p className="mt-3 inline-flex items-start gap-3 text-sm leading-relaxed text-ink-70">
                      <MapPin
                        className="mt-0.5 size-4 shrink-0 text-sea"
                        aria-hidden="true"
                      />
                      {/*
                        Adres tek parça bir dize olarak basılıyor: resmî
                        yazımı (ilçe/il ayracı dâhil) bozmadan göstermenin
                        tek yolu bu. Ülke adı ayrı satırda kalıyor çünkü
                        resmî dizede yer almıyor ama uluslararası bir
                        ziyaretçi için gerekli bilgi.
                      */}
                      <span>
                        {contact.address.full}
                        <br />
                        {contact.address.countryName}
                      </span>
                    </p>
                  </address>

                  <p className="inline-flex items-start gap-3 text-sm leading-relaxed text-ink-70">
                    <Clock
                      className="mt-0.5 size-4 shrink-0 text-sea"
                      aria-hidden="true"
                    />
                    {contact.openingHours}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* ---------------------------------------------------------- HARİTA */}
        <section
          aria-labelledby="map-heading"
          className="border-t border-line bg-shell-deep py-section"
        >
          <div className="container-page">
            <header className="max-w-2xl">
              <p className="eyebrow text-sea">Find us</p>
              <h2
                id="map-heading"
                className="mt-4 sm:mt-6 font-display text-3xl leading-tight text-sea-deep sm:text-4xl"
              >
                Our office in Fethiye
              </h2>
              <p className="mt-4 sm:mt-5 text-ink-70">
                Drop in when you are on the coast — coffee is on us, and there is
                usually a property worth seeing the same afternoon.
              </p>
            </header>

            <div className="mt-8 sm:mt-12 aspect-[16/10] overflow-hidden border border-line bg-shell sm:aspect-[21/9]">
              <iframe
                title={`Map showing the ${siteConfig.name} office in Fethiye, Muğla`}
                src={MAP_SRC}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                className="size-full border-0"
              />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
