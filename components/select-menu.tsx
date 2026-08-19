"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Özel açılır seçici.
 *
 * Neden yerel `<select>` değil: yerel eleman işletim sisteminin kendi
 * listesini açar — hızlı ve erişilebilir, ama tamamen stilsiz. Hero'daki
 * arama çubuğu markanın ilk izlenimi olduğu için burada kontrolü alıyoruz.
 *
 * Bedeli erişilebilirliği ELLE kurmak: listbox deseni, ok tuşlarıyla
 * gezinme, Home/End, Escape, dışarı tıklama ve odağın tetikleyiciye geri
 * dönmesi. Bunların hiçbiri opsiyonel değil — özel bir seçici bunları
 * uygulamıyorsa klavye kullanıcısı için bozuk demektir.
 *
 * `aria-activedescendant` yerine odağı tetikleyicide tutup işaretlenen
 * seçeneği id ile bildiriyoruz: liste açıkken odak sıçraması olmuyor.
 */

export type SelectOption = { value: string; label: string };

/**
 * İki görünüm, TEK davranış.
 *
 * `panel`  — hero arama çubuğunun sütunu: etiket üstte, değer altta, geniş
 *            iç boşluk, kenarlık yok (ayrımı panelin hairline'ı yapıyor).
 * `pill`   — /properties filtre çubuğu: tek satır, kenarlıklı, yuvarlak.
 *            Yanındaki `FilterPopover` tetikleyicileriyle aynı ölçüde
 *            durması gerekiyor, yoksa çubuk hizasız görünüyor.
 *
 * Varyant AYRI BİR BİLEŞEN DEĞİL: listbox klavye sözleşmesi (ok tuşları,
 * Home/End, Escape, odak dönüşü) tek yerde kalsın diye. İkinci bir kopya
 * er ya da geç yalnız birinde düzeltilen bir a11y hatası üretir.
 */
export type SelectTone = "panel" | "pill";

export function SelectMenu({
  label,
  value,
  options,
  onChange,
  className,
  align = "start",
  tone = "panel",
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  className?: string;
  /** Panelin tetikleyiciye göre yatay hizası. */
  align?: "start" | "end";
  tone?: SelectTone;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  /**
   * Panel aşağı sığmıyorsa yukarı açılır. Bu yalnızca estetik değil:
   * aşağı açılan bir panel viewport dışına taştığında kullanıcı listenin
   * yarısını göremiyor ve sayfa kaydırılmadan seçim yapamıyor.
   */
  const [dropUp, setDropUp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const baseId = useId();
  const reduceMotion = useReducedMotion();

  const selectedIndex = Math.max(
    options.findIndex((option) => option.value === value),
    0,
  );
  const selected = options[selectedIndex];

  /** Panel açılırken işaretli seçenek seçili olandan başlar. */
  const openMenu = () => {
    setActiveIndex(selectedIndex);

    /** Açmadan önce ölç: tetikleyicinin altında panel için yer var mı? */
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const estimatedPanel = Math.min(options.length * 42 + 8, 288);
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropUp(spaceBelow < estimatedPanel + 16 && rect.top > spaceBelow);
    }

    setOpen(true);
  };

  const close = (returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  const commit = (index: number) => {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
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

  /** İşaretlenen seçenek her zaman görünür kalsın (uzun listelerde kaydırır). */
  useEffect(() => {
    if (!open) return;
    const node = listRef.current?.children[activeIndex] as
      | HTMLElement
      | undefined;
    node?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) return openMenu();
        return setActiveIndex((i) => (i + 1) % options.length);
      case "ArrowUp":
        event.preventDefault();
        if (!open) return openMenu();
        return setActiveIndex((i) => (i - 1 + options.length) % options.length);
      case "Home":
        if (!open) return;
        event.preventDefault();
        return setActiveIndex(0);
      case "End":
        if (!open) return;
        event.preventDefault();
        return setActiveIndex(options.length - 1);
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

  const isPill = tone === "pill";

  return (
    <div ref={containerRef} className={cn("relative", isPill && "shrink-0", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? close(false) : openMenu())}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${baseId}-label`}
        className={cn(
          "group cursor-pointer text-left transition-colors duration-200",
          isPill
            ? "inline-flex items-center gap-2 rounded-sm border border-line bg-white px-4 py-2.5 text-sm text-sea-deep hover:border-sea-deep"
            : "flex w-full flex-col items-start gap-1.5 px-6 py-5 hover:bg-sea-tint/60 focus-visible:bg-sea-tint/60",
        )}
      >
        <span
          id={`${baseId}-label`}
          className={cn(
            "font-display font-bold uppercase",
            isPill
              ? "text-xs tracking-widest text-ink-40"
              : "text-[9px] tracking-[0.24em] text-sea/70",
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            "flex items-center gap-3",
            isPill ? "gap-2" : "w-full justify-between",
          )}
        >
          <span
            className={cn(
              "truncate",
              isPill
                ? "max-w-[9rem]"
                : "font-display text-sm font-semibold text-sea-deep",
            )}
          >
            {selected?.label}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "shrink-0 text-sea transition-transform duration-300",
              isPill ? "size-3.5" : "size-4",
              open && "rotate-180",
            )}
          />
        </span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.ul
            ref={listRef}
            role="listbox"
            aria-labelledby={`${baseId}-label`}
            tabIndex={-1}
            onKeyDown={onKeyDown}
            initial={
              reduceMotion ? false : { opacity: 0, y: dropUp ? 6 : -6, scale: 0.98 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reduceMotion
                ? undefined
                : { opacity: 0, y: dropUp ? 6 : -6, scale: 0.98 }
            }
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            /*
              z-[100] + absolute: panel sayfadaki her şeyin üzerinde yüzer,
              hiçbir öğeyi itmez ve altındaki CTA butonunu gizlemez.
              Yüksek değer bilinçli — site başlığı z-50 taşıyor, panel
              başlığın da üstünde kalmalı.
            */
            className={cn(
              "absolute z-[100] max-h-72 w-[min(18rem,80vw)] overflow-y-auto border border-line bg-white p-1 shadow-panel",
              /* Yuvarlak tetikleyicinin altında kare panel kopuk duruyor. */
              isPill && "rounded-sm p-1.5",
              dropUp
                ? "bottom-[calc(100%+0.4rem)] origin-bottom"
                : "top-[calc(100%+0.4rem)] origin-top",
              align === "end" ? "right-0" : "left-0",
            )}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isActive = index === activeIndex;

              return (
                <li key={option.value}>
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
                      "flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors duration-150",
                      isPill && "rounded-xl",
                      isActive
                        ? "bg-sea-tint text-sea-deep"
                        : "text-ink-70 hover:bg-sea-tint",
                      isSelected && "font-medium text-sea-deep",
                    )}
                  >
                    {option.label}
                    {isSelected ? (
                      <Check className="size-3.5 shrink-0 text-gold-deep" aria-hidden="true" />
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
