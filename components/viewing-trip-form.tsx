"use client";

import { useActionState, useId } from "react";
import {
  CalendarCheck,
  CircleAlert,
  CircleCheck,
  Loader2,
  MessageCircle,
  Send,
} from "lucide-react";
import { submitEnquiry } from "@/app/actions/enquiry";
import { EMPTY_ENQUIRY_STATE, type EnquiryState } from "@/lib/enquiry";
import { useSettings, useWhatsappLink } from "@/components/settings-provider";
import { useT } from "@/components/translation";
import type { TranslationKey } from "@/lib/i18n";

/**
 * Görüntüleme gezisi rezervasyon formu.
 *
 * Ayrı bir bileşen olmasının sebebi: bu sayfa sitedeki EN YÜKSEK niyetli
 * sayfa. Genel iletişim formunu yeniden kullanmak yerine tarih, kişi sayısı
 * ve bütçe gibi alanları öne çıkarıyoruz — bir geziyi planlamak için gereken
 * tam olarak bu bilgiler, ve hepsini tek ekranda toplamak ileri geri
 * e-postalaşmayı ortadan kaldırıyor.
 *
 * Sürtünmeyi azaltmak için yalnızca ad, e-posta ve mesaj zorunlu; tarihler
 * bilinmiyorsa boş bırakılabilir.
 */

const inputStyles =
  "w-full rounded-none border-b border-line bg-transparent px-0 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-40 focus:border-sea";

const WHATSAPP_MESSAGE =
  "Hello Coast 2 Coast — I'd like to arrange a viewing trip to Fethiye.";

