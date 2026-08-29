import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  ImageOff,
  Star,
  TriangleAlert,
} from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { formatPrice, FALLBACK_RATES } from "@/lib/currency";
import { getAllVillasForAdmin } from "@/lib/villas";
import type { Villa } from "@/lib/types";

/**
 * DASHBOARD.
 *
 * `requireAdmin()` burada, layout'ta DEĞİL — gerekçesi lib/admin/auth.ts.
 *
 * `force-dynamic`: panel her açılışta diskteki GÜNCEL JSON'u göstermeli.
 * Statik prerender edilseydi yönetici kendi az önce yaptığı değişikliği
 * göremez, "kaydedilmedi mi?" diye ikinci kez kaydetmeye çalışırdı.
 * Herkese açık sayfalar statik kalmaya devam ediyor; bu yalnızca /admin.
 */
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const villas = await getAllVillasForAdmin();

  const live = villas.filter((v) => v.status === "for-sale");
  const featured = villas.filter((v) => v.featured);
  const offMarket = villas.filter((v) => v.status === "off-market");

  /*
    "Dikkat isteyen" kayıtlar. Bir CMS'in gösterebileceği en faydalı sayı
    toplam değil, EKSİK olandır — 57 ilanın taşımadan geldiğini ve bir
    kısmının alanlarının boş olduğunu biliyoruz.
  */
  const missingImages = villas.filter((v) => v.images.length === 0);
  /*
    ⚠️ `.en` ÜZERİNDEN. `seo.title` artık bir NESNE ({en,tr,ru}); nesnenin
    kendisi her zaman truthy olduğu için eski kontrol hiçbir kaydı "eksik"
    saymaz, yani rozet sessizce hep sıfır gösterirdi. Eksiklik ölçütü
    kaynak dilin dolu olması: çeviriler zaten İngilizceye düşüyor.
  */
  const missingSeo = villas.filter((v) => !v.seo?.title?.en || !v.seo?.description?.en);
  const placeholderPins = villas.filter((v) => v.location.isPlaceholder);

  const totalValue = live.reduce((sum, v) => sum + v.price.gbp, 0);

  /* Panelde kur çevirisi yapmıyoruz: yönetici KAYNAK para birimini görmeli. */
  const asGbp = (amount: number) => formatPrice(amount, "GBP", FALLBACK_RATES);

  const recent = [...villas]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 8);

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold-deep">
            Overview
          </p>
          <h1 className="mt-2 font-display text-3xl text-sea-deep sm:text-4xl">
            Dashboard
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

      {/* ------------------------------------------------------- METRİKLER */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={Building2}
          label="Total properties"
          value={String(villas.length)}
          note={`${offMarket.length} off-market`}
        />
        <Stat
          icon={BadgeCheck}
          label="Active listings"
          value={String(live.length)}
          note="Status: for sale"
        />
        <Stat
          icon={Star}
          label="Featured"
          value={String(featured.length)}
          note="Shown on the homepage"
        />
        <Stat
          icon={ArrowRight}
          label="Portfolio value"
          value={asGbp(totalValue)}
          note="Active listings, source GBP"
        />
      </div>

      {/* ------------------------------------------------- EKSİK VERİ UYARI */}
      {missingImages.length + missingSeo.length + placeholderPins.length > 0 ? (
        <section
          aria-labelledby="attention-heading"
          className="mt-10 border border-line bg-shell p-6 sm:p-8"
        >
          <h2
            id="attention-heading"
            className="flex items-center gap-2 font-display text-lg text-sea-deep"
          >
            <TriangleAlert className="size-4 text-gold-deep" aria-hidden="true" />
            Needs attention
          </h2>

          <ul className="mt-5 grid gap-3 sm:grid-cols-3">
            <Issue
              count={missingImages.length}
              label="listings with no images"
              icon={ImageOff}
            />
            <Issue count={missingSeo.length} label="missing SEO title or description" />
            {/*
              Bu sayı gerçek bir veri kalitesi sorununu izliyor: WordPress
              taşımasında 21 ilan Houzez'in varsayılan pin'iyle geldi ve o
              koordinat MIAMI'yi gösteriyor (bkz. lib/villas.ts).
            */}
            <Issue count={placeholderPins.length} label="placeholder map pins" />
          </ul>
        </section>
      ) : null}

      {/* --------------------------------------------------- SON DÜZENLENEN */}
      <section aria-labelledby="recent-heading" className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <h2 id="recent-heading" className="font-display text-xl text-sea-deep">
            Recently updated
          </h2>
          <Link
            href="/admin/properties"
            className="font-sans text-xs uppercase tracking-[0.14em] text-sea underline-offset-4 hover:underline"
          >
            All properties
          </Link>
        </div>

        <div className="mt-5 overflow-x-auto border border-line bg-shell">
          <table className="w-full min-w-[46rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-shell-deep">
                <Th>Title</Th>
                <Th>Area</Th>
                <Th>Price</Th>
                <Th>Status</Th>
                <Th>Updated</Th>
              </tr>
            </thead>
            <tbody>
              {recent.map((villa) => (
                <tr key={villa.id} className="border-b border-line/70 last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/properties/${villa.slug}`}
                      className="font-display text-sm font-semibold text-sea-deep underline-offset-4 hover:underline"
                    >
                      {/* Panelde kaynak (İngilizce) başlık — bkz. admin/properties/page.tsx */}
                      {villa.title.en}
                    </Link>
                    <span className="mt-0.5 block font-mono text-[0.6875rem] text-ink-40">
                      {villa.reference}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-70">
                    {villa.location.area || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums text-ink-70">
                    {asGbp(villa.price.gbp)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusChip status={villa.status} />
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums text-ink-40">
                    {villa.updatedAt || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

/* ------------------------------------------------------------- PARÇALAR */

function Stat({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="border border-line bg-shell p-5 sm:p-6">
      <div className="flex items-center gap-2 text-ink-40">
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        <p className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.16em]">
          {label}
        </p>
      </div>
      {/* `tabular-nums`: sayılar sütun hâlinde hizalı kalsın. */}
      <p className="mt-3 font-display text-3xl tabular-nums text-sea-deep">
        {value}
      </p>
      <p className="mt-1 text-xs text-ink-40">{note}</p>
    </div>
  );
}

function Issue({
  count,
  label,
  icon: Icon,
}: {
  count: number;
  label: string;
  icon?: typeof Building2;
}) {
  return (
    <li className="flex items-baseline gap-2 text-sm text-ink-70">
      {Icon ? (
        <Icon className="size-3.5 shrink-0 self-center text-ink-40" aria-hidden="true" />
      ) : null}
      <span
        className={cnCount(count)}
      >
        {count}
      </span>
      <span>{label}</span>
    </li>
  );
}

/** Sıfır bir uyarı değil, bir başarı — o yüzden vurgulanmıyor. */
function cnCount(count: number): string {
  return count > 0
    ? "font-display text-lg font-semibold tabular-nums text-gold-deep"
    : "font-display text-lg font-semibold tabular-nums text-ink-40";
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      scope="col"
      className="px-4 py-3 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-40"
    >
      {children}
    </th>
  );
}

const STATUS_STYLE: Record<Villa["status"], string> = {
  "for-sale": "bg-sea-tint text-sea-deep",
  reserved: "bg-gold/20 text-gold-deep",
  sold: "bg-shell-deep text-ink-40",
  "off-market": "bg-shell-deep text-ink-40 line-through",
};

function StatusChip({ status }: { status: Villa["status"] }) {
  return (
    <span
      className={`inline-block rounded-sm px-2.5 py-1 font-sans text-[0.625rem] font-semibold uppercase tracking-[0.12em] ${STATUS_STYLE[status]}`}
    >
      {status.replace("-", " ")}
    </span>
  );
}
