import {
  Banknote,
  Building2,
  Calculator,
  Camera,
  ClipboardCheck,
  FileSignature,
  Handshake,
  KeyRound,
  Landmark,
  Megaphone,
  Plane,
  Receipt,
  ScrollText,
  Search,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Alım ve satım süreçleri tek bir veri şeklinde tutulur: aynı `ProcessTimeline`
 * bileşeni ikisini de render eder ve HowTo schema'sı da buradan üretilir.
 * İçerik değiştiğinde metin, görsel bileşen ve structured data birlikte
 * güncellenir — üçünün birbirinden ayrışması mümkün değildir.
 */
export type ProcessStep = {
  /** URL fragment'i: #step-1 yerine anlamlı çapa üretmek için. */
  id: string;
  icon: LucideIcon;
  title: string;
  /** HowTo `text` alanına giden tek cümlelik özet. */
  summary: string;
  /** Zaman çizelgesinde madde madde açılan detay. */
  detail: string[];
  /** Sağ üstte görünen zaman etiketi. */
  timing: string;
  /** Bu adımda işi kimin yaptığı — güven inşasının en somut kısmı. */
  owner: string;
};

export const BUYING_STEPS: ProcessStep[] = [
  {
    id: "brief",
    icon: Search,
    title: "The brief",
    summary:
      "We agree your budget, target area and the real purpose of the purchase before a single property is sent.",
    detail: [
      "A holiday home, a rental asset and a permanent move lead to three different shortlists — we separate them at the start.",
      "We set a realistic all-in budget: the villa price plus 6–8% in purchase costs, so nothing is a surprise in week six.",
      "You get a written shortlist with the honest drawbacks included, not a portal dump of everything in range.",
    ],
    timing: "Week 1",
    owner: "You and your named consultant",
  },
  {
    id: "viewing-trip",
    icon: Plane,
    title: "The viewing trip",
    summary:
      "A two-day itinerary across Fethiye, Ölüdeniz, Hisarönü and Göcek, built around the shortlist rather than our stock.",
    detail: [
      "Six to eight properties over two days. More than that and they blur into one another.",
      "We drive you to the shops, the beach and the school run so you see the daily reality, not just the terrace.",
      "No convoy, no second agent joining halfway, no pressure to reserve on the day.",
    ],
    timing: "Week 2–3",
    owner: "Coast 2 Coast, on the ground",
  },
  {
    id: "offer",
    icon: FileSignature,
    title: "Offer and reservation",
    summary:
      "We negotiate in Turkish on your behalf, then hold the property with a reservation contract translated line by line.",
    detail: [
      "A reservation deposit — typically £2,000–£5,000 — takes the property off the market.",
      "The contract states exactly what is included, the completion deadline and the conditions under which your deposit is returned.",
      "Nothing is signed until you have read the English translation and your solicitor has seen it.",
    ],
    timing: "Week 3",
    owner: "Coast 2 Coast and the seller",
  },
  {
    id: "legal-checks",
    icon: ScrollText,
    title: "Independent legal checks",
    summary:
      "Your own solicitor runs the title search at the Land Registry while we open your tax number and bank account.",
    detail: [
      "The TAKBİS title search confirms the seller is the registered owner and exposes any mortgage, lien or unpaid tax on the property.",
      "We confirm the property sits outside a restricted military zone — a standard clearance for foreign buyers.",
      "You receive a Turkish tax number and a local bank account, both required before the transfer can complete.",
    ],
    timing: "Week 3–5",
    owner: "Your independent solicitor",
  },
  {
    id: "valuation",
    icon: Calculator,
    title: "Valuation report and DASK",
    summary:
      "A government-licensed SPK valuation report is mandatory on every sale to a foreign buyer, alongside earthquake insurance.",
    detail: [
      "The SPK report is produced by a licensed independent valuer and is submitted directly to the Land Registry.",
      "If the valuation comes in below the agreed price, we tell you and renegotiate — this is exactly what the report exists to catch.",
      "DASK earthquake insurance is compulsory and must be active before the deed can transfer.",
    ],
    timing: "Week 4–6",
    owner: "Licensed valuer and insurer",
  },
  {
    id: "funds",
    icon: Banknote,
    title: "Currency transfer and DAB",
    summary:
      "Funds are converted through a Turkish bank, which issues the foreign currency purchase certificate (DAB) the registry requires.",
    detail: [
      "Foreign buyers must convert the purchase amount into Turkish lira through a bank in Türkiye and obtain a DAB certificate.",
      "We introduce a regulated FX broker — on a £600,000 purchase the spread between a broker and a high-street bank is rarely trivial.",
      "The DAB is issued in your name and is a prerequisite for the title deed appointment, so it cannot be left to the last day.",
    ],
    timing: "Week 5–7",
    owner: "You, your bank and FX broker",
  },
  {
    id: "tapu",
    icon: Landmark,
    title: "Title deed transfer (TAPU)",
    summary:
      "Transfer at the Land Registry, in person or by power of attorney, with a sworn translator present throughout.",
    detail: [
      "The 4% property transfer tax is paid before the appointment; by law it is shared, but in practice the split is negotiated.",
      "A sworn translator is legally required so that nothing is signed in a language you do not read.",
      "You leave the appointment as the registered freehold owner, with the TAPU issued in your own name.",
    ],
    timing: "Week 6–8",
    owner: "Land Registry, with us present",
  },
  {
    id: "handover",
    icon: KeyRound,
    title: "Handover and aftercare",
    summary:
      "Utilities transferred, subscriptions opened, keys handed over — and a contact who still answers next season.",
    detail: [
      "Electricity, water and internet are transferred into your name; we handle the paperwork in person.",
      "We support residence permit applications and introduce vetted rental management companies where you want an income.",
      "Annual property tax, DASK renewal and maintenance reminders continue after completion.",
    ],
    timing: "Completion onwards",
    owner: "Coast 2 Coast aftercare",
  },
];

export const SELLING_STEPS: ProcessStep[] = [
  {
    id: "valuation",
    icon: ClipboardCheck,
    title: "Honest valuation",
    summary:
      "We value your property against what has actually completed nearby, not against what neighbours are asking.",
    detail: [
      "Asking prices in Fethiye and Ölüdeniz can sit well above achieved prices; we work from completed comparables.",
      "You receive a realistic range and the likely time to sell at each price point within it.",
      "If the number you need is not achievable this season, we say so rather than take the listing and let it stagnate.",
    ],
    timing: "Week 1",
    owner: "Coast 2 Coast valuation visit",
  },
  {
    id: "paperwork",
    icon: Receipt,
    title: "Paperwork and compliance",
    summary:
      "We audit the title deed, habitation certificate, energy certificate and DASK before the property goes live.",
    detail: [
      "The TAPU is checked for liens, mortgages and unpaid dues that would stall a sale at the registry.",
      "An iskân (habitation certificate) and a valid energy performance certificate (Enerji Kimlik Belgesi) are legally required to sell.",
      "Fixing paperwork before marketing costs days; discovering it after an accepted offer costs the buyer.",
    ],
    timing: "Week 1–2",
    owner: "Coast 2 Coast and your solicitor",
  },
  {
    id: "presentation",
    icon: Camera,
    title: "Presentation",
    summary:
      "Professional photography and a floor plan — shot at the right hour, not on a phone at midday.",
    detail: [
      "Architectural photography at golden hour, plus wide establishing shots that place the property in its bay or valley.",
      "A measured floor plan removes the single most common question in first enquiries.",
      "Light staging advice before the shoot: what to remove, repaint or replant for the highest return per lira spent.",
    ],
    timing: "Week 2",
    owner: "Our photographer",
  },
  {
    id: "marketing",
    icon: Megaphone,
    title: "Marketing to the right buyer",
    summary:
      "Your property is placed in front of international buyers directly, not only on the local Turkish portals.",
    detail: [
      "Listed in English on our own site with full SEO, plus the international portals your buyer actually searches.",
      "Circulated first to our registered buyer list — a meaningful share of sales never reach a public portal.",
      "Turkish-language distribution runs in parallel for domestic and citizenship-programme buyers.",
    ],
    timing: "Week 3 onwards",
    owner: "Coast 2 Coast marketing",
  },
  {
    id: "viewings",
    icon: Users,
    title: "Qualified viewings",
    summary:
      "We screen enquiries for budget and intent, accompany every viewing and send you written feedback after each one.",
    detail: [
      "Buyers are qualified on budget and timescale before they are given your address.",
      "If you live abroad, you never need to be present — we hold keys and manage access.",
      "Written feedback after every viewing, including the objections, so pricing decisions are based on evidence.",
    ],
    timing: "Ongoing",
    owner: "Coast 2 Coast, accompanied",
  },
  {
    id: "offer",
    icon: Handshake,
    title: "Offer and negotiation",
    summary:
      "We put every offer to you in writing with the buyer's position and funding behind it, then negotiate on your terms.",
    detail: [
      "You see who the buyer is, how they are funding the purchase and how quickly they can complete.",
      "A cash buyer at a slightly lower figure often beats a higher offer that depends on a sale back home.",
      "Once agreed, a reservation contract fixes the price and the completion deadline.",
    ],
    timing: "On offer",
    owner: "You decide, we negotiate",
  },
  {
    id: "buyer-checks",
    icon: ShieldCheck,
    title: "Buyer's legal and valuation stage",
    summary:
      "The buyer's solicitor runs the title search while the mandatory SPK valuation is carried out on your property.",
    detail: [
      "If your buyer is foreign, a licensed SPK valuation report is compulsory — we prepare the property and the documents for it.",
      "We keep both solicitors moving and flag anything that threatens the completion date early.",
      "Where a valuation lands below the agreed price, we manage the renegotiation rather than let the sale collapse.",
    ],
    timing: "2–4 weeks",
    owner: "Buyer's solicitor and valuer",
  },
  {
    id: "completion",
    icon: Building2,
    title: "Completion and funds",
    summary:
      "Deed transfer at the Land Registry, funds released to you, utilities closed and taxes settled correctly.",
    detail: [
      "Transfer happens in person or under power of attorney if you cannot travel.",
      "Capital gains tax applies if you sell within five years of purchase; beyond five years the gain is exempt for individuals.",
      "We close utility accounts and cancel standing orders so no bill follows you home.",
    ],
    timing: "Completion day",
    owner: "Land Registry, with us present",
  },
];

/**
 * Alıcı maliyet tablosu. Yüzdeler resmî oranlardır, sabit tutarlar ise
 * piyasa aralığıdır — bu ayrımı sütun başlıklarında da koruyoruz.
 * TODO: Oranlar değiştiğinde (özellikle tapu harcı) burayı güncelleyin.
 */
export const BUYING_COSTS = [
  {
    item: "Property transfer tax (tapu harcı)",
    amount: "4% of the declared value",
    note: "Legally split between buyer and seller; in practice usually negotiated.",
  },
  {
    item: "SPK valuation report",
    amount: "£150 – £300",
    note: "Mandatory on every sale to a foreign buyer.",
  },
  {
    item: "Independent legal representation",
    amount: "£1,000 – £1,800",
    note: "Always instruct your own solicitor, never the seller's.",
  },
  {
    item: "Notary, sworn translator and power of attorney",
    amount: "£250 – £500",
    note: "Higher if you complete remotely under power of attorney.",
  },
  {
    item: "DASK earthquake insurance",
    amount: "£60 – £150 per year",
    note: "Compulsory, and required before the deed can transfer.",
  },
  {
    item: "Utility subscriptions and connection",
    amount: "£150 – £350",
    note: "One-off, payable when accounts move into your name.",
  },
] as const;

export const BUYING_FAQS = [
  {
    question: "Can a foreign citizen buy property in Fethiye?",
    answer:
      "Yes. Foreign nationals can buy freehold property in Türkiye in their own name, and the title deed (TAPU) is registered directly to you. Purchases in Fethiye, Ölüdeniz, Hisarönü, Ovacık, Çalış, Üzümlü and Göcek sit outside restricted military zones, and the standard registry clearance confirms this before completion.",
  },
  {
    question: "How long does it take to buy a villa in Turkey?",
    answer:
      "Most purchases in the Fethiye area complete within four to eight weeks of an accepted offer, assuming the property has an individual title deed and no outstanding debts. The two stages that most often add time are the SPK valuation report and the currency transfer certificate (DAB).",
  },
  {
    question: "Do I need to be in Turkey to complete the purchase?",
    answer:
      "No. You can complete under a power of attorney granted to your solicitor, signed either at a Turkish notary during your viewing trip or at a Turkish consulate or embassy in your own country. Most of our buyers attend the title deed appointment in person, but it is not a requirement.",
  },
  {
    question: "What are the total costs on top of the villa price?",
    answer:
      "Budget roughly 6–8% of the purchase price. That covers the 4% property transfer tax, the mandatory SPK valuation report, notary and sworn translation fees, DASK earthquake insurance and independent legal representation.",
  },
  {
    question: "Does buying in Fethiye qualify me for Turkish citizenship?",
    answer:
      "Purchases at or above the current government investment threshold can qualify, provided the property is held for three years and the payment is made in the prescribed way. We flag eligible listings and refer you to a specialist immigration lawyer before you commit to anything on that basis.",
  },
];

export const SELLING_FAQS = [
  {
    question: "What does it cost to sell a property in Turkey?",
    answer:
      "Agency commission in the Fethiye region is typically 3% plus VAT, payable on completion. The seller's share of the 4% transfer tax is negotiable and in practice often falls to the buyer. You will also need a valid energy performance certificate, which costs a few thousand lira if you do not already hold one.",
  },
  {
    question: "Will I pay capital gains tax when I sell?",
    answer:
      "If you sell within five years of the purchase date, the gain is subject to Turkish income tax on a sliding scale, calculated on the difference between the indexed purchase price and the sale price. After five years of ownership, gains realised by individuals are exempt. Your tax position at home is separate and worth checking with an adviser in your own country.",
  },
  {
    question: "How long does it take to sell a villa in Fethiye?",
    answer:
      "A correctly priced villa in Ölüdeniz, Hisarönü or central Fethiye typically finds a buyer within three to six months, with the strongest enquiry volume between February and June as international buyers plan viewing trips. From accepted offer to completion is a further four to eight weeks.",
  },
  {
    question: "Do I need to be in Turkey to sell my property?",
    answer:
      "No. We hold keys and manage all viewings, and you can complete the transfer under a power of attorney granted to your solicitor. Many of our sellers handle the entire process from abroad.",
  },
  {
    question: "What documents do I need before listing?",
    answer:
      "Your title deed (TAPU), the habitation certificate (iskân), a valid energy performance certificate (Enerji Kimlik Belgesi), active DASK earthquake insurance and up-to-date proof that property tax and any site maintenance dues are paid. We audit all of these before the property goes live.",
  },
];

/* ------------------------------------------------- SATIŞ SAYFASI İÇERİĞİ */

/**
 * Eski sitedeki satış sayfasının omurgası, satıcının kendi diliyle kurulmuş
 * üç şikâyet. Sayfaya bunlarla başlamak, hizmeti anlatmadan önce sorunu
 * tanıdığımızı gösterir — dönüşüm açısından en güçlü açılış bu.
 */
export const SELLER_PAIN_POINTS = [
  {
    problem: "My property is not reaching the right market",
    answer:
      "Most listings are pushed to whoever happens to be browsing. Yours needs to reach international buyers actively planning a purchase in Fethiye — a much smaller, much more valuable audience.",
  },
  {
    problem: "My agent never tells me anything",
    answer:
      "You get written feedback after every single viewing, including the objections, plus a monthly summary of enquiry numbers and where they came from.",
  },
  {
    problem: "My property is not getting enough viewings",
    answer:
      "Viewing volume is almost always a pricing or presentation problem rather than an exposure problem. We will tell you which of the two it is, honestly, and what to do about it.",
  },
];

/**
 * Kitlesel pazarlama ile hedefli pazarlamanın karşılaştırması.
 * Eski sitedeki iki sütunlu anlatımın aynısı — orada sadece kelimelerdi,
 * burada ekranda da yan yana duruyor.
 */
export const MARKETING_CONTRAST = {
  mass: {
    title: "Mass marketing",
    traits: [
      "Desperate",
      "Sporadic",
      "Uncontrolled",
      "Pricing mistakes",
      "Listed everywhere, owned by no one",
    ],
  },
  targeted: {
    title: "Targeted marketing",
    traits: [
      "High impact",
      "Correct audience",
      "Quality marketing",
      "Controlled",
      "Personalised to your property",
    ],
  },
} as const;

/** Altı aylık tek yetkili anlaşma teklifi — eski sitedeki ana çağrı. */
export const SOLE_AGENT_POINTS = [
  "Six months, with no additional fee for the exclusivity itself.",
  "Your property is worked properly rather than sitting in a pile shared between five agencies.",
  "We invest in professional photography and a measured floor plan up front.",
  "Access to our network of partner agents overseas — channels our competitors in this region are not using.",
  "No tie-in beyond the six months. If we have not delivered, you walk away.",
];
