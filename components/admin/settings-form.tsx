"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Loader2, Save, TriangleAlert } from "lucide-react";
import { Section, TextArea, TextField } from "@/components/admin/form-fields";
import type { SiteSettings } from "@/lib/settings";

/**
 * GENEL AYARLAR FORMU.
 *
 * İlan formundan farklı olarak burada yönlendirme YOK: yönetici kaydettikten
 * sonra aynı sayfada kalıp sonucu görmeli. Onun yerine kalıcı bir "kaydedildi"
 * bildirimi var — yoksa düğmeye basmak hiçbir şey olmamış gibi görünüyordu.
 */

type Errors = Record<string, string>;

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const router = useRouter();

  const [companyName, setCompanyName] = useState(initial.companyName);
  const [phoneDisplay, setPhoneDisplay] = useState(initial.contact.phoneDisplay);
  const [phoneE164, setPhoneE164] = useState(initial.contact.phoneE164);
  const [whatsapp, setWhatsapp] = useState(initial.contact.whatsappNumber);
  const [email, setEmail] = useState(initial.contact.email);
  const [openingHours, setOpeningHours] = useState(initial.contact.openingHours);

  const [addressFull, setAddressFull] = useState(initial.contact.address.full);
  const [street, setStreet] = useState(initial.contact.address.street);
  const [district, setDistrict] = useState(initial.contact.address.district);
  const [city, setCity] = useState(initial.contact.address.city);
  const [countryName, setCountryName] = useState(
    initial.contact.address.countryName,
  );
  const [country, setCountry] = useState(initial.contact.address.country);

  const [instagram, setInstagram] = useState(initial.social.instagram);
  const [facebook, setFacebook] = useState(initial.social.facebook);
  const [x, setX] = useState(initial.social.x);
  const [linkedin, setLinkedin] = useState(initial.social.linkedin);

  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  /* İlan formuyla aynı kalıp: istemci hataları TÜRETİLMİŞ, durum değil —
     böylece alan düzeltilir düzeltilmez mesaj kayboluyor. */
  const clientErrors: Errors = {};
  if (!companyName.trim()) clientErrors.companyName = "Company name is required.";
  if (!addressFull.trim()) clientErrors["address.full"] = "Office address is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
    clientErrors["contact.email"] = "Enter a valid email address.";
  }
  if (!whatsapp.replace(/\D/g, "")) {
    clientErrors["contact.whatsappNumber"] = "WhatsApp number is required.";
  }

  const errors: Errors = submitted
    ? { ...clientErrors, ...serverErrors }
    : serverErrors;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setServerErrors({});
    setSaved(false);
    setSubmitted(true);

    if (Object.keys(clientErrors).length > 0) {
      const firstInvalid = document.querySelector<HTMLElement>("[aria-invalid='true']");
      firstInvalid?.scrollIntoView({ block: "center", behavior: "smooth" });
      firstInvalid?.focus({ preventScroll: true });
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          companyName,
          contact: {
            phoneDisplay,
            phoneE164,
            whatsappNumber: whatsapp,
            email,
            openingHours,
            address: { full: addressFull, street, district, city, country, countryName },
          },
          social: { instagram, facebook, x, linkedin },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) setServerErrors(result.errors);
        setFormError(result.error ?? "Settings could not be saved.");
        return;
      }

      setSaved(true);
      /* Sunucu bileşenlerini yeniden çalıştır: üst menüdeki ve footer'daki
         değerler bu sayfa yenilenmeden güncellensin. */
      router.refresh();
    } catch {
      setFormError("Network error — settings were not saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate onChange={() => { setServerErrors({}); setSaved(false); }}>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold-deep">
            Global
          </p>
          <h1 className="mt-2 font-display text-3xl text-sea-deep sm:text-4xl">
            Site settings
          </h1>
          {initial.updatedAt ? (
            <p className="mt-1.5 text-xs text-ink-40">
              Last updated {initial.updatedAt}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          {saved ? (
            <p
              role="status"
              className="inline-flex items-center gap-2 text-sm text-sea"
            >
              <Check className="size-4" aria-hidden="true" />
              Saved
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-sea-deep px-6 py-3 font-sans text-xs font-bold uppercase tracking-widest text-shell transition-colors hover:bg-gold hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Saving…
              </>
            ) : (
              <>
                <Save className="size-4" aria-hidden="true" />
                Save settings
              </>
            )}
          </button>
        </div>
      </header>

      {formError ? (
        <p
          role="alert"
          className="mt-6 flex items-start gap-2 rounded-sm border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold-deep"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {formError}
        </p>
      ) : null}

      <div className="mt-8 space-y-6">
        <Section
          title="Company"
          description="The name shown in the footer, on the contact page and in structured data."
          columns={2}
        >
          <div className="sm:col-span-2">
            <TextField
              label="Company name"
              required
              value={companyName}
              onChange={setCompanyName}
              error={errors.companyName}
            />
          </div>
        </Section>

        <Section
          title="Contact"
          description="Used by the header call button, the footer, every WhatsApp CTA and the contact page."
          columns={2}
        >
          <TextField
            label="Phone (display)"
            value={phoneDisplay}
            onChange={setPhoneDisplay}
            hint="As shown on screen"
            placeholder="+90 534 052 00 30"
          />
          <TextField
            label="Phone (dial)"
            value={phoneE164}
            onChange={setPhoneE164}
            hint="E.164, used by tel: links"
            placeholder="+905340520030"
          />
          <TextField
            label="WhatsApp number"
            required
            value={whatsapp}
            onChange={setWhatsapp}
            error={errors["contact.whatsappNumber"]}
            hint="Digits only — wa.me rejects + and spaces"
            placeholder="905340520030"
          />
          <TextField
            label="Primary email"
            required
            value={email}
            onChange={setEmail}
            error={errors["contact.email"]}
            placeholder="info@example.com"
          />
          <div className="sm:col-span-2">
            <TextField
              label="Opening hours"
              value={openingHours}
              onChange={setOpeningHours}
              placeholder="Mon–Sat, 09:00–19:00 (TRT)"
            />
          </div>
        </Section>

        <Section
          title="Office address"
          description="The first field is what visitors see. The parts below feed the structured data Google reads — keep them consistent with it."
          columns={2}
        >
          <div className="sm:col-span-2">
            <TextArea
              label="Address (as displayed)"
              value={addressFull}
              onChange={setAddressFull}
              rows={2}
              error={errors["address.full"]}
            />
          </div>
          <TextField label="Street" value={street} onChange={setStreet} />
          <TextField label="District" value={district} onChange={setDistrict} />
          <TextField label="City / region" value={city} onChange={setCity} />
          <TextField label="Country" value={countryName} onChange={setCountryName} />
          <TextField
            label="Country code"
            value={country}
            onChange={setCountry}
            hint="ISO 3166-1 alpha-2"
            placeholder="TR"
          />
        </Section>

        <Section
          title="Social profiles"
          description="Full URLs including https://. Leave blank to hide the icon and drop it from structured data."
          columns={2}
        >
          <TextField
            label="Instagram"
            value={instagram}
            onChange={setInstagram}
            placeholder="https://www.instagram.com/…"
          />
          <TextField
            label="Facebook"
            value={facebook}
            onChange={setFacebook}
            placeholder="https://www.facebook.com/…"
          />
          <TextField label="X" value={x} onChange={setX} placeholder="https://x.com/…" />
          <TextField
            label="LinkedIn"
            value={linkedin}
            onChange={setLinkedin}
            placeholder="https://www.linkedin.com/company/…"
          />
        </Section>
      </div>
    </form>
  );
}
