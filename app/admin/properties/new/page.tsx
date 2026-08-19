import { PropertyForm } from "@/components/admin/property-form";
import { requireAdmin } from "@/lib/admin/auth";

/** Yetki kontrolü sayfada — layout bir güvenlik sınırı değil (bkz. lib/admin/auth.ts). */
export const dynamic = "force-dynamic";

export default async function NewPropertyPage() {
  await requireAdmin();

  return <PropertyForm />;
}
