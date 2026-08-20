import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  PropertyTable,
  type PropertyRow,
} from "@/components/admin/property-table";
import { requireAdmin } from "@/lib/admin/auth";
import { FALLBACK_RATES, formatPrice } from "@/lib/currency";
import { getServiceArea } from "@/lib/site";
import { getAllVillasForAdmin } from "@/lib/villas";
import type { Villa } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<Villa["status"], string> = {
  "for-sale": "bg-sea-tint text-sea-deep",
  reserved: "bg-gold/20 text-gold-deep",
  sold: "bg-shell-deep text-ink-40",
  "off-market": "bg-shell-deep text-ink-40 line-through",
};

/**
 * SUNUCU BİLEŞENİ OLARAK KALIYOR — yetki ve veri burada.
 *
 * Tablo ve arama kutusu istemciye taşındı (`property-table.tsx`), ama bu
 * dosya değil: `requireAdmin()` bir güvenlik sınırı ve istemciye inen bir
 * bileşende çalıştırılamaz.
 *
 * Satırlar burada DÜZLEŞTİRİLİYOR. Tam `Villa` nesnelerini istemciye
 * yollamak, her ilanın görsel dizisini, açıklama bloklarını ve özellik
 * listesini de yollamak demekti — tabloda hiçbiri görünmüyor. Yalnızca
 * basılan alanlar geçiyor; fiyat biçimlendirmesi ve bölge araması da
 * sunucuda bir kez yapılıyor, her tuş vuruşunda değil.
 */
export default async function AdminPropertiesPage() {
  await requireAdmin();

  const villas = await getAllVillasForAdmin();

  /* En son düzenlenen üstte: yönetici genelde az önce dokunduğu kayda döner. */
  const rows: PropertyRow[] = [...villas]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((villa) => ({
      id: villa.id,
      slug: villa.slug,
      title: villa.title,
      reference: villa.reference,
      areaName:
        getServiceArea(villa.location.areaSlug)?.name ??
        villa.location.area ??
        "—",
      priceLabel: formatPrice(villa.price.gbp, "GBP", FALLBACK_RATES),
      bedrooms: villa.bedrooms ? String(villa.bedrooms) : "—",
      status: villa.status.replace("-", " "),
      statusClass: STATUS_STYLE[villa.status],
      updatedAt: villa.updatedAt,
      cover: villa.images[0]?.src ?? null,
      featured: villa.featured,
    }));

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold-deep">
            {villas.length} listings
          </p>
          <h1 className="mt-2 font-display text-3xl text-sea-deep sm:text-4xl">
            Properties
          </h1>
        </div>

        <Link
          href="/admin/properties/new"
          className="inline-flex items-center gap-2 bg-sea-deep px-5 py-3 font-sans text-xs font-bold uppercase tracking-widest text-shell transition-colors hover:bg-gold hover:text-ink"
        >
          Add property
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </header>

      <PropertyTable rows={rows} />
    </>
  );
}
