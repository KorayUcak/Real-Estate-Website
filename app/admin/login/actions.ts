"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  createSessionToken,
  SESSION_MAX_AGE_SECONDS,
  verifyPassword,
} from "@/lib/admin/session";

export type LoginState = { error: string | null };

/**
 * Giriş eylemi.
 *
 * Server Action olarak yazıldı çünkü parola istemci JavaScript'ine hiç
 * inmiyor ve form JS kapalıyken de çalışıyor — sitenin geri kalanındaki
 * `submitEnquiry` ile aynı kalıp.
 */
export async function login(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = formData.get("password");
  const next = formData.get("next");

  if (typeof password !== "string" || password.length === 0) {
    return { error: "Enter your password." };
  }

  /*
    Yavaşlatma. Kaba kuvvet saldırısına karşı tam bir hız sınırı değil —
    o, ters vekil (nginx/Cloudflare) katmanında yapılmalı — ama saniyede
    binlerce deneme yapılmasını da engelliyor. Sabit gecikme bilinçli:
    başarılı ve başarısız denemenin süresi aynı olsun.
  */
  await new Promise((resolve) => setTimeout(resolve, 400));

  if (!verifyPassword(password)) {
    /* Hangi alanın yanlış olduğunu söylemiyoruz — söylenecek tek alan var. */
    return { error: "Incorrect password." };
  }

  (await cookies()).set(ADMIN_COOKIE, createSessionToken(), {
    /* JS'ten okunamaz: XSS ile oturum çalınmasını engeller. */
    httpOnly: true,
    /* Üretimde yalnızca HTTPS. Yerelde http://localhost çalışsın diye koşullu. */
    secure: process.env.NODE_ENV === "production",
    /* CSRF savunması: çerez başka sitelerden gelen isteklere eklenmez. */
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  /*
    AÇIK YÖNLENDİRME (open redirect) KORUMASI.

    `next` istemciden geliyor. Doğrudan `redirect(next)` yazmak, saldırganın
    /admin/login?next=https://kotu-site.example bağlantısı hazırlayıp
    kullanıcıyı giriş yaptıktan SONRA kendi sitesine atmasına izin verirdi.

    İki kontrol de gerekli: "/admin" ile başlamalı VE "//" ile başlamamalı —
    çünkü "//kotu-site.example" protokol-göreli bir MUTLAK URL'dir ve
    startsWith("/admin") kontrolünü tek başına geçemez ama "/admin" ile
    başlayan "/admin\\evil" gibi varyantlara karşı da temkinli olmak gerekir.
  */
  const target =
    typeof next === "string" &&
    next.startsWith("/admin") &&
    !next.startsWith("//") &&
    !next.includes("\\")
      ? next
      : "/admin";

  redirect(target);
}
