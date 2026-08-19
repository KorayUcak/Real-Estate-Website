/**
 * Talep formunun paylaşılan tipi, doğrulaması ve başlangıç durumu.
 *
 * Neden ayrı bir dosyada: "use server" ile işaretlenmiş bir modül YALNIZCA
 * async fonksiyon export edebilir. Oradan bir sabit export etmek hata vermez,
 * sessizce `undefined` olarak gelir ve bileşen ilk render'da patlar.
 * Bu yüzden veri tarafı burada, eylem tarafı app/actions/enquiry.ts içinde durur.
 *
 * Doğrulama da buraya taşındı çünkü artık İKİ giriş kapısı var:
 *   - Server Action (form gönderimi, JavaScript'siz de çalışır)
 *   - POST /api/contact (JSON; harici entegrasyonlar ve istemci fetch'i)
 * İkisi de aynı kuralları uygulamalı — kopyalanmış bir doğrulama, zamanla
 * ayrışan iki doğrulama demektir.
 */

export type EnquiryState = {
  status: "idle" | "success" | "error";
  message: string;
  /** Alan adı → hata metni. Boş obje = hata yok. */
  fieldErrors: Record<string, string>;
};

export const EMPTY_ENQUIRY_STATE: EnquiryState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};

/** Doğrulamadan geçmiş, e-postaya dönüştürülmeye hazır talep. */
export type Enquiry = {
  enquiryType: string;
  name: string;
  email: string;
  phone: string | null;
  budget: string | null;
  propertyReference: string | null;
  arrivalDate: string | null;
  departureDate: string | null;
  travellers: string | null;
  message: string;
  /** ISO 8601 — e-posta üstbilgisindeki tarihe güvenmemek için. */
  receivedAt: string;
};

export const SUCCESS_MESSAGE =
  "Thank you — your enquiry is with us. We reply to every message personally, usually within one working day.";

/**
 * Sağlayıcı hatasında gösterilen metin. Telefon numarası BİLEREK içinde:
 * e-posta gitmediyse kullanıcıya "bir şeyler ters gitti" deyip yolcu etmek,
 * o müşteriyi kaybetmek demektir.
 */
export const DELIVERY_ERROR_MESSAGE =
  "We could not send your enquiry just now. Please try again, or call us on +90 534 052 00 30.";

export const VALIDATION_ERROR_MESSAGE =
  "Please check the highlighted fields and try again.";

/**
 * Kasıtlı olarak gevşek bir e-posta kontrolü: RFC 5322'yi tam uygulayan
 * regex'ler pratikte geçerli adresleri reddedip dönüşüm kaybettirir.
 * Amaç yazım hatasını yakalamak, adresi kanıtlamak değil.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Alan uzunluk tavanları. Doğrulama hatası ÜRETMEZLER, sessizce keserler:
 * amaç kullanıcıyı azarlamak değil, 2 MB'lik bir mesajın gelen kutusuna
 * (ya da SMTP sunucusuna) dayanmasını engellemek.
 */
const LIMITS: Record<string, number> = {
  name: 120,
  email: 200,
  phone: 40,
  budget: 80,
  propertyReference: 60,
  enquiryType: 60,
  travellers: 40,
  arrivalDate: 40,
  departureDate: 40,
  message: 5_000,
};

/** FormData ve JSON gövdesi için ortak okuyucu. */
export type EnquirySource = FormData | Record<string, unknown>;

function readField(source: EnquirySource, key: string): string {
  const value =
    source instanceof FormData ? source.get(key) : (source[key] ?? "");

  if (typeof value !== "string") return "";

  return value.trim().slice(0, LIMITS[key] ?? 200);
}

export type EnquiryValidation =
  | { ok: true; enquiry: Enquiry }
  | { ok: false; fieldErrors: Record<string, string> };

/**
 * Honeypot: gerçek kullanıcılar bu alanı göremez, botlar her alanı doldurur.
 * Doluysa arayan tarafta BAŞARILI gibi davranıp sessizce düşürüyoruz — bota
 * "yakalandın" demek, denemesini değiştirmesine yol açar.
 */
export function isHoneypotFilled(source: EnquirySource): boolean {
  return readField(source, "company").length > 0;
}

export function validateEnquiry(source: EnquirySource): EnquiryValidation {
  const name = readField(source, "name");
  const email = readField(source, "email");
  const phone = readField(source, "phone");
  const message = readField(source, "message");
  const propertyReference = readField(source, "propertyReference");
  const budget = readField(source, "budget");
  /** Hangi sayfadan geldiği — gelen kutusunda talebi sınıflandırmak için. */
  const enquiryType = readField(source, "enquiryType") || "General";

  /** Görüntüleme gezisi formuna özgü alanlar; diğer formlarda boş gelir. */
  const arrivalDate = readField(source, "arrivalDate");
  const departureDate = readField(source, "departureDate");
  const travellers = readField(source, "travellers");

  const fieldErrors: Record<string, string> = {};

  if (name.length < 2) {
    fieldErrors.name = "Please tell us your name.";
  }

  if (!EMAIL_PATTERN.test(email)) {
    fieldErrors.email = "Please enter an email address we can reply to.";
  }

  if (message.length < 10) {
    fieldErrors.message =
      "A sentence or two about what you are looking for helps us reply properly.";
  }

  /**
   * Tarih doğrulaması yalnızca ikisi de doluysa çalışır — tarihler isteğe
   * bağlıdır ve "henüz bilmiyorum" tamamen geçerli bir cevaptır.
   * Dönüş tarihinin gidişten önce olması ise her zaman bir hatadır.
   */
  if (arrivalDate && departureDate && departureDate < arrivalDate) {
    fieldErrors.departureDate =
      "The return date cannot be before the arrival date.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    enquiry: {
      enquiryType,
      name,
      email,
      phone: phone || null,
      budget: budget || null,
      propertyReference: propertyReference || null,
      arrivalDate: arrivalDate || null,
      departureDate: departureDate || null,
      travellers: travellers || null,
      message,
      receivedAt: new Date().toISOString(),
    },
  };
}
