"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Star, Trash2, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import type { VillaImage } from "@/lib/types";

/**
 * MEDYA YÖNETİCİSİ.
 *
 * Yükleme ile kaydetme AYRI adımlar: dosyalar `/api/admin/upload`a gider ve
 * dönen `VillaImage[]` üst formun durumuna eklenir; JSON'a yazılması ise
 * "Save" düğmesine basıldığında olur. Bu ayrım bilinçli —
 *   - yükleme uzun sürer, ilan kaydını o süre boyunca kilitlemek istemiyoruz;
 *   - yönetici yüklediği fotoğrafı beğenmezse kaydetmeden geri alabilir.
 *
 * Bedeli: kaydetmeden çıkılırsa diskte sahipsiz dosya kalır. Bunu kabul
 * ediyoruz — alternatifi, hiç kaydedilmemiş bir ilan için geçici klasör
 * yönetmek olurdu ve bu, kazandığından fazlasını karmaşıklaştırırdı.
 */

type UploadError = { name: string; reason: string };

export function ImageManager({
  slug,
  altBase,
  images,
  onChange,
}: {
  /** Dosyaların yazılacağı klasörü belirler. */
  slug: string;
  /** Yüklenen fotoğraflara verilecek taban alt metni — genelde ilan başlığı. */
  altBase: string;
  images: VillaImage[];
  onChange: (images: VillaImage[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<UploadError[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const canUpload = slug.trim().length > 0;

  const upload = async (files: FileList) => {
    if (files.length === 0) return;

    setBusy(true);
    setErrors([]);
    setNotice(null);

    const body = new FormData();
    body.append("slug", slug);
    body.append("alt", altBase);
    for (const file of Array.from(files)) body.append("files", file);

    try {
      const response = await fetch("/api/admin/upload", { method: "POST", body });
      const payload = await response.json();

      if (!response.ok && response.status !== 207) {
        setErrors(
          payload.errors ?? [
            { name: "Upload", reason: payload.error ?? "Upload failed." },
          ],
        );
        return;
      }

      const uploaded: VillaImage[] = payload.images ?? [];
      onChange([...images, ...uploaded]);

      /* Kısmi başarı (207): geçenleri ekle, geçmeyenleri ayrıca göster. */
      if (payload.errors?.length) setErrors(payload.errors);

      setNotice(
        `${uploaded.length} image${uploaded.length === 1 ? "" : "s"} uploaded. Remember to save the listing.`,
      );
    } catch {
      setErrors([{ name: "Upload", reason: "Network error — nothing was saved." }]);
    } finally {
      setBusy(false);
      /* Aynı dosyayı arka arkaya seçebilmek için input sıfırlanmalı:
         `change` olayı aynı değer tekrar seçildiğinde tetiklenmez. */
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = (index: number) => {
    /*
      Yalnızca JSON kaydından çıkarılıyor; dosya diskte kalıyor.
      Fotoğrafı gerçekten silmek geri alınamaz bir işlem ve yönetici
      kaydetmeden vazgeçebilir — o durumda dosyayı silmiş olmak veri
      kaybı olurdu. Klasör, ilan silindiğinde toptan temizleniyor.
    */
    onChange(images.filter((_, i) => i !== index));
  };

  /** İlk görsel kart ve paylaşım görseli olarak kullanılıyor — sırası önemli. */
  const makeCover = (index: number) => {
    const next = [...images];
    const [picked] = next.splice(index, 1);
    onChange([picked, ...next]);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg text-sea-deep">Photographs</h2>
          <p className="mt-1.5 text-sm text-ink-40">
            {images.length === 0
              ? "No images attached yet."
              : `${images.length} attached · the first one is the cover image.`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy || !canUpload}
          title={canUpload ? undefined : "Enter a title first — it sets the folder name."}
          className="inline-flex items-center gap-2 rounded-sm border border-sea-deep bg-sea-deep px-4 py-2.5 font-sans text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-shell transition-colors hover:border-gold hover:bg-gold hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? (
            <>
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              Uploading…
            </>
          ) : (
            <>
              <ImagePlus className="size-3.5" aria-hidden="true" />
              Upload images
            </>
          )}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(event) => event.target.files && upload(event.target.files)}
        className="sr-only"
        /* Görünür etiketi yok (tetikleyici yukarıdaki düğme), o yüzden
           erişilebilir adı elle veriyoruz — aksi hâlde ekran okuyucu
           yalnızca "file upload button" der. */
        aria-label="Choose property photographs to upload"
        /*
          `accept` yalnızca bir KOLAYLIK — dosya seçiciyi filtreler, hiçbir
          şey garanti etmez. Gerçek doğrulama sunucuda: yüklenen her dosya
          sharp ile çözülüyor, çözülemiyorsa reddediliyor.
        */
      />

      {notice ? (
        <p className="mt-4 rounded-sm border border-line bg-sea-tint px-4 py-3 text-sm text-sea-deep">
          {notice}
        </p>
      ) : null}

      {errors.length > 0 ? (
        <ul className="mt-4 space-y-1.5 rounded-sm border border-gold/40 bg-gold/10 px-4 py-3">
          {errors.map((error) => (
            <li
              key={`${error.name}-${error.reason}`}
              className="flex items-start gap-2 text-sm text-gold-deep"
            >
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>
                <strong className="font-medium">{error.name}</strong> — {error.reason}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {images.length > 0 ? (
        <ul className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {images.map((image, index) => (
            <li
              key={image.src}
              className={cn(
                "group relative overflow-hidden rounded-sm border bg-shell-deep",
                index === 0 ? "border-gold" : "border-line",
              )}
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  /* Küçük önizleme — 200px'ten büyük varyant indirmeye gerek yok. */
                  sizes="200px"
                  className="object-cover"
                />
              </div>

              {index === 0 ? (
                <span className="absolute left-1.5 top-1.5 rounded-sm bg-gold px-1.5 py-0.5 font-sans text-[0.5625rem] font-bold uppercase tracking-[0.1em] text-ink">
                  Cover
                </span>
              ) : null}

              {/*
                Kontroller hover'da beliriyor ama `focus-within` ile klavye
                kullanıcısına da açılıyor — yalnızca hover'a bağlansaydı
                Tab ile gezen biri düğmeleri hiç göremezdi.
              */}
              <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-ink/80 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                {index !== 0 ? (
                  <button
                    type="button"
                    onClick={() => makeCover(index)}
                    aria-label={`Make photo ${index + 1} the cover image`}
                    title="Make cover"
                    className="inline-flex size-7 items-center justify-center rounded-sm bg-shell/90 text-ink transition-colors hover:bg-gold"
                  >
                    <Star className="size-3.5" aria-hidden="true" />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`Remove photo ${index + 1}`}
                  title="Remove"
                  className="inline-flex size-7 items-center justify-center rounded-sm bg-shell/90 text-ink transition-colors hover:bg-gold-deep hover:text-shell"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
