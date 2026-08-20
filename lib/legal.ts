import type { SiteSettings } from "@/lib/settings";

/**
 * ═══════════════════════════════════════════════════════════════════════
 *  ⚠️  BU METİNLER HUKUKÇU TARAFINDAN İNCELENMEDİ.
 *
 *  Yayına hazır bir TASLAK, imzalanmış bir belge değil. Britanyalı alıcıya
 *  bakan bir emlak sitesi için standart maddeleri içeriyor ve doğru
 *  yapıdadır; ama Birleşik Krallık GDPR'ı altında veri sorumlusu SİZSİNİZ ve
 *  aşağıdaki taahhütlerin gerçekten yaptığınız işle örtüşmesi gerekir.
 *
 *  Yayından ÖNCE bir avukatın onaylaması gereken noktalar:
 *    · ICO kayıt numarası (aşağıda `ICO_REGISTRATION` — şu an boş)
 *    · Kişisel verinin Türkiye'ye aktarımı: Türkiye BK yeterlilik
 *      listesinde DEĞİL, dolayısıyla uygun bir aktarım mekanizması
 *      (IDTA / Ek Sözleşme) gerekir. Metin bunu beyan ediyor — belgenin
 *      kendisi de mevcut olmalı.
 *    · Saklama süreleri: aşağıdaki süreler makul varsayılanlar, sizin
 *      gerçek uygulamanız değil.
 *    · Uygulanacak hukuk / yetkili mahkeme seçimi (Terms 11. madde).
 * ═══════════════════════════════════════════════════════════════════════
 *
 * İÇERİK NEDEN BURADA, SAYFADA DEĞİL: iki sayfa da bu modülden besleniyor
 * ve şirket bilgisi (ad, adres, e-posta, telefon) `data/settings.json`ten
 * geçiyor. Yönetici panelden adresi değiştirdiğinde hukuki metinlerdeki
 * adres de değişir — üç ayrı yerde elle güncellenmesi gereken bir NAP
 * bilgisi, er ya da geç sapan bir NAP bilgisidir.
 */

export type LegalBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

export type LegalSection = {
  /** Başlık çapası — içindekiler bağlantıları buna gider. */
  id: string;
  heading: string;
  blocks: LegalBlock[];
};

/**
 * Belgelerin yürürlük tarihi. Otomatik `new Date()` DEĞİL — bilinçli:
 * her dağıtımda kendini bugüne çeken bir "son güncelleme" tarihi, metin
 * hiç değişmemişken değişmiş gibi görünür ve tam olarak bu tarihe güvenmesi
 * gereken kullanıcıyı yanıltır. Metni düzenlediğinizde bu satırı elle
 * güncelleyin.
 */
export const LEGAL_LAST_UPDATED = "19 August 2026";

/**
 * ICO (Information Commissioner's Office) kayıt numarası.
 *
 * Boş bırakıldığında ilgili cümle hiç basılmıyor — uydurma bir numara
 * yazmaktansa iddiayı hiç kurmamak doğru davranış. Numara alındığında
 * buraya yazın, cümle kendiliğinden görünür.
 */
export const ICO_REGISTRATION = "";

/* Metin içinde tekrar eden şirket künyesi — tek yerden türetiliyor. */
function identity(settings: SiteSettings) {
  const { contact, companyName } = settings;

  return {
    companyName,
    email: contact.email,
    phone: contact.phoneDisplay,
    address: `${contact.address.full}, ${contact.address.countryName}`,
  };
}

/* ────────────────────────────────────────────────────────── PRIVACY ── */

