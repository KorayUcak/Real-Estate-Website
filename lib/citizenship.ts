import {
  Banknote,
  FileSearch,
  Landmark,
  Plane,
  ScrollText,
  Stamp,
  Users,
} from "lucide-react";
import type { ProcessStep } from "@/lib/process";

/**
 * Türk Vatandaşlığı (Gayrimenkul Yatırımı Yoluyla) sayfasının içeriği.
 *
 * ⚠️ MEVZUAT UYARISI — BAKIM NOTU
 * Buradaki eşik ve süreler Cumhurbaşkanlığı kararnamesiyle belirlenir ve
 * DEĞİŞİR. Eşik 2018'de 1.000.000 USD, 2018 sonunda 250.000 USD, Haziran
 * 2022'den itibaren 400.000 USD oldu. Sayfadaki her rakam bu dosyadan
 * gelir; güncelleme gerektiğinde TEK değiştirilecek yer burasıdır.
 * Son doğrulama: Ağustos 2026 — 400.000 USD yürürlükte.
 */

/** Tüm sayfada tekrarlanan eşik — tek kaynak. */
export const CITIZENSHIP_THRESHOLD_USD = 400_000;
export const CITIZENSHIP_THRESHOLD_LABEL = "$400,000";
/** Tapuya işlenen satmama taahhüdü. */
export const CITIZENSHIP_HOLD_YEARS = 3;

export const CITIZENSHIP_STEPS: ProcessStep[] = [
  {
    id: "eligibility",
    icon: FileSearch,
    title: "Confirm eligibility and shortlist",
    summary: `We identify properties that comfortably clear the ${CITIZENSHIP_THRESHOLD_LABEL} threshold on a licensed valuation, not just on the asking price.`,
    detail: [
      `The qualifying figure is ${CITIZENSHIP_THRESHOLD_LABEL} USD, assessed by an official valuation — not the price on the listing and not the figure declared at the registry.`,
      "You may combine several properties to reach the threshold; they do not need to be a single purchase.",
      "Residential, commercial and land purchases all qualify, provided the valuation and payment conditions are met.",
    ],
    timing: "Week 1–2",
    owner: "Coast 2 Coast, with your solicitor",
  },
  {
    id: "valuation",
    icon: ScrollText,
    title: "Obtain the official valuation report",
    summary:
      "A government-licensed (SPK) appraisal company inspects the property and files a report confirming the value meets the threshold.",
    detail: [
      "The report must be produced by a licensed appraiser on the official list and is filed directly with the authorities.",
      "The valuation must confirm the threshold is met at the time of purchase — a report obtained months earlier will not carry.",
      "If the valuation lands below the threshold, the application fails. This is exactly why we check it before you commit.",
    ],
    timing: "Week 2–3",
    owner: "Licensed SPK appraiser",
  },
  {
    id: "payment",
    icon: Banknote,
    title: "Transfer funds through a Turkish bank",
    summary:
      "The purchase amount is transferred to a bank in Türkiye and exchanged into Turkish lira, which produces the certificate the application requires.",
    detail: [
      "Payment must be routed through the Turkish banking system and evidenced — cash purchases do not qualify.",
      "The bank issues a foreign currency purchase certificate (DAB) in your name against the exchanged amount.",
      "Bank receipts must show the buyer paying the seller directly; third-party payments cause applications to be rejected.",
    ],
    timing: "Week 3–4",
    owner: "You, your bank and FX broker",
  },
  {
    id: "tapu",
    icon: Landmark,
    title: "Title deed transfer with the 3-year annotation",
    summary: `The deed transfers into your name carrying an official annotation that the property will not be sold for ${CITIZENSHIP_HOLD_YEARS} years.`,
    detail: [
      "The annotation is a legal commitment recorded on the TAPU itself, not a private undertaking.",
      "A sworn translator attends the Land Registry appointment; nothing is signed in a language you do not read.",
      "You become the registered freehold owner on the day, with full use of the property throughout the holding period.",
    ],
    timing: "Week 4–6",
    owner: "Land Registry, with us present",
  },
  {
    id: "conformity",
    icon: Stamp,
    title: "Certificate of conformity",
    summary:
      "The Ministry reviews the valuation, the payment evidence and the deed, then issues the certificate confirming the investment qualifies.",
    detail: [
      "This certificate is the document that unlocks the citizenship application itself.",
      "Every piece of evidence from the previous stages is examined together — which is why sequence matters so much.",
      "Your solicitor submits and tracks this on your behalf.",
    ],
    timing: "Week 6–8",
    owner: "Your immigration solicitor",
  },
  {
    id: "residence-permit",
    icon: Users,
    title: "Residence permit and citizenship application",
    summary:
      "Applications are submitted to the Directorate General of Migration Management for you, your spouse and any children under 18.",
    detail: [
      "The applicant, their spouse and children under 18 are all included in the same application.",
      "Biometrics and documents are lodged together; there is no language test and no interview requirement.",
      "You are not required to live in Türkiye before or after approval.",
    ],
    timing: "Week 8–10",
    owner: "Directorate General of Migration Management",
  },
  {
    id: "approval",
    icon: Plane,
    title: "Approval, ID card and passport",
    summary:
      "Approval typically follows within around three months, after which Turkish ID cards and passports are issued to the family.",
    detail: [
      "Timescales are indicative and depend on application volumes — three months is typical rather than guaranteed.",
      "Any children born after citizenship is granted become Turkish citizens automatically.",
      "Türkiye permits dual nationality, so your existing passport is unaffected.",
    ],
    timing: "~3 months",
    owner: "Republic of Türkiye",
  },
];

