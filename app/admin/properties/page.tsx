import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ImageOff, Star } from "lucide-react";
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

export default async function AdminPropertiesPage() {
  await requireAdmin();

  const villas = await getAllVillasForAdmin();

  /* En son düzenlenen üstte: yönetici genelde az önce dokunduğu kayda döner. */
  const ordered = [...villas].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

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

      <div className="mt-8 overflow-x-auto border border-line bg-shell">
        <table className="w-full min-w-[52rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-shell-deep">
              <th scope="col" className="w-20 px-4 py-3">
                <span className="sr-only">Cover image</span>
              </th>
              {["Title", "Area", "Price", "Beds", "Status", "Updated"].map((head) => (
                <th
                  key={head}
                  scope="col"
                  className="px-4 py-3 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-40"
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ordered.map((villa) => {
              const cover = villa.images[0];
              const area = getServiceArea(villa.location.areaSlug);

              return (
                <tr
                  key={villa.id}
                  className="border-b border-line/70 transition-colors last:border-0 hover:bg-shell-deep/50"
                >
                  <td className="px-4 py-3">
                    <div className="relative size-14 overflow-hidden rounded-sm border border-line bg-shell-deep">
                      {cover ? (
                        <Image
                          src={cover.src}
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
                      href={`/admin/properties/${villa.slug}`}
                      className="inline-flex items-center gap-2 font-display text-sm font-semibold text-sea-deep underline-offset-4 hover:underline"
                    >
                      {villa.title}
                      {villa.featured ? (
                        <Star
                          className="size-3.5 shrink-0 text-gold-deep"
                          aria-label="Featured"
                        />
                      ) : null}
                    </Link>
                    <span className="mt-0.5 block font-mono text-[0.6875rem] text-ink-40">
                      {villa.reference}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-sm text-ink-70">
                    {area?.name ?? villa.location.area ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums text-ink-70">
                    {formatPrice(villa.price.gbp, "GBP", FALLBACK_RATES)}
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums text-ink-70">
                    {villa.bedrooms || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-sm px-2.5 py-1 font-sans text-[0.625rem] font-semibold uppercase tracking-[0.12em] ${STATUS_STYLE[villa.status]}`}
                    >
                      {villa.status.replace("-", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums text-ink-40">
                    {villa.updatedAt || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
