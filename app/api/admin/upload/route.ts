import type { NextRequest } from "next/server";
import { assertAdmin } from "@/lib/admin/auth";
import { safeSlugSegment } from "@/lib/admin/json-store";
import {
  MAX_FILES_PER_REQUEST,
  MAX_UPLOAD_BYTES,
  storeImage,
  type StoredImage,
} from "@/lib/admin/media";

/**
 * GÖRSEL YÜKLEME — multipart/form-data.
 *
 * Beklenen alanlar:
 *   slug  → ilanın slug'ı; dosyaların yazılacağı klasörü belirler
 *   alt   → (opsiyonel) tüm dosyalara uygulanacak taban alt metni
 *   files → bir veya daha fazla dosya
 *
 * Yanıt: `{ images: VillaImage[] }` — form bu diziyi ilanın `images`
 * alanına ekleyip PATCH ile kaydeder. Yükleme ve JSON güncellemesi
 * BİLİNÇLİ olarak iki ayrı adım: yükleme uzun sürebilir, ilan kaydını
 * o süre boyunca kilitli tutmak istemiyoruz.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  /* 1. YETKİ — her şeyden önce. Tek satır kaydırılırsa uç nokta açılır. */
  const denied = await assertAdmin();
  if (denied) return denied;

  /* 2. GÖVDE TİPİ. formData() yanlış content-type'ta fırlatır; önce bakıyoruz
        ki yöneticiye anlamlı bir mesaj dönebilelim. */
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return Response.json(
      { error: "Expected multipart/form-data." },
      { status: 415 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Could not read the upload." }, { status: 400 });
  }

  const slug = safeSlugSegment(String(form.get("slug") ?? ""));
  if (!slug) {
    return Response.json(
      { error: "A valid property slug is required." },
      { status: 422 },
    );
  }

  const baseAlt = String(form.get("alt") ?? "").trim().slice(0, 180);

  /*
    `getAll("files")`: tek istekte çoklu dosya. Dosya olmayan alanları
    (tarayıcılar boş bir file input için boş bir string gönderebilir)
    `instanceof File` ile eliyoruz.
  */
  const files = form
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length === 0) {
    return Response.json({ error: "No files received." }, { status: 422 });
  }

  if (files.length > MAX_FILES_PER_REQUEST) {
    return Response.json(
      { error: `Upload at most ${MAX_FILES_PER_REQUEST} images at a time.` },
      { status: 413 },
    );
  }

  const images: StoredImage[] = [];
  const errors: { name: string; reason: string }[] = [];

  /*
    SIRAYLA işleniyor, Promise.all ile DEĞİL.

    İki sebep: (a) sharp her dosya için ciddi bellek ayırır; 20 tanesini
    aynı anda çözmek küçük bir VPS'te süreci OOM ile düşürebilir.
    (b) dosya adları `nextIndex()` ile sıralı üretiliyor — paralel
    çalıştırıldığında ikisi aynı numarayı okuyup birbirinin üzerine yazar.
  */
  for (const [offset, file] of files.entries()) {
    if (file.size > MAX_UPLOAD_BYTES) {
      errors.push({
        name: file.name,
        reason: `Larger than ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.`,
      });
      continue;
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());

      /*
        `storeImage` dosyayı sharp ile ÇÖZEREK doğrular: gerçek bir görsel
        değilse burada fırlatır. İstemcinin bildirdiği MIME tipine veya
        uzantıya güvenmiyoruz — ikisi de sahte olabilir.
      */
      const stored = await storeImage(
        slug,
        buffer,
        baseAlt ? `${baseAlt} — photo ${offset + 1}` : file.name,
      );

      images.push(stored);
    } catch {
      errors.push({ name: file.name, reason: "Not a readable image file." });
    }
  }

  if (images.length === 0) {
    return Response.json(
      { error: "None of the files could be processed.", errors },
      { status: 422 },
    );
  }

  /*
    KISMİ BAŞARI 207 döner: 10 dosyanın 9'u geçtiyse yöneticiye "hata"
    demek yanlış olur — ama sessizce "tamam" demek de yanlış, çünkü bir
    fotoğrafı eksik kalmış olur. Form her iki listeyi de gösteriyor.
  */
  return Response.json(
    { images, errors },
    { status: errors.length > 0 ? 207 : 201 },
  );
}
