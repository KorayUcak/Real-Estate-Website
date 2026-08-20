"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImageOff, Search, Star, X } from "lucide-react";

/**
 * PANELDEKİ İLAN TABLOSU — arama kutusuyla birlikte.
 *
 * Sayfanın kendisi (app/admin/properties/page.tsx) SUNUCU bileşeni olarak
 * kalıyor: yetki kontrolü ve veri okuma orada. İstemciye yalnızca tablo
 * iniyor, çünkü anlık filtreleme için tuş başına bir sunucu turu atmak
 * gereksiz — yönetici portföyü birkaç yüz kayıt, tamamı zaten sayfada.
 *
 * Satırlar HAZIR biçimlenmiş geliyor (fiyat dizesi, bölge adı): para birimi
 * biçimlendirmesi ve `getServiceArea` araması sunucuda bir kez yapılıyor,
 * her tuşta yeniden değil.
 */

export type PropertyRow = {
  id: string;
  slug: string;
  title: string;
  reference: string;
  areaName: string;
  priceLabel: string;
  bedrooms: string;
  status: string;
  statusClass: string;
  updatedAt: string;
  cover: string | null;
  featured: boolean;
};

/**
 * ARAMA İÇİN KATLAMA — aksanları ve Türkçe harfleri düzler.
 *
 * ⚠️ NEDEN `toLowerCase()` YETMİYOR: bölge adlarının çoğu Türkçe —
 * "Ovacık", "Çalış", "Üzümlü", "Hisarönü". Yöneticinin İngilizce klavyeden
 * "ovacik" yazması normal ve bunun eşleşmemesi arama kutusunu işe yaramaz
 * hâle getirir.
 *
 * NFD + birleşen işaretleri silmek ç/ş/ü/ö/ğ'yi çözüyor ama `ı` (U+0131)
 * için YETMİYOR: o noktasız i, aksanlı bir i değil, kendi başına bir harf.
 * Aynı şekilde `İ` (U+0130) küçültüldüğünde arkasında birleşen bir nokta
 * bırakıyor. Bu ikisi bu yüzden elle eşleniyor.
 */
function fold(value: string): string {
  return value
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function PropertyTable({ rows }: { rows: PropertyRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = fold(query.trim());
    if (!needle) return rows;

    /*
      Başlık + bölge — brief'in istediği iki alan. `reference` de dâhil:
      ilan kodu tabloda zaten başlığın altında görünüyor ve yönetici bir
      kaydı en sık onunla arıyor. Aramanın gördüğü alanların ekranda
      görünen alanlarla aynı olması, "neden bulamıyorum" sorusunu ortadan
      kaldırıyor.
    */
    return rows.filter((row) =>
      [row.title, row.areaName, row.reference].some((field) =>
        fold(field).includes(needle),
      ),
    );
  }, [rows, query]);

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          {/*
            Görünür etiket yok ama `sr-only` bir <label> VAR: yer tutucu
            metin erişilebilir ad yerine geçmez — kullanıcı yazmaya
            başladığında kaybolur ve ekran okuyucu alanın ne olduğunu
            söyleyemez hâle gelir.
          */}
          <label htmlFor="property-search" className="sr-only">
            Search properties by title, area or reference
          </label>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-40"
            aria-hidden="true"
          />
          <input
            id="property-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, area or reference…"
            className="w-full rounded-sm border border-line bg-shell py-3 pl-10 pr-10 text-sm text-ink outline-none transition-colors placeholder:text-ink-40 focus:border-sea"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-sm text-ink-40 transition-colors hover:bg-shell-deep hover:text-ink"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        {/*
          Sonuç sayacı `aria-live`: filtreleme yazarken oluyor ve odak
          input'ta kalıyor, yani ekran okuyucu kullanıcısı kaç kayıt
          kaldığını başka türlü öğrenemez.
        */}
        <p aria-live="polite" className="text-sm text-ink-40">
          {query
            ? `${filtered.length} of ${rows.length} shown`
            : `${rows.length} total`}
        </p>
      </div>

      <div className="mt-4 overflow-x-auto border border-line bg-shell">
        <table className="w-full min-w-[52rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-shell-deep">
              <th scope="col" className="w-20 px-4 py-3">
                <span className="sr-only">Cover image</span>
              </th>
              {["Title", "Area", "Price", "Beds", "Status", "Updated"].map(
                (head) => (
                  <th
                    key={head}
                    scope="col"
                    className="px-4 py-3 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-40"
                  >
                    {head}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-16 text-center text-sm text-ink-40"
                >
                  No properties match “{query}”.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-line/70 transition-colors last:border-0 hover:bg-shell-deep/50"
                >
                  <td className="px-4 py-3">
                    <div className="relative size-14 overflow-hidden rounded-sm border border-line bg-shell-deep">
                      {row.cover ? (
                        <Image
                          src={row.cover}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        /* Görselsiz ilan sessizce geçmemeli — panelin
                           "needs attention" sayacıyla aynı sorunu işaret ediyor. */
                        <span className="flex size-full items-center justify-center text-ink-40">
                          <ImageOff className="size-4" aria-hidden="true" />
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/properties/${row.slug}`}
                      className="inline-flex items-center gap-2 font-display text-sm font-semibold text-sea-deep underline-offset-4 hover:underline"
                    >
                      {row.title}
                      {row.featured ? (
                        <Star
                          className="size-3.5 shrink-0 text-gold-deep"
                          aria-label="Featured"
                        />
                      ) : null}
                    </Link>
                    <span className="mt-0.5 block font-mono text-[0.6875rem] text-ink-40">
                      {row.reference}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-sm text-ink-70">
                    {row.areaName}
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums text-ink-70">
                    {row.priceLabel}
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums text-ink-70">
                    {row.bedrooms}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-sm px-2.5 py-1 font-sans text-[0.625rem] font-semibold uppercase tracking-[0.12em] ${row.statusClass}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums text-ink-40">
                    {row.updatedAt || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
