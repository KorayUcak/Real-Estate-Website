"use client";

import { useId, useRef, useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { FieldError, Label } from "@/components/admin/form-fields";
import { cn } from "@/lib/cn";

/**
 * SIRALI METİN LİSTESİ ALANI — "Why this one" maddeleri için.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * NEDEN VİRGÜLLE AYRILMIŞ TEK BİR ALAN DEĞİL. Formdaki `features` alanı öyle
 * çalışıyor ("Private pool, Sea view, …") ve orada doğru: rozetler iki-üç
 * kelimelik etiketler. Buradaki maddeler CÜMLE — "Walking distance to the
 * marina and the Tuesday market" gibi. Virgül ayracı, içinde virgül geçen
 * ilk cümlede sessizce ikiye bölünürdü ve yönetici bunu ancak yayınlanmış
 * sayfada görürdü.
 *
 * ⚠️ `useFieldArray` KULLANILMADI ÇÜNKÜ PROJEDE React Hook Form YOK.
 * `property-form.tsx` baştan sona `useState` ile yazılmış (632 satır, on
 * beş alan). Tek bir alan için RHF eklemek, aynı formda iki ayrı durum
 * yönetimi modeli demekti: doğrulama iki yerde, hata gösterimi iki yerde.
 * Bu bileşen aynı işi yapıyor — dizi durumu üstte, burada yalnızca düzenleme.
 * ─────────────────────────────────────────────────────────────────────────
 */

export function StringListField({
  label,
  hint,
  items,
  onChange,
  placeholder,
  addLabel = "Add",
  maxItems = 12,
  maxLength = 200,
  error,
}: {
  label: string;
  hint?: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  addLabel?: string;
  maxItems?: number;
  maxLength?: number;
  error?: string;
}) {
  const id = useId();
  const [draft, setDraft] = useState("");
  /* Ekledikten sonra odak girdide kalsın: yönetici arka arkaya beş madde
     yazarken her seferinde fareye uzanmak zorunda kalmamalı. */
  const draftRef = useRef<HTMLInputElement>(null);

  const full = items.length >= maxItems;
  const trimmed = draft.trim();
  /* Aynı maddeyi iki kez eklemek her zaman hatadır — sayfada iki özdeş
     kart olarak görünür ve React'in anahtarlarını da çakıştırır. */
  const duplicate = items.some(
    (item) => item.toLowerCase() === trimmed.toLowerCase(),
  );
  const canAdd = trimmed !== "" && !full && !duplicate;

  const add = () => {
    if (!canAdd) return;

    onChange([...items, trimmed.slice(0, maxLength)]);
    setDraft("");
    draftRef.current?.focus();
  };

  const remove = (index: number) =>
    onChange(items.filter((_, position) => position !== index));

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;

    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const edit = (index: number, value: string) =>
    onChange(
      items.map((item, position) =>
        position === index ? value.slice(0, maxLength) : item,
      ),
    );

  return (
    <div>
      <Label htmlFor={id} hint={hint ?? `${items.length}/${maxItems}`}>
        {label}
      </Label>

      {/*
        MEVCUT MADDELER — salt okunur etiket değil, DÜZENLENEBİLİR girdi.
        Bir yazım hatasını düzeltmek için maddeyi silip yeniden yazdırmak,
        uzun cümlelerde kabul edilemez bir bedel.
      */}
      {items.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {items.map((item, index) => (
            /*
              ANAHTAR OLARAK İNDEKS — burada DOĞRU olan bu.

              Normalde tehlikeli (liste yeniden sıralanırsa React yanlış
              düğümü korur) ama alternatif daha kötü: metnin kendisi
              anahtar olsaydı, yönetici bir maddeyi düzenlerken her tuş
              vuruşunda anahtar değişir, React girdiyi söküp yeniden
              kurar ve ODAK KAYBOLURDU — her harften sonra.

              Yeniden sıralamada indeks anahtarı yalnızca DOM düğümlerinin
              yeniden kullanılması demek; değerler `value` ile geldiği için
              ekranda görünen içerik yine doğru.
            */
            <li key={index} className="flex items-start gap-2">
              {/* Sıra tutamağı: yalnızca görsel ipucu, işi düğmeler yapıyor. */}
              <span
                aria-hidden="true"
                className="mt-3 hidden text-ink-40 sm:block"
              >
                <GripVertical className="size-4" />
              </span>

              <input
                type="text"
                value={item}
                maxLength={maxLength}
                onChange={(event) => edit(index, event.target.value)}
                aria-label={`${label} item ${index + 1}`}
                className="w-full rounded-sm border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-sea"
              />

              {/*
                YUKARI/AŞAĞI — sürükle-bırak YERİNE.

                Sıra sayfada göründüğü sıra, yani gerçek bir ihtiyaç. Ama
                sürükle-bırak dokunmatikte ve klavyeyle kötü çalışıyor ve
                bir bağımlılık getiriyor. İki düğme aynı işi yapıyor,
                klavyeyle de erişilebilir.
              */}
              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move item ${index + 1} up`}
                  className="rounded-sm px-1.5 py-2 text-xs text-ink-40 transition-colors hover:text-sea-deep disabled:opacity-25 disabled:hover:text-ink-40"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1}
                  aria-label={`Move item ${index + 1} down`}
                  className="rounded-sm px-1.5 py-2 text-xs text-ink-40 transition-colors hover:text-sea-deep disabled:opacity-25 disabled:hover:text-ink-40"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`Remove item ${index + 1}`}
                  className="ml-1 rounded-sm border border-line p-2 text-ink-40 transition-colors hover:border-gold-deep hover:text-gold-deep"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {/* ---------------------------------------------- YENİ MADDE */}
      <div className="mt-2 flex items-start gap-2">
        <input
          id={id}
          ref={draftRef}
          type="text"
          value={draft}
          maxLength={maxLength}
          placeholder={full ? `Limit of ${maxItems} reached` : placeholder}
          disabled={full}
          onChange={(event) => setDraft(event.target.value)}
          /*
            ENTER EKLER — ve `preventDefault` ŞART.

            Bu girdi bir `<form>` içinde. Enter'ın varsayılan davranışı
            formu GÖNDERMEK: madde eklemek isteyen yönetici, yarım dolu bir
            ilanı kaydetmiş olurdu.
          */
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            add();
          }}
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
          onClick={add}
          disabled={!canAdd}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-sm bg-sea-deep px-4 py-2.5 text-sm font-medium text-shell transition-colors hover:bg-sea disabled:cursor-not-allowed disabled:bg-ink-40/40"
        >
          <Plus className="size-4" aria-hidden="true" />
          {addLabel}
        </button>
      </div>

      {/*
        `aria-live`: eklemenin OLMADIĞINI da duyurmak gerekiyor. Görme
        engelli bir yönetici "Add" düğmesine bastığında hiçbir şey olmazsa,
        sebebini (kopya madde / limit) ekranda göremez.
      */}
      <p
        id={`${id}-note`}
        aria-live="polite"
        className="mt-1.5 text-xs text-ink-40"
      >
        {duplicate
          ? "That item is already in the list."
          : full
            ? `Maximum ${maxItems} items.`
            : "Press Enter or click Add. Drag-free reordering with ↑ ↓."}
      </p>

      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}
