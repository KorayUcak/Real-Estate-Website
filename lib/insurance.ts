import { Building2, Sofa, TriangleAlert, type LucideIcon } from "lucide-react";

/**
 * Türkiye'de mülk sigortası sayfasının içeriği.
 *
 * ⚠️ BAKIM NOTU — DASK teminat tavanı her yıl devlet tarafından yeniden
 * belirlenir. Rakamı sayfaya sabitlemek yerine `DASK_COVERAGE_CAP` üzerinden
 * tek yerden yönetiyoruz. Güncel tutarı poliçe sağlayıcınızdan teyit edip
 * buraya yazın; teyit edilmemiş bir rakam yayımlamak, müşteriyi eksik
 * sigortalı olduğunu fark etmeden bırakır.
 */

/** TODO: Cari yılın DASK azami teminat tutarını buraya girin (ör. "₺1.272.000"). */
export const DASK_COVERAGE_CAP: string | null = null;

export type PolicyType = {
  id: string;
  icon: LucideIcon;
  name: string;
  status: "Compulsory by law" | "Strongly recommended" | "Optional but advised";
  summary: string;
  detail: string[];
};

export const POLICY_TYPES: PolicyType[] = [
  {
    id: "dask",
    icon: TriangleAlert,
    name: "DASK — compulsory earthquake insurance",
    status: "Compulsory by law",
    summary:
      "The state-backed earthquake scheme (Doğal Afet Sigortaları Kurumu). Every residential property on registered land must hold a live policy.",
    detail: [
      "Required before a title deed can transfer and before utility subscriptions can be opened or moved into your name.",
      "The premium is calculated from the property's size in square metres, its construction type and its seismic risk zone — not from what you paid for it.",
      "DASK is explicit that it covers the 'bare bones' rebuild cost only, up to a maximum sum insured set by the state and revised annually.",
      "Anything above that cap, and everything inside the building, is your responsibility to insure separately.",
    ],
  },
  {
    id: "buildings",
    icon: Building2,
    name: "Buildings insurance",
    status: "Strongly recommended",
    summary:
      "Private cover for the structure itself, written on rebuild value rather than market value — the two are very different numbers.",
    detail: [
      "Rebuild value is calculated as the property's square metres, taken from the TAPU, multiplied by the current cost per square metre to rebuild.",
      "A villa that would sell for £600,000 might cost far less to rebuild; insuring on market value means paying for cover you cannot claim.",
      "Extends beyond earthquake to fire, storm, flood, burst pipes, impact and malicious damage.",
      "Tops up the gap that DASK's statutory cap leaves behind on higher-value properties.",
    ],
  },
  {
    id: "contents",
    icon: Sofa,
    name: "Contents insurance",
    status: "Optional but advised",
    summary:
      "Everything that would fall out if you turned the building upside down: furnishings, appliances, personal valuables and outdoor items.",
    detail: [
      "Typically covers furniture, beds, bedding, clothes, electrical equipment, outdoor furniture and jewellery.",
      "High-value single items — jewellery, watches, art, bicycles — usually need to be listed and valued individually.",
      "Pay attention to the excess: the amount you contribute to every claim. A low premium with a high excess can be poor value.",
      "Particularly worth holding if the property is let out or left empty for months at a time.",
    ],
  },
];

/** DASK'ın kapsadığı ve kapsamadığı kalemler — sayfanın en pratik bölümü. */
export const DASK_COVERED = [
  "Earthquake damage to the building structure",
  "Fire caused by an earthquake",
  "Explosion caused by an earthquake",
  "Landslide caused by an earthquake",
  "Tsunami caused by an earthquake",
  "The rebuild cost of the structure, up to the state-set annual cap",
];

export const DASK_NOT_COVERED = [
  "Contents of any kind — furniture, electronics, clothing, jewellery",
  "Fire, flood or storm damage that is not the result of an earthquake",
  "Theft or burglary, whether or not it follows an earthquake",
  "Water damage from burst pipes or appliance failure",
  "Any rebuild cost above the state-set maximum sum insured",
  "Loss of rental income while the property is uninhabitable",
  "Personal liability if someone is injured at the property",
  "Swimming pools, garden walls, landscaping and outbuildings",
];

