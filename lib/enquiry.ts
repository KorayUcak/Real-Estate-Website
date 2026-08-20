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

/**
 * ⚠️ BU SABİTLER ARTIK ÇEVİRİ ANAHTARI TAŞIYOR, METİN DEĞİL.
 *
 * `lib/enquiry.ts` hem sunucu eyleminde hem istemci formunda kullanılıyor
 * ve dili bilmiyor. Metni burada tutmak, üç dilli bir sitede formun
 * her zaman İngilizce cevap vermesi demekti — üstelik hata mesajı, yani
 * kullanıcının en çok yardıma ihtiyaç duyduğu an.
 *
 * Anahtarı `components/lead-form.tsx` ve `viewing-trip-form.tsx` çözüyor.
 */
export const SUCCESS_MESSAGE = "validation.success";

/**
 * Sağlayıcı hatasında gösterilen metin. Telefon numarası BİLEREK içinde:
 * e-posta gitmediyse kullanıcıya "bir şeyler ters gitti" deyip yolcu etmek,
 * o müşteriyi kaybetmek demektir.
 */
/**
 * Telefon numarası metne GÖMÜLÜ DEĞİL, `{phone}` yer tutucusuyla geliyor:
 * numara `data/settings.json` üzerinden panelden düzenlenebiliyor ve üç
 * çeviriye sabitlenmiş bir numara, yönetici onu değiştirdiğinde sessizce
 * eskir.
 */
export const DELIVERY_ERROR_MESSAGE = "validation.sendFailed";

export const VALIDATION_ERROR_MESSAGE = "validation.checkFields";

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
    fieldErrors.name = "validation.name";
  }

  if (!EMAIL_PATTERN.test(email)) {
    fieldErrors.email = "validation.email";
  }

  if (message.length < 10) {
    fieldErrors.message =
      "validation.message";
  }

  /**
   * Tarih doğrulaması yalnızca ikisi de doluysa çalışır — tarihler isteğe
   * bağlıdır ve "henüz bilmiyorum" tamamen geçerli bir cevaptır.
   * Dönüş tarihinin gidişten önce olması ise her zaman bir hatadır.
   */
  if (arrivalDate && departureDate && departureDate < arrivalDate) {
    fieldErrors.departureDate =
      "validation.returnBeforeArrival";
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
