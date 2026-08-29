"use client";

import { useId, useMemo, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { FieldError, Label } from "@/components/admin/form-fields";
import { cn } from "@/lib/cn";

/**
 * ÖZELLİK SEÇİCİ — açılır liste + serbest giriş + kaldırılabilir rozetler.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * NEYİN YERİNE GEÇTİ. Önceden tek bir `TextArea` vardı ve içeriği virgülle
 * ayrılmış bir dizeydi: "Private pool, Sea view, Underfloor heating".
 * Üç sorunu vardı ve üçü de veriye yazılıyordu:
 *
 *   1. HER SEFERİNDE YENİDEN YAZMAK. Portföydeki 242 özellik kullanımı
 *      yalnızca 23 farklı değerden oluşuyor — yani yazılanın neredeyse
 *      tamamı zaten var olan bir değerin tekrarı.
 *   2. VARYANT ÜRETİMİ. Elle yazılan "Sea View" ile "Sea view" veride iki
 *      ayrı değer. Kart rozetleri ve arama metni ikisini de ayrı sayardı.
 *   3. GÖRÜNMEZ DURUM. Virgülle ayrılmış uzun bir satırda hangi özelliğin
 *      seçili olduğunu okumak, tek tek saymak demekti.
 *
 * Açılır liste 1 ve 2'yi, rozetler 3'ü çözüyor. Serbest giriş duruyor
 * çünkü liste VERİDEN türüyor: yeni bir özellik ilk kez elle yazılmak
 * zorunda, ondan sonra listede.
 * ─────────────────────────────────────────────────────────────────────────
 */

/** Karşılaştırma anahtarı — "Sea View" ile "sea view" aynı özellik. */
function key(value: string): string {
  return value.trim().toLowerCase();
}

export function FeaturePicker({
  label,
  hint,
  selected,
  known,
  onChange,
  placeholder,
  maxItems = 40,
  maxLength = 80,
  error,
}: {
  label: string;
  hint?: string;
  /** Seçili özellikler — kaydedilen dizi. */
  selected: string[];
  /** Portföyde geçen tüm özellikler (bkz. lib/villas.ts `getKnownFeatures`). */
  known: string[];
  onChange: (features: string[]) => void;
  placeholder?: string;
  maxItems?: number;
  maxLength?: number;
  error?: string;
}) {
  const id = useId();
  const [draft, setDraft] = useState("");
  const draftRef = useRef<HTMLInputElement>(null);

  const full = selected.length >= maxItems;

  /*
    Açılır listede YALNIZCA henüz seçilmemiş olanlar.

    Seçili bir maddeyi listede bırakmak, tıklandığında hiçbir şey olmayan
    bir seçenek demekti — yönetici bunu bir hata sanır. Filtrelemek, listeyi
    de kısaltıyor: on özellik seçildiğinde açılır liste on satır daha kısa.
  */
  const available = useMemo(() => {
    const taken = new Set(selected.map(key));
    return known.filter((feature) => !taken.has(key(feature)));
  }, [known, selected]);

  const trimmed = draft.trim();
  const duplicate = selected.some((feature) => key(feature) === key(trimmed));
  const canAdd = trimmed !== "" && !full && !duplicate;

  const add = (value: string) => {
    const clean = value.trim().slice(0, maxLength);
    if (!clean || full) return;
    if (selected.some((feature) => key(feature) === key(clean))) return;

    onChange([...selected, clean]);
  };

  const addDraft = () => {
    if (!canAdd) return;

    add(trimmed);
    setDraft("");
    draftRef.current?.focus();
  };

  const remove = (value: string) =>
    onChange(selected.filter((feature) => feature !== value));

  return (
    <div>
      <Label htmlFor={id} hint={hint ?? `${selected.length}/${maxItems}`}>
        {label}
      </Label>

      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        {/*
          AÇILIR LİSTE — seçim ANINDA ekliyor, ayrı bir "Add" adımı yok.

          `value` daima "" ve `onChange` sonrası da öyle kalıyor: bu bir
          "seçili değer" tutan alan değil, bir KOMUT listesi. Seçilen
          değeri elemanda bırakmak, rozetlerle çelişen ikinci bir durum
          göstergesi yaratırdı — "Sea view" hem rozetlerde hem açılır
          listenin kapağında görünürdü.
        */}
        <select
          id={id}
          value=""
          disabled={full || available.length === 0}
          onChange={(event) => {
            add(event.target.value);
            /* Kapak yeniden "Add from list…"e dönsün. */
            event.currentTarget.value = "";
          }}
          className={cn(
            "w-full cursor-pointer rounded-sm border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors",
            "focus:border-sea disabled:cursor-not-allowed disabled:bg-shell-deep disabled:text-ink-40",
          )}
        >
          <option value="">
            {available.length === 0
              ? "All known features added"
              : `Add from list… (${available.length})`}
          </option>
          {available.map((feature) => (
            <option key={feature} value={feature}>
              {feature}
            </option>
          ))}
        </select>

        {/* SERBEST GİRİŞ — listede olmayan yeni bir özellik için. */}
        <div className="flex items-start gap-2">
          <input
            ref={draftRef}
            type="text"
            value={draft}
            maxLength={maxLength}
            disabled={full}
            placeholder={full ? `Limit of ${maxItems} reached` : placeholder}
            onChange={(event) => setDraft(event.target.value)}
            /* Enter eklesin — ama formu GÖNDERMESİN. */
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              addDraft();
            }}
            aria-label={`Add a new ${label.toLowerCase()} not in the list`}
            aria-invalid={duplicate ? true : undefined}
            aria-describedby={`${id}-note`}
            className={cn(
              "w-full rounded-sm border bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors",
              "placeholder:text-ink-40/70 focus:border-sea disabled:bg-shell-deep disabled:text-ink-40",
              duplicate ? "border-gold-deep" : "border-line",
            )}
          />
          <button
            type="button"
            onClick={addDraft}
            disabled={!canAdd}
            aria-label="Add feature"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-sm bg-sea-deep px-4 py-2.5 text-sm font-medium text-shell transition-colors hover:bg-sea disabled:cursor-not-allowed disabled:bg-ink-40/40"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add
          </button>
        </div>
      </div>

      {/*
        SEÇİLENLER — rozet olarak.

        ⚠️ `<ul>`, sarılmış `<div>` yığını değil: bu bir liste ve ekran
        okuyucu "list, 7 items" diye duyurmalı. Rozetlerin görsel olarak
        satır içinde akması `flex-wrap` ile hallediliyor, semantiği
        bozmadan.
      */}
      {selected.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {selected.map((feature) => (
            <li key={feature}>
              {/*
                ROZETİN TAMAMI DEĞİL, İÇİNDEKİ DÜĞME tıklanabilir. Rozeti
                komple düğme yapmak, metni seçip kopyalamayı imkânsız
                kılardı — uzun bir özellik adını başka bir ilana taşımanın
                en hızlı yolu bu.
              */}
              <span className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-shell-deep py-1.5 pl-3 pr-1.5 text-sm text-ink">
                {feature}
                <button
                  type="button"
                  onClick={() => remove(feature)}
                  aria-label={`Remove ${feature}`}
                  className="rounded-sm p-0.5 text-ink-40 transition-colors hover:bg-gold-deep/10 hover:text-gold-deep"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-ink-40">
          No features selected yet — the badges on the listing card come from
          this list.
        </p>
      )}

      {/* Eklemenin neden gerçekleşmediğini de duyur — bkz. string-list-field. */}
      <p
        id={`${id}-note`}
        aria-live="polite"
        className="mt-2 text-xs text-ink-40"
      >
        {duplicate
          ? "That feature is already selected."
          : full
            ? `Maximum ${maxItems} features.`
            : "Pick from the list, or type a new one and press Enter."}
      </p>

      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}
