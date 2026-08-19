import "server-only";

import { mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { safeSlugSegment } from "@/lib/admin/json-store";
import type { VillaImage } from "@/lib/types";

/**
 * GÖRSEL YÜKLEME KATMANI.
 *
 * Dosyalar `public/images/properties/<slug>/` altına, sitedeki mevcut
 * kayıtlarla aynı düzende yazılır (`1.webp`, `2.webp`, …).
 *
 * ⚠️ NEDEN HER GÖRSEL SHARP'TAN GEÇİYOR — üç ayrı sebep, üçü de gerekli:
 *
 *   1. DOĞRULAMA. İstemcinin gönderdiği `file.type` (MIME) ve dosya uzantısı
 *      TAMAMEN sahte olabilir; ikisi de istemci tarafından yazılır. `.webp`
 *      adıyla gönderilen bir PHP dosyası uzantı kontrolünü geçer. Sharp'ın
 *      kod çözücüsü ise içeriğe bakar: gerçek bir raster görsel değilse
 *      çözemez ve fırlatır. Yani "bu bir görsel mi" sorusunun tek güvenilir
 *      cevabı, onu gerçekten çözmeye çalışmaktır.
 *
 *   2. BOYUT BİLGİSİ. `VillaImage` tipi `width` ve `height` ZORUNLU tutuyor
 *      ve `next/image` bunlar olmadan düzeni koruyamaz (CLS). Bu değerleri
 *      istemciye sormak yerine kaynaktan okuyoruz.
 *
 *   3. WEBP'E ÇEVİRME. Portföydeki 57 ilanın görselleri zaten WebP; yeni
 *      yüklenen bir 8 MB'lık JPEG'i olduğu gibi bırakmak, sayfayı ilk açan
 *      ziyaretçiye o 8 MB'ı indirtir.
 */

export const PROPERTY_IMAGE_ROOT = path.join(
  process.cwd(),
  "public",
  "images",
  "properties",
);

/** Tek dosya üst sınırı. Çözülmeden ÖNCE bakılır — bkz. route handler. */
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

/** Tek istekte kabul edilen dosya sayısı. */
export const MAX_FILES_PER_REQUEST = 20;

/**
 * Depolanan en büyük kenar. 2560 px, `scripts/convert-images.js` ile aynı
 * değer — panelden yüklenen görsel, toplu dönüştürülenlerle aynı bütçede
 * kalsın. Daha büyük bir orijinali saklamanın karşılığı yok: `next/image`
 * zaten bundan küçük varyantlar üretiyor.
 */
const MAX_EDGE = 2560;
const WEBP_QUALITY = 80;

export type StoredImage = VillaImage;

/** İlanın görsel klasörünün MUTLAK yolu — slug temizlenerek türetilir. */
export function imageDirectoryFor(slug: string): { dir: string; publicPath: string } {
  const safe = safeSlugSegment(slug);

  /*
    Boş slug, `PROPERTY_IMAGE_ROOT`un KENDİSİNE yazmak demek olurdu —
    yani tüm ilanların klasörlerinin yanına başıboş dosyalar. Çağıran
    taraf slug'ı zaten doğruluyor; bu ikinci kapı, ileride başka bir
    çağrı yeri eklendiğinde sessizce bozulmasın diye.
  */
  if (!safe) throw new Error("[media] Geçersiz ilan slug'ı.");

  return {
    dir: path.join(PROPERTY_IMAGE_ROOT, safe),
    /* JSON'a ve <Image src>'ye giden yol — daima POSIX eğik çizgi. */
    publicPath: `/images/properties/${safe}`,
  };
}

/**
 * Klasördeki mevcut `<n>.webp` dosyalarına bakıp bir sonraki numarayı verir.
 * Var olan dosyaların ÜZERİNE yazmamak için: yönetici ikinci kez yükleme
 * yaptığında ilk turdaki fotoğraflar durmalı.
 */
async function nextIndex(dir: string): Promise<number> {
  try {
    const entries = await readdir(dir);
    const numbers = entries
      .map((name) => Number(path.basename(name, path.extname(name))))
      .filter((n) => Number.isInteger(n) && n > 0);

    return numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  } catch {
    /* Klasör henüz yok — ilk yükleme. */
    return 1;
  }
}

/**
 * Bir dosyayı WebP'e çevirip ilanın klasörüne yazar ve JSON'a eklenecek
 * `VillaImage` kaydını döndürür.
 *
 * `alt` metni ÇAĞIRAN tarafından veriliyor: erişilebilirlik ve Google
 * Görseller sıralaması için gerçek bir açıklama gerekiyor ve onu dosya
 * adından üretmek ("1.webp") işe yaramaz.
 */
export async function storeImage(
  slug: string,
  input: Buffer,
  alt: string,
): Promise<StoredImage> {
  const { dir, publicPath } = imageDirectoryFor(slug);
  await mkdir(dir, { recursive: true });

  /*
    `failOn: "none"`: hafif bozuk ama görüntülenebilir dosyalarda sharp'ın
    varsayılanı işlemi tamamen durdurur. Fotoğraf makinelerinden ve
    WhatsApp'tan gelen JPEG'lerde bu sık görülür; kurtarılabiliyorsa
    kurtarmak, yöneticiye sebepsiz bir hata göstermekten iyidir.
  */
  const pipeline = sharp(input, { failOn: "none" })
    /* EXIF `Orientation` etiketini piksellere uygula ve etiketi düşür —
       aksi hâlde telefonla çekilmiş dikey fotoğraflar yan yatık görünür. */
    .rotate()
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      /* Küçük görselleri BÜYÜTME: 800px'lik bir fotoğrafı 2560'a
         esnetmek dosyayı şişirir, netlik kazandırmaz. */
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY, effort: 5 });

  /*
    `toBuffer({ resolveWithObject: true })` çıktının GERÇEK boyutlarını
    verir. `metadata()` ile girdiyi ölçmek yanlış olurdu: resize sonrası
    boyut farklı olur ve JSON'daki width/height dosyayla uyuşmazdı.
  */
  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });

  const index = await nextIndex(dir);
  const fileName = `${index}.webp`;

  const { writeFile } = await import("node:fs/promises");
  await writeFile(path.join(dir, fileName), data);

  return {
    src: `${publicPath}/${fileName}`,
    alt,
    width: info.width,
    height: info.height,
  };
}

/**
 * Bir ilanın görsel klasörünü tamamen siler. İlan silinirken çağrılır;
 * yoksa `public/` altında sahipsiz klasörler birikir.
 *
 * `imageDirectoryFor` slug'ı temizlediği için bu fonksiyona
 * `../../` gibi bir değer geçirilse bile silme işlemi ilan klasörlerinin
 * dışına çıkamaz.
 */
export async function removeImageDirectory(slug: string): Promise<void> {
  const { dir } = imageDirectoryFor(slug);

  /*
    Son bir kontrol: hesaplanan yol GERÇEKTEN kök klasörün altında mı?
    `safeSlugSegment` bunu zaten garanti ediyor, ama silme geri
    alınamayan bir işlem — iki kez ölçmek ucuz.
  */
  const relative = path.relative(PROPERTY_IMAGE_ROOT, dir);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("[media] Klasör yolu ilan kökünün dışında — silme iptal.");
  }

  await rm(dir, { recursive: true, force: true });
}