export function ViewingTripForm() {
  const { t, tag } = useT();
  const { contact } = useSettings();
  const whatsappUrl = useWhatsappLink(WHATSAPP_MESSAGE);

  const [state, formAction, isPending] = useActionState<EnquiryState, FormData>(
    submitEnquiry,
    EMPTY_ENQUIRY_STATE,
  );

  const uid = useId();
  const fieldId = (name: string) => `${uid}-${name}`;
  const errorId = (name: string) => `${uid}-${name}-error`;

  /**
   * `min`: geçmiş bir tarih seçilmesini tarayıcı seviyesinde engeller.
   * Sunucu tarafı doğrulama yine de bağımsız olarak çalışır.
   */
  const today = new Date().toISOString().slice(0, 10);

  if (state.status === "success") {
    return (
      <div
        role="status"
        className="flex flex-col items-start gap-5 border border-sea/30 bg-sea/5 p-8 sm:p-10"
      >
        <CircleCheck className="size-8 text-sea" aria-hidden="true" />
        <p className="font-display text-2xl leading-snug text-sea-deep">
          {t("tripForm.successTitle")}
        </p>
        <p className="leading-relaxed text-ink-70">{t(state.message as TranslationKey, { phone: contact.phoneDisplay })}</p>
        <p className="text-sm leading-relaxed text-ink-40">
          {t("tripForm.successBody")}
          </p>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-sea underline underline-offset-4"
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          {t("tripForm.successWhatsapp")}
        </a>
      </div>
    );
  }

  return (
    <form lang={tag} action={formAction} noValidate className="flex flex-col gap-8">
      <input type="hidden" name="enquiryType" value="Viewing trip" />

      {/* Honeypot — gerçek kullanıcı görmez, bot doldurur. */}
      <div aria-hidden="true" className="hidden">
        <label htmlFor={fieldId("company")}>{t("form.honeypot")}</label>
        <input
          id={fieldId("company")}
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        <Field
          id={fieldId("name")}
          errorId={errorId("name")}
          name="name"
          label={t("form.name")}
          autoComplete="name"
          
          error={state.fieldErrors.name && t(state.fieldErrors.name as TranslationKey)}
          required
        />
        <Field
          id={fieldId("email")}
          errorId={errorId("email")}
          name="email"
          type="email"
          label={t("form.email")}
          autoComplete="email"
          
          error={state.fieldErrors.email && t(state.fieldErrors.email as TranslationKey)}
          required
        />
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        <Field
          id={fieldId("phone")}
          errorId={errorId("phone")}
          name="phone"
          type="tel"
          label={t("tripForm.phoneLabel")}
          autoComplete="tel"
          
          error={state.fieldErrors.phone && t(state.fieldErrors.phone as TranslationKey)}
        />

        <div className="flex flex-col gap-2">
          <label htmlFor={fieldId("travellers")} className="eyebrow text-ink-40">
            {t("tripForm.travellingAs")}
          </label>
          <select
            id={fieldId("travellers")}
            name="travellers"
            defaultValue=""
            className={`${inputStyles} cursor-pointer`}
          >
            <option value="">Select</option>
            <option value="1 person">{t("tripForm.justMe")}</option>
            <option value="2 people">Two of us</option>
            <option value="Family with children">{t("tripForm.family")}</option>
            <option value="Group of friends">{t("tripForm.friends")}</option>
          </select>
        </div>
      </div>

      {/* --------------------------------------------------------- TARİHLER */}
      <fieldset className="border-0 p-0">
        <legend className="eyebrow mb-1 text-ink-40">
          {t("tripForm.preferredDates")}
        </legend>
        <p className="mb-6 text-xs leading-relaxed text-ink-40">
          {t("tripForm.datesHint")}
          </p>

        <div className="grid gap-8 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label
              htmlFor={fieldId("arrivalDate")}
              className="eyebrow text-ink-40"
            >
              {t("tripForm.arrival")}
            </label>
            <input
              id={fieldId("arrivalDate")}
              name="arrivalDate"
              type="date"
              min={today}
              className={`${inputStyles} cursor-pointer`}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor={fieldId("departureDate")}
              className="eyebrow text-ink-40"
            >
              {t("tripForm.returnDate")}
            </label>
            <input
              id={fieldId("departureDate")}
              name="departureDate"
              type="date"
              min={today}
              aria-invalid={state.fieldErrors.departureDate ? true : undefined}
              aria-describedby={
                state.fieldErrors.departureDate
                  ? errorId("departureDate")
                  : undefined
              }
              className={`${inputStyles} cursor-pointer`}
            />
            {state.fieldErrors.departureDate ? (
              <FieldError id={errorId("departureDate")}>
                {state.fieldErrors.departureDate && t(state.fieldErrors.departureDate as TranslationKey)}
              </FieldError>
            ) : null}
          </div>
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor={fieldId("budget")} className="eyebrow text-ink-40">
          {t("form.budget")}
        </label>
        <select
          id={fieldId("budget")}
          name="budget"
          defaultValue=""
          className={`${inputStyles} cursor-pointer`}
        >
          <option value="">{t("form.budgetPlaceholder")}</option>
          <option value="Up to £250,000">Up to £250,000</option>
          <option value="£250,000 – £450,000">£250,000 – £450,000</option>
          <option value="£450,000 – £750,000">£450,000 – £750,000</option>
          <option value="£750,000+">£750,000+</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={fieldId("message")} className="eyebrow text-ink-40">
          {t("tripForm.lookingFor")}
        </label>
        <textarea
          id={fieldId("message")}
          name="message"
          rows={5}
          required
          placeholder={t("tripForm.lookingForPlaceholder")}
          aria-invalid={state.fieldErrors.message ? true : undefined}
          aria-describedby={
            state.fieldErrors.message ? errorId("message") : undefined
          }
          className={`${inputStyles} resize-y`}
        />
        {state.fieldErrors.message ? (
          <FieldError id={errorId("message")}>
            {state.fieldErrors.message && t(state.fieldErrors.message as TranslationKey)}
          </FieldError>
        ) : null}
      </div>

      {state.status === "error" && state.message ? (
        <p
          role="alert"
          className="inline-flex items-start gap-2 text-sm text-red-700"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {t(state.message as TranslationKey, { phone: contact.phoneDisplay })}
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
            {t("form.sending")}
          </>
        ) : (
          <>
            <CalendarCheck className="size-4" aria-hidden="true" />
            {t("tripForm.submit")}
          </>
        )}
      </button>

      <p className="inline-flex items-start gap-2 text-xs leading-relaxed text-ink-40">
        <Send className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        {t("tripForm.note")}
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