export function privacySections(settings: SiteSettings): LegalSection[] {
  const { companyName, email, phone, address } = identity(settings);

  return [
    {
      id: "who-we-are",
      heading: "Who we are",
      blocks: [
        {
          type: "paragraph",
          text: `${companyName} is an international real estate consultancy based in Fethiye, Muğla, Türkiye, working principally with buyers from the United Kingdom and Europe. This policy explains what personal information we collect when you use this website or enquire about a property, how we use it, and the rights you have over it.`,
        },
        {
          type: "paragraph",
          text: `For the purposes of UK data protection law we are the data controller for the information described here. You can reach us at ${email}, on ${phone}, or by post at ${address}.`,
        },
        ...(ICO_REGISTRATION
          ? [
              {
                type: "paragraph" as const,
                text: `We are registered with the UK Information Commissioner's Office under registration number ${ICO_REGISTRATION}.`,
              },
            ]
          : []),
      ],
    },
    {
      id: "what-we-collect",
      heading: "Information we collect",
      blocks: [
        {
          type: "paragraph",
          text: "We collect only what we need in order to answer you properly and, if you go ahead, to help you buy or sell a property.",
        },
        {
          type: "list",
          items: [
            "Information you give us directly. When you complete an enquiry form this includes your name, email address, and optionally your telephone number, your budget range and the content of your message. If you contact us by email, telephone or WhatsApp we hold the contents of that correspondence.",
            "Information we need in order to act for you. If your enquiry becomes an active purchase or sale, we and the professionals working alongside us will need identity and address documents, and in some cases proof of funds, in order to meet anti-money-laundering and Turkish title deed requirements.",
            "Technical information. Like most websites, ours records basic technical data such as your IP address, browser type, device type, the pages you visit and the site that referred you.",
          ],
        },
        {
          type: "paragraph",
          text: "We do not ask for special category data (such as health or political opinions), and we ask that you do not send it to us in an enquiry.",
        },
      ],
    },
    {
      id: "how-we-use-it",
      heading: "How we use your information",
      blocks: [
        {
          type: "list",
          items: [
            "To respond to your enquiry and send you details of properties that match what you have told us. Where you have asked us to contact you, our lawful basis is your consent; where you are an existing client, it is our legitimate interest in providing the service you have engaged us for.",
            "To arrange and run viewing trips, and to introduce you to sellers, developers, lawyers, notaries and translators where you ask us to.",
            "To perform a contract with you, once you instruct us to act on a purchase or a sale.",
            "To meet legal obligations, including anti-money-laundering checks, tax reporting and record-keeping requirements in Türkiye.",
            "To maintain and improve the website, understand which pages are useful and diagnose faults, on the basis of our legitimate interest in running a functioning website.",
          ],
        },
        {
          type: "paragraph",
          text: "We do not sell your personal information, and we do not add you to a marketing mailing list without asking you first. If you have consented to marketing you can withdraw that consent at any time by replying to any message or emailing us.",
        },
      ],
    },
    {
      id: "cookies",
      heading: "Cookies, analytics and site preferences",
      blocks: [
        {
          type: "paragraph",
          text: "We take a deliberately strict approach here: nothing that is not strictly necessary is placed on your device, and no third-party analytics code is loaded, until you have told us it may be.",
        },
        {
          type: "paragraph",
          text: "Essential storage. When you first arrive we ask you to make a choice about cookies, and we record your answer in your browser's local storage. Your language and currency preference is stored the same way, so that the site remembers it on your next visit. Neither is sent to our servers, neither identifies you, and both can be cleared at any time through your browser settings. If you choose \u201CEssential only\u201D, this is the only information stored on your device.",
        },
        {
          type: "paragraph",
          text: "Analytics. We use Microsoft Clarity to understand how visitors move through the site \u2014 which pages are read, where people hesitate and where something is not working. Clarity records page views, clicks, scrolling and general session activity, and may capture this as an anonymised session replay. It sets cookies on your device in order to do so, and Microsoft acts as our processor for that data.",
        },
        {
          type: "paragraph",
          text: "Clarity is not loaded unless you explicitly choose \u201CAccept all\u201D on the cookie banner. Until you do, the script is never requested, no connection is made from your browser to Microsoft, and no analytics cookies are set. Declining \u2014 or simply not answering \u2014 leaves the site completely usable.",
        },
        {
          type: "paragraph",
          text: "Withdrawing your consent. You can change your mind at any time, permanently, in a single click: select \u201CCookie settings\u201D in the footer of any page and choose \u201CEssential only\u201D. When you do, we:",
        },
        {
          type: "list",
          items: [
            "Stop loading Clarity — on that visit and on every visit afterwards.",
            "Delete the Clarity cookies held on this website's domain.",
            "Reload the page, so that any tracking code already running in your browser is discarded outright rather than merely switched off.",
          ],
        },
        {
          type: "paragraph",
          text: "Two limits on that, which we would rather state plainly than leave you to discover. Withdrawing consent stops any further collection, but it does not by itself erase what was gathered while your consent was in place \u2014 if you would like that deleted, email us and we will put the request to Microsoft on your behalf. And Microsoft may set cookies on its own domains, clarity.ms and bing.com, which we have no technical means of deleting from this site; your browser's cookie controls or an ad blocker will clear those.",
        },
        {
          type: "paragraph",
          text: "We will ask you to confirm your choice again after around six months, and immediately if we ever introduce a tool that your existing answer would not cover. An earlier consent is never treated as covering something new.",
        },
        {
          type: "paragraph",
          text: "Currency conversion. Property prices are converted from pounds sterling using a third-party exchange rate service. That service receives no information about you \u2014 the conversion is performed on our servers, not in your browser.",
        },
      ],
    },
    {
      id: "sharing",
      heading: "Who we share it with",
      blocks: [
        {
          type: "paragraph",
          text: "We share your information only where it is needed to do the job you have asked us to do, or where the law requires it. Depending on the stage you have reached, that may include:",
        },
        {
          type: "list",
          items: [
            "Property owners, developers and co-operating agents, where you have asked to view or make an offer on a specific property.",
            "Lawyers, notaries, translators, surveyors and insurers instructed in connection with your purchase or sale.",
            "Service providers who operate parts of our business on our behalf — website hosting, email delivery and website analytics — under contracts that require them to protect your information and use it only on our instructions.",
            "Public authorities, including the Turkish land registry and tax authorities, where a transaction or the law requires it.",
          ],
        },
      ],
    },
    {
      id: "international-transfers",
      heading: "Sending information outside the UK",
      blocks: [
        {
          type: "paragraph",
          text: "We operate from Türkiye, so information you send us will be accessed and stored there. Türkiye is not currently covered by a UK adequacy decision, which means we rely on appropriate safeguards — such as the UK International Data Transfer Agreement or the UK Addendum to the EU Standard Contractual Clauses — to protect information transferred from the United Kingdom.",
        },
        {
          type: "paragraph",
          text: "You can ask us for a copy of the safeguards we have in place by emailing " + email + ".",
        },
      ],
    },
    {
      id: "retention",
      heading: "How long we keep it",
      blocks: [
        {
          type: "list",
          items: [
            "Enquiries that do not lead to a transaction: up to two years from our last contact with you, so that we can pick up the conversation if you come back to us.",
            "Client and transaction records: for as long as the applicable Turkish tax, anti-money-laundering and title deed record-keeping rules require.",
            "Website analytics: retained by our analytics provider in line with their standard retention period.",
          ],
        },
        {
          type: "paragraph",
          text: "When information is no longer needed for the purpose it was collected for, and we are not required to keep it, we delete it.",
        },
      ],
    },
    {
      id: "your-rights",
      heading: "Your rights",
      blocks: [
        {
          type: "paragraph",
          text: "Under UK and EU data protection law you have the right to:",
        },
        {
          type: "list",
          items: [
            "Ask for a copy of the personal information we hold about you.",
            "Ask us to correct information that is wrong or incomplete.",
            "Ask us to delete information where we no longer have a good reason to keep it.",
            "Object to, or ask us to restrict, our use of your information.",
            "Ask us to transfer your information to another provider, where it is held electronically and processed on the basis of consent or a contract.",
            "Withdraw consent at any time, where consent is what we rely on. This does not affect anything we did before you withdrew it.",
          ],
        },
        {
          type: "paragraph",
          text: `To exercise any of these rights, email ${email}. We will respond within one month. If you are not satisfied with how we have handled your information, you can complain to the UK Information Commissioner's Office at ico.org.uk, or to the data protection authority in your country of residence.`,
        },
      ],
    },
    {
      id: "security",
      heading: "Keeping your information secure",
      blocks: [
        {
          type: "paragraph",
          text: "This website is served over an encrypted connection, and access to enquiry records is limited to the members of our team who need it. No transmission over the internet can be guaranteed completely secure, so please do not send us identity documents or financial details through the enquiry form — we will tell you the appropriate way to send them when the time comes.",
        },
      ],
    },
    {
      id: "children",
      heading: "Children",
      blocks: [
        {
          type: "paragraph",
          text: "This website is intended for adults considering a property purchase. We do not knowingly collect information from anyone under the age of 18. If you believe a child has sent us personal information, please contact us and we will delete it.",
        },
      ],
    },
    {
      id: "changes",
      heading: "Changes to this policy",
      blocks: [
        {
          type: "paragraph",
          text: `We may update this policy from time to time, for example if we change the services we offer or the tools we use. The date at the top of this page shows when it was last revised. This version is dated ${LEGAL_LAST_UPDATED}.`,
        },
      ],
    },
  ];
}