export const PRIVATE_COVERED = [
  "Fire, smoke, lightning and explosion",
  "Storm, flood and burst pipes",
  "Theft and attempted theft, including forced entry damage",
  "Accidental glass and sanitary ware breakage",
  "Rebuild cost above the DASK cap",
  "Alternative accommodation while repairs are carried out",
  "Personal liability cover for injury to visitors",
  "Optional add-ons: rental income protection, pool and garden cover",
];

export const PRIVATE_NOT_COVERED = [
  "Wear, tear and gradual deterioration",
  "Existing damage present before the policy started",
  "Damage from failing to maintain the property",
  "Unoccupancy beyond the period stated in the policy — usually 30 to 60 days",
  "Undeclared high-value items above the single-article limit",
  "Damage during building works unless specifically declared",
];

/** Sigortacıyı aramadan önce hazırlanacaklar — eski sitedeki tavsiyenin genişletilmiş hâli. */
/** QUOTE_CHECKLIST ile AYNI SIRADA — sözlük anahtarları. */
export const QUOTE_CHECKLIST_KEYS = [
  "tapu",
  "construction",
  "inventory",
  "valuations",
  "occupancy",
  "excess",
] as const;

export const QUOTE_CHECKLIST = [
  {
    title: "Your TAPU",
    body: "The title deed gives the registered square metres, which drives both the DASK premium and the rebuild calculation.",
  },
  {
    title: "Construction type and year built",
    body: "Reinforced concrete, steel or masonry, plus the build year — all three change the earthquake risk rating.",
  },
  {
    title: "A written inventory",
    body: "Photograph and list everything you want covered before you call. Reconstructing this after a loss is far harder than doing it now.",
  },
  {
    title: "Valuations for high-value items",
    body: "Jewellery, watches and art usually need individual receipts or valuations to be covered at full value.",
  },
  {
    title: "Your occupancy pattern",
    body: "How many months a year the property sits empty, and whether it is let commercially. Both affect cover and must be declared.",
  },
  {
    title: "The excess you are comfortable with",
    body: "Decide what you would contribute per claim before comparing premiums, otherwise the cheapest quote will win on the wrong measure.",
  },
];

export const INSURANCE_FAQS = [
  {
    question: "Is DASK insurance compulsory in Turkey?",
    answer:
      "Yes. DASK (Doğal Afet Sigortaları Kurumu) is compulsory for residential properties on registered land. A live policy is required before a title deed can transfer and before electricity and water subscriptions can be opened or moved into your name. It renews annually and lapsing can block utility transactions.",
  },
  {
    question: "Is DASK enough on its own?",
    answer:
      "No, and DASK itself is clear about this. It covers the bare rebuild cost of the structure up to a maximum sum insured set by the state each year, and only for earthquake-related damage. It covers no contents at all, no theft, no water damage and no fire unless the fire was caused by an earthquake. Most owners hold DASK plus a private buildings and contents policy.",
  },
  {
    question: "How is my DASK premium calculated?",
    answer:
      "From the property's size in square metres as registered on the TAPU, its construction type, and the seismic risk zone it sits in. It is not based on the purchase price or market value, so two identically priced villas in different risk zones can carry noticeably different premiums.",
  },
  {
    question: "Should I insure my villa for its market value?",
    answer:
      "No — insure it for its rebuild value. Rebuild value is the registered square metres multiplied by the current cost per square metre to rebuild, and it is usually well below the market price because it excludes the land. Insuring on market value means paying a higher premium for cover you could never claim.",
  },
  {
    question: "What is an excess and why does it matter?",
    answer:
      "The excess is the amount you contribute to every claim before the insurer pays anything. A policy with a low premium and a high excess can cost you far more on a real claim than a slightly dearer policy with a modest excess. Agree the excess you are comfortable with before you start comparing quotes.",
  },
  {
    question: "Can I insure a property I rent out or leave empty?",
    answer:
      "Yes, but both must be declared. Most private policies limit continuous unoccupancy to somewhere between 30 and 60 days, and letting commercially usually requires a specific endorsement. Undeclared use is the most common reason an otherwise valid claim is refused.",
  },
  {
    question: "Can I arrange insurance in English?",
    answer:
      "Yes. We work with a local Fethiye insurance provider whose team handles home, car and health policies in English and Russian as well as Turkish, so you get the policy wording explained before you sign rather than after.",
  },
];
