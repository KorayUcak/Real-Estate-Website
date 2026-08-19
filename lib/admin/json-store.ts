import "server-only";

import { rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { slugify } from "@/lib/slugify";

/**
 * JSON DOSYASINA GÜVENLİ YAZMA.
 *
 * Bir CMS'in en sessiz felaketi, yarım yazılmış bir veri dosyasıdır:
 * `villas.json` bozulursa 57 ilanın tamamı aynı anda siteden düşer.
 * Bu modül iki ayrı riski kapatıyor.
 *
 * ─────────────────────────────────────────────────────────────────
 * 1. ATOMİK YAZMA — neden doğrudan `writeFile` değil.
 *
 * `writeFile(VILLAS_PATH, json)` dosyayı önce SIFIRLAR, sonra doldurur.
 * Bu iki adım arasında süreç ölürse (deploy, OOM, Ctrl-C) dosya boş veya
 * yarım kalır. Aynı anda okuyan bir sayfa render'ı da yarım JSON görür.
 *
 * Çözüm: aynı dizine geçici bir dosya yaz, sonra `rename` ile üzerine al.
 * POSIX'te aynı dosya sistemi içinde `rename` ATOMİKTİR — okuyucular ya
 * tamamen eski ya da tamamen yeni dosyayı görür, arası yoktur. Geçici
 * dosyanın AYNI DİZİNDE olması şart: /tmp'den rename etmek dosya sistemi
 * sınırını geçer ve atomiklik garantisi kaybolur.
 *
 * ─────────────────────────────────────────────────────────────────
 * 2. SIRALAMA — neden bir kilit var.
 *
 * "Oku → değiştir → yaz" bir okuma-değiştirme-yazma döngüsü. İki istek
 * araya girerse (yönetici iki sekmede kaydet'e basar, ya da bir toplu
 * içe aktarma paralel çalışır) ikisi de AYNI diziyi okur, ikisi de kendi
 * değişikliğini ekler ve ikincisi birincinin işini sessizce siler.
 *
 * `mutateJsonFile` tüm döngüyü tek bir promise zincirinde sıralıyor.
 * Bu, TEK BİR Node süreci içinde yeterli bir çözüm. Uygulamayı birden
 * çok işçi süreçle (PM2 cluster, birden çok konteyner) çalıştırırsanız
 * bu kilit süreçler arasında geçerli DEĞİLDİR ve dosya bazlı bir kilit
 * (proper-lockfile) veya tek yazar süreci gerekir.
 */

/** Dosya yolu → o dosya için sıradaki işlem zinciri. */
const writeQueues = new Map<string, Promise<unknown>>();

async function writeAtomic(filePath: string, contents: string): Promise<void> {
  const directory = path.dirname(filePath);
  const temporary = path.join(
    directory,
    `.${path.basename(filePath)}.${randomBytes(6).toString("hex")}.tmp`,
  );

  await writeFile(temporary, contents, "utf8");
  await rename(temporary, filePath);
}

/**
 * Bir JSON dosyasını oku, `mutate` ile dönüştür, atomik olarak geri yaz.
 * Aynı dosyaya yapılan eşzamanlı çağrılar sıraya girer.
 *
 * `mutate` YENİ bir değer döndürmeli; girdiyi yerinde değiştirmek de
 * çalışır ama dönüş değeri yazılan şeydir.
 */
export async function mutateJsonFile<T>(
  filePath: string,
  read: () => Promise<T>,
  mutate: (current: T) => T | Promise<T>,
): Promise<T> {
  const previous = writeQueues.get(filePath) ?? Promise.resolve();

  const task = previous
    /* `catch`: önceki işlem patladıysa sıra TIKANMAMALI. */
    .catch(() => undefined)
    .then(async () => {
      const current = await read();
      const next = await mutate(current);

      /* 2 boşluk girinti: dosya git diff'te okunabilir kalsın. */
      await writeAtomic(filePath, `${JSON.stringify(next, null, 2)}\n`);

      return next;
    });

  writeQueues.set(filePath, task);

  try {
    return await task;
  } finally {
    /* Sıra boşaldıysa haritayı büyütmeye devam etme. */
    if (writeQueues.get(filePath) === task) writeQueues.delete(filePath);
  }
}

/**
 * Kullanıcıdan gelen bir dizeyi güvenli bir dosya/dizin adına indirger.
 * Uygulama `lib/slugify.ts` içinde — form aynı kuralı istemcide de
 * çalıştırıp slug'ın canlı önizlemesini gösteriyor, iki tarafın aynı
 * sonucu üretmesi şart.
 */
export const safeSlugSegment = (value: string): string => slugify(value);
