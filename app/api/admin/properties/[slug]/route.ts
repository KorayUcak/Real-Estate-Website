import { readFile } from "node:fs/promises";
import type { NextRequest } from "next/server";
import { assertAdmin } from "@/lib/admin/auth";
import { mutateJsonFile } from "@/lib/admin/json-store";
import { removeImageDirectory } from "@/lib/admin/media";
import { applyInput, parsePropertyInput } from "@/lib/admin/property-input";
import { revalidateProperties } from "@/lib/admin/revalidate";
import { VILLAS_PATH } from "@/lib/villas";
import type { Villa } from "@/lib/types";

/**
 * TEK İLAN — güncelle (PATCH) ve sil (DELETE).
 *
 * URL'deki `slug` KAYDI BULMAK için kullanılır; gövdedeki `slug` ise
 * yöneticinin YENİ değeri olabilir (ilan adresini değiştirmek meşru bir
 * işlem). İkisini karıştırmamak önemli.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const readVillas = async () =>
  JSON.parse(await readFile(VILLAS_PATH, "utf8")) as Villa[];

export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/admin/properties/[slug]">,
) {
  const denied = await assertAdmin();
  if (denied) return denied;

  const { slug: currentSlug } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { input, errors } = parsePropertyInput(body);
  if (Object.keys(errors).length > 0) {
    return Response.json({ errors }, { status: 422 });
  }

  let savedSlug = input.slug;
  let found = true;

  await mutateJsonFile<Villa[]>(VILLAS_PATH, readVillas, (villas) => {
    const index = villas.findIndex((villa) => villa.slug === currentSlug);

    if (index === -1) {
      found = false;
      /* Kaydı bulamadıysak dosyayı OLDUĞU GİBİ geri yaz — hiçbir şey değişmesin. */
      return villas;
    }

    /*
      Slug değiştiyse yine benzersiz olmalı; kendi kaydını çakışma
      saymamak için mevcut indeks listeden hariç tutuluyor.
    */
    const taken = new Set(
      villas.filter((_, i) => i !== index).map((villa) => villa.slug),
    );
    let slug = input.slug;
    let suffix = 2;
    while (taken.has(slug)) slug = `${input.slug}-${suffix++}`;
    savedSlug = slug;

    const next = [...villas];
    next[index] = applyInput(input, villas[index], slug);
    return next;
  });

  if (!found) {
    return Response.json({ error: "Property not found." }, { status: 404 });
  }

  /*
    ESKİ ve YENİ slug'ın İKİSİ birden: yönetici adresi değiştirdiyse eski
    yol da düşürülmeli, yoksa aynı ilan iki adreste birden yayında kalır.
  */
  revalidateProperties(currentSlug, savedSlug);

  return Response.json({ slug: savedSlug });
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext<"/api/admin/properties/[slug]">,
) {
  const denied = await assertAdmin();
  if (denied) return denied;

  const { slug } = await context.params;

  let found = true;

  await mutateJsonFile<Villa[]>(VILLAS_PATH, readVillas, (villas) => {
    const next = villas.filter((villa) => villa.slug !== slug);
    found = next.length !== villas.length;
    return found ? next : villas;
  });

  if (!found) {
    return Response.json({ error: "Property not found." }, { status: 404 });
  }

  /*
    Görseller JSON kaydı gittikten SONRA siliniyor. Sıra önemli: önce
    dosyaları silip sonra JSON yazımı patlarsa, kayıt sitede kalır ama
    fotoğrafları yoktur — kırık bir ilan. Bu sırada ise en kötü ihtimalle
    sahipsiz bir klasör kalır; çirkin, ama hiçbir şeyi bozmaz.

    Silme hatası isteği düşürmez: kayıt zaten gitti, yöneticiye başarısız
    demek yanlış olurdu.
  */
  try {
    await removeImageDirectory(slug);
  } catch (error) {
    console.error(`[admin] ${slug} görselleri silinemedi:`, error);
  }

  revalidateProperties(slug);

  return Response.json({ deleted: slug });
}
