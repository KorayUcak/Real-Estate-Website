"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

/**
 * Formun paylaşılan alan bileşenleri.
 *
 * Ayrı dosyada tutulmalarının sebebi tekrar değil TUTARLILIK: hata
 * durumunun görünümü (kırmızı kenarlık + `aria-invalid` + `aria-describedby`
 * bağlantısı) tek yerde tanımlı. Bunu her input'ta elle yazmak, er ya da
 * geç görsel olarak işaretlenmiş ama ekran okuyucuya HİÇBİR ŞEY söylemeyen
 * bir alan üretir — erişilebilirlik hatalarının en sessiz türü.
 */

function fieldClasses(hasError: boolean): string {
  return cn(
    "w-full rounded-sm border bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors",
    "placeholder:text-ink-40/70 focus:border-sea",
    hasError ? "border-gold-deep" : "border-line",
  );
}

export function Label({
  htmlFor,
  children,
  required,
  hint,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <label
        htmlFor={htmlFor}
        className="block font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-70"
      >
        {children}
        {required ? (
          /* Yıldız `aria-hidden`: zorunluluk bilgisi input'un `required`
             özniteliğinden geliyor, ekran okuyucuya iki kez söylemeyelim. */
          <span aria-hidden="true" className="ml-1 text-gold-deep">
            *
          </span>
        ) : null}
      </label>
      {hint ? <span className="text-[0.6875rem] text-ink-40">{hint}</span> : null}
    </div>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <p id={id} className="mt-1.5 text-xs text-gold-deep">
      {message}
    </p>
  );
}

export function TextField({
  label,
  value,
  onChange,
  error,
  required,
  hint,
  type = "text",
  placeholder,
  min,
  suffix,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  hint?: string;
  type?: "text" | "number";
  placeholder?: string;
  min?: number;
  suffix?: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div>
      <Label htmlFor={id} required={required} hint={hint}>
        {label}
      </Label>
      <div className="relative mt-2">
        <input
          id={id}
          type={type}
          value={value}
          min={min}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(fieldClasses(Boolean(error)), suffix && "pr-14")}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-ink-40">
            {suffix}
          </span>
        ) : null}
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  rows = 5,
  hint,
  error,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  hint?: string;
  error?: string;
  placeholder?: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div>
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(fieldClasses(Boolean(error)), "mt-2 resize-y leading-relaxed")}
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  error,
  required,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  error?: string;
  required?: boolean;
  hint?: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div>
      <Label htmlFor={id} required={required} hint={hint}>
        {label}
      </Label>
      {/*
        Burada YERLEŞİK <select> kullanılıyor, sitedeki özel `SelectMenu`
        değil. Panelde tercih farklı: yönetici günde onlarca kayıt giriyor
        ve yerleşik eleman klavye yazarak seçmeyi, mobilde işletim
        sisteminin kendi tekerleğini bedavaya veriyor. Vitrindeki özel
        seçici marka için vardı; burada hız daha değerli.
      */}
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(fieldClasses(Boolean(error)), "mt-2 cursor-pointer")}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldError id={errorId} message={error} />
    </div>
  );
}

export function CheckboxField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = useId();

  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-sm border border-line bg-white p-3.5 transition-colors hover:border-sea"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-[var(--color-sea-deep)]"
      />
      <span>
        <span className="block font-sans text-sm font-medium text-ink">
          {label}
        </span>
        {description ? (
          <span className="mt-0.5 block text-xs text-ink-40">{description}</span>
        ) : null}
      </span>
    </label>
  );
}

/** Form bölümü — başlık + açıklama + alanlar. */
export function Section({
  title,
  description,
  children,
  columns = 2,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
}) {
  return (
    <section className="border border-line bg-shell p-6 sm:p-8">
      <header className="mb-6">
        <h2 className="font-display text-lg text-sea-deep">{title}</h2>
        {description ? (
          <p className="mt-1.5 text-sm leading-relaxed text-ink-40">
            {description}
          </p>
        ) : null}
      </header>

      <div
        className={cn(
          "grid gap-5",
          columns === 2 && "sm:grid-cols-2",
          columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {children}
      </div>
    </section>
  );
}
