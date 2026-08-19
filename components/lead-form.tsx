"use client";

import { useActionState, useId } from "react";
import { CircleAlert, CircleCheck, Loader2, MessageCircle, Send } from "lucide-react";
import { submitEnquiry } from "@/app/actions/enquiry";
import { EMPTY_ENQUIRY_STATE, type EnquiryState } from "@/lib/enquiry";
import { useWhatsappLink } from "@/components/settings-provider";

/**
 * Talep formu. `useActionState` ile Server Action'a bağlıdır:
 * JavaScript yüklenmeden önce gönderilirse tarayıcı formu normal biçimde
 * POST eder ve aynı sunucu kodu çalışır — yani form hiçbir koşulda ölü değildir.
 *
 * Doğrulama sunucuda yapılır; `required` gibi HTML nitelikleri yalnızca
 * hızlı geri bildirim içindir, güvenlik sınırı değildir.
 */

type LeadFormProps = {
  /**
   * "panel": ilan/danışmanlık sayfalarındaki dar sticky kart.
   * "page":  iletişim sayfasındaki geniş form (bütçe alanı dahil).
   */
  variant?: "panel" | "page";
  /** İlan sayfasından gelen talebe ilan kodunu iliştirir. */
  propertyReference?: string;
  propertyTitle?: string;
  /**
   * Talebin hangi sayfadan geldiği ("Citizenship", "Insurance", ...).
   * Gizli alan olarak gönderilir; gelen kutusunda sınıflandırma yapmayı sağlar.
   */
  enquiryType?: string;
  /** Mesaj alanının ön dolgusu. Verilmezse ilan bilgisinden türetilir. */
  defaultMessage?: string;
  /** Gönder butonunun metni — sayfanın diline uyum sağlaması için. */
  submitLabel?: string;
  /** Başarı ekranındaki WhatsApp linkine gidecek hazır mesaj. */
  whatsappMessage?: string;
  /** Bütçe alanı yalnızca emlak bağlamında anlamlı — sigortada gizlenir. */
  showBudget?: boolean;
};

const inputStyles =
  "w-full rounded-none border-b border-line bg-transparent px-0 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-40 focus:border-sea";

