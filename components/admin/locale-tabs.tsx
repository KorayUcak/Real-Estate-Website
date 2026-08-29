"use client";

import { cn } from "@/lib/cn";

/**
 * DİL SEKMELERİ — ilan metinlerinin üç dilli girişi.
 *
 * Başlık, açıklama ve "why this one" artık tek bir metin değil, üç dilli
 * bir kayıt (bkz. lib/localized.ts). Üç ayrı alanı ALT ALTA dizmek formu
 * üç katına çıkarırdı ve yönetici çoğu zaman yalnızca İngilizceyi
 * dolduruyor; sekme, kullanılmayan iki dili görünürlükten çıkarıyor ama
 * bir tık uzakta tutuyor.
 *
 * ⚠️ `role="group"` + `aria-pressed`, `role="tablist"` DEĞİL.
 * Sekme deseni ARIA'da ok tuşlarıyla gezinmeyi ve `tabpanel` eşleşmesini
 * şart koşar; burada üç bağımsız aç/kapa düğmesi daha dürüst bir model ve
 * Tab ile sırayla geziliyor. Aynı gerekçe property-explorer'daki
 * ızgara/liste anahtarında da yazılı — proje bu tercihi bir kez yaptı.
 */

export type AdminLocale = "en" | "tr" | "ru";

export const ADMIN_LOCALES: readonly AdminLocale[] = ["en", "tr", "ru"];

/** Sekmede görünen etiket. */
const LABEL: Record<AdminLocale, string> = { en: "EN", tr: "TR", ru: "RU" };

export function LocaleTabs({
  active,
  onChange,
  filled,
  idPrefix,
}: {
  active: AdminLocale;
  onChange: (locale: AdminLocale) => void;
  /**
   * Hangi dilde içerik VAR. Boş olanlara sarı bir nokta konuyor:
   * yönetici hangi çevirinin eksik olduğunu sekmeye girmeden görüyor —
   * ileride DeepL kuyruğunun dolduracağı alanlar da tam olarak bunlar.
   */
  filled: Record<AdminLocale, boolean>;
  /** Erişilebilir ad için — "Title", "Description" gibi. */
  idPrefix: string;
}) {
  return (
    <div
      role="group"
      aria-label={`${idPrefix} language`}
      className="inline-flex items-center gap-0.5 border border-line bg-shell-deep p-0.5"
    >
      {ADMIN_LOCALES.map((locale) => {
        const selected = locale === active;

        return (
          <button
            key={locale}
            type="button"
            onClick={() => onChange(locale)}
            aria-pressed={selected}
            /* İngilizce ZORUNLU alan; diğer ikisi opsiyonel. Etiketin
               kendisi bunu söylemiyor, `title` söylüyor. */
            title={
              locale === "en"
                ? "English — required, used as the fallback"
                : `${LABEL[locale]} — optional, falls back to English when empty`
            }
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors",
              selected
                ? "bg-sea-deep text-shell"
                : "text-ink-40 hover:text-sea-deep",
            )}
          >
            {LABEL[locale]}
            {/*
              Nokta yalnızca İNGİLİZCE DIŞINDA ve yalnızca boşken.
              İngilizce zaten zorunlu, orada "eksik" göstergesi hata
              mesajının işi — iki farklı uyarı aynı şeyi söylerdi.
            */}
            {locale !== "en" && !filled[locale] ? (
              <span
                aria-hidden="true"
                className="size-1.5 shrink-0 bg-gold"
                title="No translation yet"
              />
            ) : null}
            {locale !== "en" && !filled[locale] ? (
              <span className="sr-only">(no translation yet)</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
