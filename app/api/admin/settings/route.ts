import { readFile } from "node:fs/promises";
import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { assertAdmin } from "@/lib/admin/auth";
import { mutateJsonFile } from "@/lib/admin/json-store";
import { today } from "@/lib/admin/property-input";
import {
  DEFAULT_SETTINGS,
  mergeSettings,
  SETTINGS_PATH,
  type SiteSettings,
} from "@/lib/settings";

/**
 * GENEL SİTE AYARLARI — oku (GET) ve kaydet (PUT).
 *
 * PATCH değil PUT: form her zaman TÜM ayar nesnesini gönderiyor, kısmi
 * güncelleme yok. Bu, iki sekmeden yapılan eşzamanlı düzenlemede
 * "son yazan kazanır" demek — ayarlar tek kişilik ve nadir bir iş
 * olduğu için kabul edilebilir bir sadelik.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asString(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * Sosyal medya adresleri.
 *
 * ⚠️ PROTOKOL BEYAZ LİSTESİ. Bu değerler doğrudan `<a href>` içine ve
 * schema.org `sameAs` alanına giriyor. Doğrulanmadan kabul edilseydi
 * `javascript:...` yazan bir değer, panele erişimi olan birinin sitenin
 * her sayfasına script koyabilmesi demekti. Yalnızca http(s) geçer.
 *
 * Boş dize geçerli: "bu hesabımız yok" demenin yolu.
 */
function asUrl(value: unknown): string {
  const raw = asString(value, 300);
  if (!raw) return "";

  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

/** Telefon: rakam, boşluk, +, tire ve parantez dışındaki her şey atılır. */
function asPhone(value: unknown, max = 32): string {
  return asString(value, max).replace(/[^\d\s+()-]/g, "");
}

/** wa.me yalnızca rakam kabul eder — + ve boşluk 404 üretir. */
function asDigits(value: unknown, max = 20): string {
  return asString(value, max).replace(/\D/g, "");
}

export async function GET() {
  const denied = await assertAdmin();
  if (denied) return denied;

  let settings: SiteSettings;
  try {
    settings = mergeSettings(
      JSON.parse(await readFile(SETTINGS_PATH, "utf8")) as Partial<SiteSettings>,
    );
  } catch {
    settings = DEFAULT_SETTINGS;
  }

  return Response.json(settings, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: NextRequest) {
  const denied = await assertAdmin();
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const contact = (body.contact ?? {}) as Record<string, unknown>;
  const address = (contact.address ?? {}) as Record<string, unknown>;
  const social = (body.social ?? {}) as Record<string, unknown>;

  const email = asString(contact.email, 160);

  const errors: Record<string, string> = {};
  if (!asString(body.companyName, 120)) {
    errors.companyName = "Company name is required.";
  }
  if (!asString(address.full, 300)) {
    errors["address.full"] = "Office address is required.";
  }
  /* Kasıtlı olarak gevşek: RFC 5322'yi tam uygulayan regex'ler pratikte
     geçerli adresleri reddediyor. Amaç yazım hatası yakalamak. */
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errors["contact.email"] = "Enter a valid email address.";
  }
  if (!asDigits(contact.whatsappNumber)) {
    errors["contact.whatsappNumber"] = "WhatsApp number is required (digits only).";
  }

  if (Object.keys(errors).length > 0) {
    return Response.json({ errors }, { status: 422 });
  }

  const next: SiteSettings = mergeSettings({
    companyName: asString(body.companyName, 120),
    contact: {
      phoneDisplay: asPhone(contact.phoneDisplay),
      phoneE164: `+${asDigits(contact.phoneE164)}`,
      whatsappNumber: asDigits(contact.whatsappNumber),
      email,
      openingHours: asString(contact.openingHours, 120),
      address: {
        full: asString(address.full, 300),
        street: asString(address.street, 200),
        district: asString(address.district, 80),
        city: asString(address.city, 80),
        country: asString(address.country, 4).toUpperCase(),
        countryName: asString(address.countryName, 80),
      },
    },
    social: {
      instagram: asUrl(social.instagram),
      facebook: asUrl(social.facebook),
      x: asUrl(social.x),
      linkedin: asUrl(social.linkedin),
    },
    updatedAt: today(),
  });

  await mutateJsonFile<SiteSettings>(
    SETTINGS_PATH,
    async () => next,
    () => next,
  );

  /*
    AYARLAR HER SAYFADA GÖRÜNÜYOR — başlıkta telefon, footer'da adres ve
    sosyal bağlantılar. Tek tek yol saymak yerine kök layout'u geçersiz
    kılıyoruz: `"layout"` tipi, o segmentin ALTINDAKİ tüm iç içe layout ve
    sayfaları düşürür. İlan uç noktalarındaki hedefli yaklaşımın aksine
    burada gerçekten her şey etkileniyor.
  */
  revalidatePath("/", "layout");

  return Response.json({ settings: next });
}
