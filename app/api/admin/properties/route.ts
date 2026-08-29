import { readFile } from "node:fs/promises";
import type { NextRequest } from "next/server";
import { assertAdmin } from "@/lib/admin/auth";
import { mutateJsonFile } from "@/lib/admin/json-store";
import { applyInput, parsePropertyInput } from "@/lib/admin/property-input";
import { revalidateProperties } from "@/lib/admin/revalidate";
import { VILLAS_PATH } from "@/lib/villas";
import type { Villa } from "@/lib/types";

/**
 * İLAN KOLEKSİYONU — liste (GET) ve oluşturma (POST).
 * Tek kayıt işlemleri (PATCH/DELETE) `[slug]/route.ts` içinde.
 *
 * Her yazan uç noktanın dört adımı:
 *   1. assertAdmin()          → yetki, veriye en yakın noktada
 *   2. parsePropertyInput()   → gövdeye ASLA güvenme
 *   3. mutateJsonFile()       → sıralı + atomik yazma
 *   4. revalidateProperties() → yayındaki statik sayfaları tazele
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const readVillas = async () =>
  JSON.parse(await readFile(VILLAS_PATH, "utf8")) as Villa[];

export async function GET() {
  const denied = await assertAdmin();
  if (denied) return denied;

  const villas = await readVillas();

  return Response.json(
    { count: villas.length, villas },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  const denied = await assertAdmin();
  if (denied) return denied;

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

  let createdSlug = input.slug;

  await mutateJsonFile<Villa[]>(VILLAS_PATH, readVillas, (villas) => {
    /*
      SLUG ÇAKIŞMASI. Slug bir URL segmenti ve `getVillaBySlug` ilk
      eşleşmeyi döndürüyor — iki kayıt aynı slug'ı taşırsa ikincisi
      ERİŞİLEMEZ olur ve `generateStaticParams` aynı yolu iki kez üretir.
      Sessizce üzerine yazmak yerine sonuna sayı ekliyoruz.
    */
    const taken = new Set(villas.map((villa) => villa.slug));
    let slug = input.slug;
    let suffix = 2;
    while (taken.has(slug)) slug = `${input.slug}-${suffix++}`;
    createdSlug = slug;

    return [applyInput(input, undefined, slug), ...villas];
  });

  // TODO: Trigger DeepL translation queue for empty TR/RU fields here in the future
  /*
    KANCA NOKTASI BURASI — istemcideki gönderim değil.
    Kayıt diske YAZILDIKTAN sonra çalışmalı ki kuyruk gerçekten var olan
    bir slug'a iş açsın. Eksik dilleri `missingLocales(villa.title)` ile
    (lib/localized.ts) tespit edip yalnızca onları çevirmek yeterli;
    dolu bir çeviriyi yeniden çevirmek hem ücretli hem de yöneticinin
    elle yazdığı metni ezmek demek.

    Aynı çağrı PATCH tarafında da gerekecek (bkz. [slug]/route.ts).
  */

  revalidateProperties(createdSlug);

  return Response.json({ slug: createdSlug }, { status: 201 });
}
