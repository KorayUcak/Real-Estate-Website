"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { cn } from "@/lib/cn";
import { CURRENCY_META } from "@/lib/currency";
import {
  LANGUAGE_META,
  LOCALIZATION_OPTIONS,
  matchLocalization,
  type LocalizationOption,
} from "@/lib/locale";

/**
 * BAŞLIKTAKİ YERELLEŞTİRME SEÇİCİSİ — dil ve para birimi TEK menüde.
 *
 * Eskiden yan yana iki menü vardı. Bir kullanıcının aklında bunlar iki ayrı
 * karar değil, tek bir karardır: "ben kimim". Ayrı tutmak hem başlıkta iki
 * kutu yer kaplıyor hem de kullanıcıya anlamsız kombinasyonlar kurma işini
 * yıkıyordu. Dört hazır çift bu işi bizim yapmamız demek.
 *
 * Neden `select-menu.tsx` yeniden kullanılmadı: o bileşen etiketi değerin
 * ÜSTÜNE koyan iki satırlık bir form kontrolü (hero arama çubuğu ve filtre
 * çubuğu için). Başlıkta yerimiz tek satır yüksekliğinde ve seçici bir form
 * alanı değil, bir tercih anahtarı. Klavye sözleşmesi (ok tuşları, Home/End,
 * Escape, odak dönüşü, dışarı tıklama) oradan birebir taşındı — özel bir
 * açılır menü bunları uygulamıyorsa klavye kullanıcısı için bozuk demektir.
 *
 * `tone` — hangi zeminin üstünde duruyor. Başlık hero fotoğrafının üstünde
 * cam (koyu), sayfa içeriğinin üstünde krem. Renk `currentColor`a
 * bağlanamıyor çünkü açık panel her iki durumda da BEYAZ zeminli.
 */

type Tone = "light" | "dark";

/** Tetikleyicideki kısa hâl: "EN (£)" — kod kimliği, sembol parayı verir. */
function shortLabel(option: LocalizationOption): string {
  return `${option.language} (${CURRENCY_META[option.currency].symbol})`;
}

/** Paneldeki tam hâl: "English (GBP – £)", "Türkçe (TRY – ₺)". */
function fullLabel(option: LocalizationOption): string {
  const { symbol } = CURRENCY_META[option.currency];

  return `${LANGUAGE_META[option.language].label} (${option.currency} – ${symbol})`;
}

export function LocaleSwitcher({
  className,
  tone = "dark",
  /** Çekmecede tam genişlikte duruyor. */
  layout = "inline",
}: {
  className?: string;
  tone?: Tone;
  layout?: "inline" | "stacked";
}) {
  const { language, currency, setLocalization } = useLocale();

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const baseId = useId();
  const reduceMotion = useReducedMotion();

  const isDark = tone === "dark";
  const block = layout === "stacked";
  /* Çekmecede bu blok panelin EN ALTINDA duruyor — aşağı açılan bir liste
     çekmecenin dışına taşardı, o yüzden yukarı açılıyor. */
  const placement = block ? "top" : "bottom";

  const selected = matchLocalization(language, currency);
  const selectedIndex = Math.max(
    LOCALIZATION_OPTIONS.findIndex((option) => option.id === selected.id),
    0,
  );

  /** Panel açılırken işaretli seçenek seçili olandan başlar. */
  const openMenu = () => {
    setActiveIndex(selectedIndex);
    setOpen(true);
  };

  const close = (returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  const commit = (index: number) => {
    const option = LOCALIZATION_OPTIONS[index];
    if (!option) return;
    setLocalization(option.language, option.currency);
    close();
  };

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    const count = LOCALIZATION_OPTIONS.length;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) return openMenu();
        return setActiveIndex((i) => (i + 1) % count);
      case "ArrowUp":
        event.preventDefault();
        if (!open) return openMenu();
        return setActiveIndex((i) => (i - 1 + count) % count);
      case "Home":
        if (!open) return;
        event.preventDefault();
        return setActiveIndex(0);
      case "End":
        if (!open) return;
        event.preventDefault();
        return setActiveIndex(count - 1);
      case "Enter":
      case " ":
        event.preventDefault();
        if (!open) return openMenu();
        return commit(activeIndex);
      case "Escape":
        if (!open) return;
        event.preventDefault();
        return close();
      case "Tab":
        if (open) setOpen(false);
        return;
      default:
        return;
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative", block ? "w-full" : "shrink-0", className)}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? close(false) : openMenu())}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        /* Görünür etiket yok — erişilebilir ad ile seçili değeri birlikte
           okutuyoruz ki ekran okuyucu "Language and currency: English
           (GBP – £)" desin. */
        aria-label={`Language and currency: ${fullLabel(selected)}`}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors",
          block && "w-full justify-between px-3.5 py-3 text-xs",
          isDark
            ? "border-shell/30 text-shell/85 hover:border-gold hover:text-gold"
            : "border-line text-ink-70 hover:border-sea hover:text-sea",
          open && (isDark ? "border-gold text-gold" : "border-sea text-sea"),
        )}
      >
        <span className="inline-flex items-center gap-1.5">
          <Globe className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="whitespace-nowrap">{shortLabel(selected)}</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-3 shrink-0 transition-transform duration-300",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.ul
            role="listbox"
            aria-label="Language and currency"
            tabIndex={-1}
            onKeyDown={onKeyDown}
            initial={
              reduceMotion
                ? false
                : { opacity: 0, y: placement === "top" ? 6 : -6, scale: 0.98 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reduceMotion
                ? undefined
                : { opacity: 0, y: placement === "top" ? 6 : -6, scale: 0.98 }
            }
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            /*
              z-[100]: site başlığı z-50 taşıyor, panel onun da üstünde
              kalmalı. `rounded-sm` açıkça yazılıyor — globals.css taban
              kuralı `rounded` sınıfı taşımayan her elemanın köşesini
              sıfırlıyor, yuvarlatma bu projede opt-in.

              Sağ kümenin sonunda duruyor: panel sağa hizalı açılmalı,
              yoksa viewport'un dışına taşar.
            */
            className={cn(
              "absolute right-0 z-[100] w-max min-w-[13rem] rounded-sm border border-line bg-white p-1.5 shadow-panel",
              placement === "top"
                ? "bottom-[calc(100%+0.4rem)] origin-bottom"
                : "top-[calc(100%+0.4rem)] origin-top",
              block && "w-full",
            )}
          >
            <li
              id={`${baseId}-label`}
              className="px-3 pb-1.5 pt-1 font-sans text-[9px] font-bold uppercase tracking-[0.24em] text-ink-40"
              aria-hidden="true"
            >
              Language &amp; Currency
            </li>

            {LOCALIZATION_OPTIONS.map((option, index) => {
              const isSelected = option.id === selected.id;
              const isActive = index === activeIndex;

              return (
                <li key={option.id}>
                  {/*
                    `onPointerDown` + preventDefault: tetikleyici odağı
                    kaybetmeden seçim yapılır, panel titremeden kapanır.
                  */}
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={() => commit(index)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      "flex w-full items-center justify-between gap-4 rounded-sm px-3 py-2 text-left text-sm transition-colors duration-150",
                      isActive
                        ? "bg-sea-tint text-sea-deep"
                        : "text-ink-70 hover:bg-sea-tint",
                      isSelected && "font-medium text-sea-deep",
                    )}
                  >
                    <span className="whitespace-nowrap">
                      {fullLabel(option)}
                    </span>
                    {isSelected ? (
                      <Check
                        className="size-3.5 shrink-0 text-gold-deep"
                        aria-hidden="true"
                      />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