/* ──────────────────────────────────────────────────────────── TERMS ── */

export function termsSections(settings: SiteSettings): LegalSection[] {
  const { companyName, email, phone, address } = identity(settings);

  return [
    {
      id: "about-these-terms",
      heading: "About these terms",
      blocks: [
        {
          type: "paragraph",
          text: `This website is operated by ${companyName}, an international real estate consultancy based at ${address}. You can contact us at ${email} or on ${phone}.`,
        },
        {
          type: "paragraph",
          text: "These terms explain the basis on which you may use this website. By using the site you accept them. If you do not accept them, please do not use the site.",
        },
      ],
    },
    {
      id: "using-the-site",
      heading: "Using this website",
      blocks: [
        {
          type: "paragraph",
          text: "You may use this site to browse the properties we represent, read our guides and contact us about buying or selling. You agree not to:",
        },
        {
          type: "list",
          items: [
            "Use the site for any unlawful purpose, or in any way that could damage it or interfere with anyone else's use of it.",
            "Copy, scrape or systematically extract listings, photographs or written content for republication elsewhere.",
            "Submit false information through the enquiry form, or submit an enquiry on someone else's behalf without their knowledge.",
          ],
        },
      ],
    },
    {
      id: "property-listings",
      heading: "Property listings",
      blocks: [
        {
          type: "paragraph",
          text: "Property details on this site are prepared in good faith from information supplied by the owner or developer. They are provided as a general guide to help you decide whether a property is worth viewing. They are not a formal offer, they do not form part of any contract, and they should not be relied on as statements of fact.",
        },
        {
          type: "list",
          items: [
            "Measurements, plot sizes, room counts and floor areas are approximate and should be verified before you commit.",
            "Photographs, floor plans and computer-generated images are illustrative. Furniture, fittings and landscaping shown may not be included in the sale.",
            "Descriptions of condition do not mean that a property is free from defects. We have not tested services, appliances or installations.",
            "Availability changes. A property shown on this site may already be under offer or sold, and prices may change without notice.",
          ],
        },
        {
          type: "paragraph",
          text: "You should always satisfy yourself as to the accuracy of any detail that matters to your decision, and take independent legal and technical advice before entering into a contract.",
        },
      ],
    },
    {
      id: "prices-and-currency",
      heading: "Prices and currency conversion",
      blocks: [
        {
          type: "paragraph",
          text: "Asking prices on this site are held in pounds sterling. Where you choose to view prices in euros, Turkish lira or Russian roubles, the figure shown is an automatic conversion, calculated using an exchange rate obtained from a third-party service and refreshed periodically. Converted figures are rounded and are indicative only.",
        },
        {
          type: "paragraph",
          text: "The rate you actually obtain will depend on your bank or currency provider on the day you transfer funds, and may differ materially from the figure shown here. Nothing on this site is a quotation for currency exchange, and we do not provide currency services.",
        },
        {
          type: "paragraph",
          text: "Purchase prices exclude the taxes, fees and professional costs that apply to a Turkish property transaction unless we state otherwise in writing. We will set those out for you before you commit to a purchase.",
        },
      ],
    },
    {
      id: "no-advice",
      heading: "We are agents, not advisers",
      blocks: [
        {
          type: "paragraph",
          text: "The guides and articles on this site — including anything we publish about the buying process, Turkish citizenship, residency, insurance or taxation — are general information written to help you understand how things work. They are not legal, tax, financial or immigration advice, and they are not a substitute for advice from a qualified professional who knows your circumstances.",
        },
        {
          type: "paragraph",
          text: "Rules change, and they apply differently depending on your nationality, residence and the property in question. Please take independent advice before making a decision that depends on any of them.",
        },
      ],
    },
    {
      id: "intellectual-property",
      heading: "Intellectual property",
      blocks: [
        {
          type: "paragraph",
          text: `The text, design, logo and layout of this site belong to ${companyName} or are used under licence. Photographs remain the property of their respective owners. You may view and print pages for your own use in considering a property purchase; any other reproduction or commercial use requires our written permission.`,
        },
      ],
    },
    {
      id: "third-party-links",
      heading: "Links to other websites",
      blocks: [
        {
          type: "paragraph",
          text: "Where we link to another organisation's website — a lawyer, an insurer, a government service or a mapping provider — we do so because we think it may be useful. We do not control those sites and we are not responsible for their content, their availability or their handling of your information.",
        },
      ],
    },
    {
      id: "availability",
      heading: "Availability of the site",
      blocks: [
        {
          type: "paragraph",
          text: "We aim to keep the site available and up to date, but we do not guarantee uninterrupted access. We may suspend, withdraw or change any part of the site without notice, and we may remove or amend a listing at any time.",
        },
      ],
    },
    {
      id: "liability",
      heading: "Our liability",
      blocks: [
        {
          type: "paragraph",
          text: "Nothing in these terms limits our liability for death or personal injury caused by our negligence, for fraud or fraudulent misrepresentation, or for any other liability that cannot lawfully be limited.",
        },
        {
          type: "paragraph",
          text: "Subject to that, we do not accept liability for any loss arising from your reliance on information published on this site, from any inaccuracy in a property listing supplied to us by a third party, or from any inability to access the site.",
        },
      ],
    },
    {
      id: "governing-law",
      heading: "Governing law",
      blocks: [
        {
          type: "paragraph",
          text: "These terms, and any dispute arising out of them or your use of this site, are governed by Turkish law, and the courts of Fethiye, Muğla have jurisdiction. If you are a consumer resident in the United Kingdom or the European Union, this does not deprive you of the protection of the mandatory consumer law of the country where you live, or of the right to bring proceedings there.",
        },
      ],
    },
    {
      id: "changes-to-terms",
      heading: "Changes to these terms",
      blocks: [
        {
          type: "paragraph",
          text: `We may revise these terms from time to time. The version that applies is the one published on this site when you use it. This version is dated ${LEGAL_LAST_UPDATED}.`,
        },
      ],
    },
    {
      id: "contact-us",
      heading: "Contact us",
      blocks: [
        {
          type: "paragraph",
          text: `If you have a question about these terms, or about anything you have read on this site, email ${email}, call ${phone}, or write to us at ${address}. We would rather answer a question early than have you rely on something you were not sure about.`,
        },
      ],
    },
  ];
}
