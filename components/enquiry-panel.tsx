"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { LeadForm } from "@/components/lead-form";
import {
  useSettings,
  useWhatsappLink,
} from "@/components/settings-provider";
import { Price } from "@/components/price";
import { cn } from "@/lib/cn";
import { villaSummaryLine } from "@/lib/villa-format";
import type { Villa } from "@/lib/types";
import { useT } from "@/components/translation";
/**
 * Panelin okuduğu ALANLAR — tam `Villa` değil.
 *
 * İstemci bileşenine geçen her prop RSC payload'ına serileşir. Tam nesne
 * geçildiğinde ilanın koordinatları (21 kayıtta Miami) sayfa kaynağına
 * giriyordu; panel bunların hiçbirini kullanmıyor.
 */
export type EnquiryVilla = {
  title: string;
  reference: string;
  status: Villa["status"];
  price: number;
  bedrooms: number;
  bathrooms: number;
  buildSizeSqm: number;
};

const STATUS_LABEL: Record<Villa["status"], string> = {
  "for-sale": "For sale",
  reserved: "Reserved",
  sold: "Sold",
  "off-market": "Off market",
};

/**
 * İlan sayfasının dönüşüm merkezi: yapışkan (sticky) talep paneli.
 *
 * Buzlu cam etkisi bir süs değil, bir hiyerarşi aracı: panel sayfanın
 * geri kalanından ayrı bir katmanmış gibi durur ve göz metin sütunundan
 * her ayrıldığında oraya gider. Efektin görünmesi için panelin arkasına
 * yumuşak degrade lekeleri konur — düz zemin üstünde `backdrop-blur`
 * hiçbir şey yapmaz.
 *
 * `max-h` + `overflow-y-auto`: panel kısa ekranlarda viewport'tan uzun
 * kalırsa alt kısmı erişilemez hâle gelmesin diye.
 */
