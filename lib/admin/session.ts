import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * ADMIN OTURUMU — imzalı çerez, harici bağımlılık yok.
 *
 * ⚠️ NEDEN BU DOSYA VAR. Brief'te panelin "hiçbir yerden link verilmemesi"
 * isteniyordu ve bu doğru bir istek — ama link vermemek bir GİZLİLİK önlemi,
 * güvenlik önlemi değil. `/admin` altındaki route handler'lar `fs.writeFile`
 * çağırıyor; kimlik doğrulaması olmadan bu, adresi tahmin eden HERKESE
 * sunucunun diskine yazma yetkisi vermek demek. URL'ler proxy loglarında,
 * tarayıcı geçmişinde ve Referer başlıklarında sızar.
 *
 * Bu yüzden minimum ama gerçek bir kapı: paylaşılan parola + HMAC ile
 * imzalanmış, HttpOnly bir oturum çerezi.
 *
 * TASARIM SINIRLARI (bilinçli):
 *   - Kullanıcı tablosu yok, tek paylaşılan parola var. Kim ne değiştirdi
 *     bilinmiyor. Birden fazla kişi kullanacaksa kişi başı hesap gerekir.
 *   - Çerez STATELESS: sunucu tarafında iptal edilemez. Bir oturumu
 *     sonlandırmanın yolu ADMIN_SESSION_SECRET'ı değiştirmek — bu, o anki
 *     TÜM oturumları düşürür.
 *   - Kaba kuvvet için hız sınırı yok; parola uzun ve rastgele olmalı.
 */

export const ADMIN_COOKIE = "c2c_admin";

/** Oturum ömrü. Kısa tutuluyor: paylaşılan parolalı bir panelde uzun ömür risktir. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

function requireEnv(name: string): string {
  const value = process.env[name];

  /*
    Sessizce varsayılana düşmek burada felaket olurdu: sabit kodlanmış bir
    yedek sır, deposu görebilen herkesin geçerli oturum çerezi üretebilmesi
    demek. Eksikse kapı hiç açılmasın.
  */
  if (!value) {
    throw new Error(
      `[admin] ${name} tanımlı değil. .env.local dosyanıza ekleyin — admin paneli bu değişken olmadan çalışmaz.`,
    );
  }

  return value;
}

/** Uzunluk sızdırmayan, sabit zamanlı dize karşılaştırması. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");

  /*
    timingSafeEqual farklı uzunluklarda İSTİSNA fırlatır, false dönmez.
    Uzunluğu önce kontrol etmek zaten uzunluk bilgisini sızdırır ama bu
    kabul edilebilir: gizli olan parolanın uzunluğu değil, içeriği.
  */
  if (bufA.length !== bufB.length) return false;

  return timingSafeEqual(bufA, bufB);
}

function sign(payload: string): string {
  return createHmac("sha256", requireEnv("ADMIN_SESSION_SECRET"))
    .update(payload)
    .digest("base64url");
}

/**
 * Token biçimi: `<expiresAt>.<nonce>.<hmac>`
 *
 * `nonce` iki özdeş oturumun aynı dizeyi üretmesini engeller; `expiresAt`
 * imzanın İÇİNDE olduğu için istemci tarafından uzatılamaz.
 */
export function createSessionToken(): string {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const nonce = randomBytes(12).toString("base64url");
  const payload = `${expiresAt}.${nonce}`;

  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [expiresAt, nonce, signature] = parts;
  const payload = `${expiresAt}.${nonce}`;

  /* Önce imza: geçersiz imzalı bir token'ın son kullanma tarihine güvenilmez. */
  if (!safeEqual(signature, sign(payload))) return false;

  const expiry = Number(expiresAt);
  return Number.isFinite(expiry) && expiry > Date.now();
}

export function verifyPassword(candidate: string): boolean {
  return safeEqual(candidate, requireEnv("ADMIN_PASSWORD"));
}
