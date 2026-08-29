import { PropertyForm } from "@/components/admin/property-form";
import { requireAdmin } from "@/lib/admin/auth";
import { getKnownFeatures } from "@/lib/villas";

/** Yetki kontrolü sayfada — layout bir güvenlik sınırı değil (bkz. lib/admin/auth.ts). */
export const dynamic = "force-dynamic";

export default async function NewPropertyPage() {
  await requireAdmin();

  /*
    Özellik listesi SUNUCUDA toplanıyor ve prop olarak iniyor.

    Form bir istemci bileşeni; `villas.json`u kendi başına okuyamaz (dosya
    sistemi) ve okuyabilseydi de 57 ilanın tamamını tarayıcıya indirmek
    gerekirdi. Sunucuda tek bir geçiş, istemciye ~23 dizelik bir dizi.
  */
  const knownFeatures = await getKnownFeatures();

  return <PropertyForm knownFeatures={knownFeatures} />;
}