export const CITIZENSHIP_BENEFITS = [
  {
    title: "The whole family, in one application",
    body: "The main applicant, their spouse and all children under 18 are granted citizenship together. Children born afterwards are Turkish citizens automatically.",
  },
  {
    title: "Dual nationality is permitted",
    body: "Türkiye does not require you to renounce your existing citizenship, so you keep your existing passport alongside the Turkish one.",
  },
  {
    title: "No residence requirement",
    body: "There is no obligation to live in Türkiye before or after the grant, no language examination and no interview to sit.",
  },
  {
    title: "The investment is retained, not spent",
    body: `Unlike a donation-based programme, you keep the asset. After ${CITIZENSHIP_HOLD_YEARS} years you are free to sell, and citizenship remains permanent.`,
  },
  {
    title: "Access to the E-2 investor route",
    body: "Türkiye holds an E-2 treaty with the United States, which Turkish citizens can use to apply for an investor visa — a route not open to most other nationalities directly.",
  },
  {
    title: "Full domestic rights",
    body: "Citizens have the same access to healthcare, education, property ownership and business registration as any other Turkish national.",
  },
];

export const CITIZENSHIP_DOCUMENTS = [
  "Passport copies for every applicant, notarised and translated",
  "Birth certificates for the applicant, spouse and any children",
  "Marriage certificate or proof of marital status",
  "Residence certificates confirming current address",
  "Valid Turkish health insurance cover",
  "Biometric photographs to the official specification",
  "The title deed (TAPU) carrying the three-year annotation",
  "The SPK valuation report and bank payment evidence (DAB)",
];

export const CITIZENSHIP_FAQS = [
  {
    question:
      "How much do I need to invest for Turkish citizenship in 2026?",
    answer: `The minimum property investment is ${CITIZENSHIP_THRESHOLD_LABEL} USD, confirmed by an official valuation report from a government-licensed appraisal company. The threshold rose from $250,000 to ${CITIZENSHIP_THRESHOLD_LABEL} in June 2022. You may combine more than one property to reach the figure, and residential, commercial and land purchases all qualify.`,
  },
  {
    question: "How long do I have to keep the property?",
    answer: `A minimum of ${CITIZENSHIP_HOLD_YEARS} years. The commitment is recorded as a formal annotation on the title deed itself, so it is a legal restriction rather than an informal undertaking. You have full use of the property throughout, and once the period ends you are free to sell — your citizenship is permanent and is not affected by the sale.`,
  },
  {
    question: "How long does the citizenship process take?",
    answer:
      "Approval typically arrives within around three months of a complete application being submitted, with the property purchase and certificate of conformity taking roughly six to eight weeks before that. Timescales are indicative and depend on application volumes at the Directorate General of Migration Management.",
  },
  {
    question: "Who in my family is included?",
    answer:
      "The main applicant, their spouse and all children under 18 are granted citizenship in the same application. Children born after citizenship is granted become Turkish citizens automatically. Adult children are not included and would need to qualify in their own right.",
  },
  {
    question: "Do I have to give up my current citizenship?",
    answer:
      "No, not on Türkiye’s side — it permits dual nationality outright. Most countries take the same view, so applicants keep both passports; a handful do restrict it, which is worth confirming with your own authorities before you apply.",
  },
  {
    question: "Do I need to live in Turkey or speak Turkish?",
    answer:
      "Neither. There is no residence requirement before or after the grant, no language examination and no interview. You do need to be physically present for biometrics, and for the title deed appointment unless you complete under a power of attorney.",
  },
  {
    question: "Can I rent the property out during the three years?",
    answer:
      "Yes. The annotation restricts sale, not use. You can live in the property, leave it empty or let it out commercially throughout the holding period, and the rental income is yours.",
  },
  {
    question: "What happens if the valuation comes in below the threshold?",
    answer: `The application cannot proceed on that property. This is why we check the likely valuation before you commit rather than after — a property marketed at ${CITIZENSHIP_THRESHOLD_LABEL} does not automatically value at ${CITIZENSHIP_THRESHOLD_LABEL}, and the official report is the only figure that counts.`,
  },
];