export function LeadForm({
  variant = "page",
  propertyReference,
  propertyTitle,
  enquiryType,
  defaultMessage,
  submitLabel,
  whatsappMessage,
  showBudget,
}: LeadFormProps) {
  const [state, formAction, isPending] = useActionState<EnquiryState, FormData>(
    submitEnquiry,
    EMPTY_ENQUIRY_STATE,
  );

  /** Aynı sayfada iki form olabilir (ilan + iletişim); id'ler çakışmamalı. */
  const uid = useId();
  const fieldId = (name: string) => `${uid}-${name}`;
  const errorId = (name: string) => `${uid}-${name}-error`;

  /** İlan bağlamı varsa mesaj ve WhatsApp metni ondan türetilir. */
  const propertyContext = propertyTitle
    ? `${propertyTitle}${propertyReference ? ` (ref ${propertyReference})` : ""}`
    : null;

  const resolvedMessage =
    defaultMessage ??
    (propertyContext ? `I'd like more information about ${propertyContext}.` : "");

  /* Hook koşulsuz çağrılmalı: mesaj aşağıda türetiliyor ama bağlantı
     her render'da aynı sırada kuruluyor. */
  const resolvedWhatsapp =
    whatsappMessage ??
    (propertyContext
      ? `Hello Coast 2 Coast — I'd like more information about ${propertyContext}.`
      : "Hello Coast 2 Coast — I'd like to talk about buying a villa in Fethiye.");

  const whatsappUrl = useWhatsappLink(resolvedWhatsapp);

  /** Bütçe alanı: açıkça belirtilmediyse geniş formda görünür, dar panelde görünmez. */
  const budgetVisible = showBudget ?? variant === "page";

  if (state.status === "success") {
    return (
      <div
        role="status"
        className="flex flex-col items-start gap-5 border border-sea/30 bg-sea/5 p-8"
      >
        <CircleCheck className="size-8 text-sea" aria-hidden="true" />
        <p className="font-display text-xl leading-snug text-sea-deep">
          Message received
        </p>
        <p className="text-sm leading-relaxed text-ink-70">{state.message}</p>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-sea underline underline-offset-4"
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          Need an answer sooner? Message us on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      {propertyReference ? (
        <input type="hidden" name="propertyReference" value={propertyReference} />
      ) : null}

      {enquiryType ? (
        <input type="hidden" name="enquiryType" value={enquiryType} />
      ) : null}

      {/*
        Honeypot. `sr-only` yerine tamamen gizli + tabIndex={-1}:
        ekran okuyucu kullanıcısının sekmeyle içine düşmesini de engeller.
        autoComplete="off" olmazsa tarayıcı otomatik doldurup tuzağı tetikleyebilir.
      */}
      <div aria-hidden="true" className="hidden">
        <label htmlFor={fieldId("company")}>Company (leave blank)</label>
        <input
          id={fieldId("company")}
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className={variant === "page" ? "grid gap-6 sm:grid-cols-2" : ""}>
        <Field
          id={fieldId("name")}
          errorId={errorId("name")}
          name="name"
          label="Full name"
          autoComplete="name"
          placeholder="Jane Whitfield"
          error={state.fieldErrors.name}
          required
        />
        <Field
          id={fieldId("email")}
          errorId={errorId("email")}
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          placeholder="jane@example.com"
          error={state.fieldErrors.email}
          required
        />
      </div>

      <div className={variant === "page" ? "grid gap-6 sm:grid-cols-2" : ""}>
        <Field
          id={fieldId("phone")}
          errorId={errorId("phone")}
          name="phone"
          type="tel"
          label="Phone (optional)"
          autoComplete="tel"
          placeholder="Include your country code"
          error={state.fieldErrors.phone}
        />

        {budgetVisible ? (
          <div className="flex flex-col gap-2">
            <label
              htmlFor={fieldId("budget")}
              className="eyebrow text-ink-40"
            >
              Budget (optional)
            </label>
            <select
              id={fieldId("budget")}
              name="budget"
              defaultValue=""
              className={`${inputStyles} cursor-pointer`}
            >
              <option value="">Select a range</option>
              <option value="Up to £250,000">Up to £250,000</option>
              <option value="£250,000 – £450,000">£250,000 – £450,000</option>
              <option value="£450,000 – £750,000">£450,000 – £750,000</option>
              <option value="£750,000+">£750,000+</option>
            </select>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={fieldId("message")} className="eyebrow text-ink-40">
          How can we help?
        </label>
        <textarea
          id={fieldId("message")}
          name="message"
          rows={variant === "panel" ? 3 : 5}
          required
          defaultValue={resolvedMessage}
          placeholder="Tell us your timeline, whether this is a holiday home or an investment, and when you could travel."
          aria-invalid={state.fieldErrors.message ? true : undefined}
          aria-describedby={
            state.fieldErrors.message ? errorId("message") : undefined
          }
          className={`${inputStyles} resize-y`}
        />
        {state.fieldErrors.message ? (
          <FieldError id={errorId("message")}>
            {state.fieldErrors.message}
          </FieldError>
        ) : null}
      </div>

      {/*
        aria-live: hata mesajı gönderim sonrası belirir. Ekran okuyucu
        kullanıcısı odak yerinden oynamadan bilgilendirilmiş olur.
      */}
      {state.status === "error" && state.message ? (
        <p
          role="alert"
          className="inline-flex items-start gap-2 text-sm text-red-700"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center gap-2 bg-sea-deep px-8 py-4 text-sm font-medium text-shell transition-colors hover:bg-sea disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Sending…
          </>
        ) : (
          <>
            <Send className="size-4" aria-hidden="true" />
            {submitLabel ??
              (variant === "panel" ? "Request details" : "Send enquiry")}
          </>
        )}
      </button>

      <p className="text-xs leading-relaxed text-ink-40">
        We reply personally, never share your details, and do not add you to a
        mailing list without asking.
      </p>
    </form>
  );
}

function Field({
  id,
  errorId,
  name,
  label,
  type = "text",
  placeholder,
  autoComplete,
  error,
  required = false,
}: {
  id: string;
  errorId: string;
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="eyebrow text-ink-40">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={inputStyles}
      />
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  );
}

function FieldError({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <p id={id} className="text-xs text-red-700">
      {children}
    </p>
  );
}