export function EnquiryPanel({ villa }: { villa: EnquiryVilla }) {
  const { t } = useT();
  const reduceMotion = useReducedMotion();
  const { contact } = useSettings();

  const enquiryMessage = `Hello Coast 2 Coast — I'd like more information about ${villa.title} (ref ${villa.reference}).`;
  const whatsappUrl = useWhatsappLink(enquiryMessage);

  return (
    <div className="relative lg:sticky lg:top-24 lg:max-h-[calc(100svh-7rem)] lg:overflow-y-auto">
      {/*
        Cam efektinin "arkası" — yalnızca dekoratif.

        Taşma bilinçli: lekeler panelin dışına sızmalı. Ama MOBİLDE 2rem'lik
        sızıntı, `container-page`in 1.5rem'lik yan boşluğundan büyüktü ve
        viewport'un 8px dışına çıkıyordu (ölçüldü: ilan sayfası 375px'te
        383px içerik). `overflow-x: clip` bunu gizliyordu; gizlenen bir taşma
        yine de taşmadır. Mobilde 1rem, `sm`den itibaren eski 2rem.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-4 -z-10 overflow-hidden sm:-inset-8"
      >
        <div className="absolute -right-10 top-0 size-64 bg-sea/30 blur-3xl" />
        <div className="absolute -left-16 bottom-10 size-72 bg-sea-deep/20 blur-3xl" />
      </div>

      <div className="glass-panel p-7 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs uppercase tracking-widest text-ink-40">
            {villa.reference}
          </p>
          <p
            className={cn(
              "px-3 py-1 text-[11px] uppercase tracking-widest",
              villa.status === "for-sale"
                ? "bg-sea/20 text-sea"
                : "bg-ink/10 text-ink-70",
            )}
          >
            {STATUS_LABEL[villa.status]}
          </p>
        </div>

        <h2 id="enquiry-heading" className="sr-only">
          {t("panel.priceAndEnquiry")}
        </h2>

        <Price
          gbp={villa.price}
          showApproxNote
          className="mt-6 block font-display text-4xl leading-none text-sea-deep"
        />

        <p className="mt-4 text-sm text-ink-70">{villaSummaryLine(villa)}</p>

        <div className="mt-7 flex flex-col gap-3">
          {/*
            Nabız halkası: butonun ARKASINDA büyüyüp sönen bir katman.
            Butonun kendisi hareket etmediği için tıklama hedefi sabit kalır —
            titreyen bir CTA'ya nişan almak zorunda kalmazsınız.
          */}
          <span className="relative inline-flex">
            {!reduceMotion ? (
              <motion.span
                aria-hidden="true"
                initial={{ opacity: 0.55, scale: 1 }}
                animate={{ opacity: 0, scale: 1.12 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 0.6,
                  ease: "easeOut",
                }}
                className="absolute inset-0 bg-gold"
              />
            ) : null}

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative inline-flex w-full items-center justify-center gap-2 bg-gold px-6 py-4 font-sans text-xs font-bold uppercase tracking-widest text-ink transition-colors hover:bg-sea-deep hover:text-shell"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              {t("panel.whatsappInfo")}
            </a>
          </span>

          <a
            href={`tel:${contact.phoneE164}`}
            className="inline-flex items-center justify-center gap-2 border border-line bg-shell/60 px-6 py-3.5 text-sm font-medium text-sea-deep transition-colors hover:bg-shell-deep"
          >
            <Phone className="size-4" aria-hidden="true" />
            {contact.phoneDisplay}
          </a>
        </div>

        <div className="mt-8 border-t border-line/70 pt-8">
          <p className="font-display text-lg leading-snug text-sea-deep">
            {t("panel.requestDetails")}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-ink-40">
            {t("panel.detailsBody")}
          </p>

          <div className="mt-6">
            <LeadForm
              variant="panel"
              propertyReference={villa.reference}
              propertyTitle={villa.title}
            />
          </div>
        </div>
      </div>

      <p className="mt-6 inline-flex items-start gap-2 text-xs leading-relaxed text-ink-40">
        <ShieldCheck
          className="mt-0.5 size-4 shrink-0 text-sea"
          aria-hidden="true"
        />
        {t("panel.viewingsNote")}
          </p>
    </div>
  );
}

/**
 * Mobil aksiyon çubuğu.
 *
 * Masaüstünde yapışkan panel her zaman görünür; mobilde ise fiyat ve iletişim
 * sayfanın en altında kalır. Ekranın altına sabitlenmiş bu çubuk aradaki farkı
 * kapatır — telefon trafiğinin ağırlığı düşünülürse ilan sayfasındaki en
 * değerli tek bileşen budur.
 *
 * `lg:hidden`: panel görünür hâle geldiği kırılımda çubuk kaybolur ki aynı
 * çağrı iki kez yapılmasın.
 */
export function MobileEnquiryBar({ villa }: { villa: EnquiryVilla }) {
  const { contact } = useSettings();

  const enquiryMessage = `Hello Coast 2 Coast — I'd like more information about ${villa.title} (ref ${villa.reference}).`;
  const whatsappUrl = useWhatsappLink(enquiryMessage);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-shell/85 px-4 py-3 backdrop-blur-xl lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Price
            gbp={villa.price}
            className="block truncate font-display text-xl leading-none text-sea-deep"
          />
          <p className="mt-1 truncate text-[11px] text-ink-40">
            {villaSummaryLine(villa)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href={`tel:${contact.phoneE164}`}
            aria-label={`Call us on ${contact.phoneDisplay}`}
            className="inline-flex size-11 items-center justify-center border border-line text-sea-deep"
          >
            <Phone className="size-4" aria-hidden="true" />
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gold px-5 py-3 font-sans text-xs font-bold uppercase tracking-widest text-ink"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            Enquire
          </a>
        </div>
      </div>
    </div>
  );
}
