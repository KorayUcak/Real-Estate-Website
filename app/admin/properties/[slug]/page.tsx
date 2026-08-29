import { notFound } from "next/navigation";
import { PropertyForm } from "@/components/admin/property-form";
import { requireAdmin } from "@/lib/admin/auth";
import { getAllVillasForAdmin, getKnownFeatures } from "@/lib/villas";

export const dynamic = "force-dynamic";

export default async function EditPropertyPage(
  props: PageProps<"/admin/properties/[slug]">,
) {
  await requireAdmin();

  const { slug } = await props.params;

  /*
    `getAllVillasForAdmin` — `getVillaBySlug` DEĞİL. Fark önemli: panelde
    `off-market` kayıtlar da görünmeli, yoksa yayından kaldırılan bir ilan
    düzenlenemez hâle gelir ve geri yayınlanamaz.
  */
  const villas = await getAllVillasForAdmin();
  const villa = villas.find((item) => item.slug === slug);

  if (!villa) notFound();

  /* Bkz. /admin/properties/new — liste sunucuda toplanıyor. */
  const knownFeatures = await getKnownFeatures();

  return <PropertyForm existing={villa} knownFeatures={knownFeatures} />;
}
