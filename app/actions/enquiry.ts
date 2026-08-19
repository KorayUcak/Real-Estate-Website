"use server";

import {
  DELIVERY_ERROR_MESSAGE,
  isHoneypotFilled,
  SUCCESS_MESSAGE,
  validateEnquiry,
  VALIDATION_ERROR_MESSAGE,
  type EnquiryState,
} from "@/lib/enquiry";
import { sendEnquiryEmail } from "@/lib/mail";

/**
 * İletişim / talep formunun sunucu tarafı.
 *
 * Server Action olarak yazılmasının sebebi: doğrulama istemciye hiç inmez ve
 * form JavaScript kapalıyken bile çalışır (progressive enhancement) — bot
 * trafiğinin ve engelleyici eklentilerin olduğu gerçek dünyada bu, sessizce
 * kaybedilen taleplerin arasındaki farktır.
 *
 * Kurallar ve gönderim burada DEĞİL: doğrulama @/lib/enquiry, SMTP
 * @/lib/mail içinde. POST /api/contact aynı ikisini çağırır, yani iki kapı
 * tek davranışı paylaşır.
 *
 * DİKKAT: Bu dosya "use server" ile işaretli olduğu için buradan yalnızca
 * async fonksiyon export edilebilir. Tip ve sabitler @/lib/enquiry içindedir.
 */
export async function submitEnquiry(
  _previousState: EnquiryState,
  formData: FormData,
): Promise<EnquiryState> {
  /* Tuzağa düşen bot başarı ekranı görür ama e-posta gönderilmez. */
  if (isHoneypotFilled(formData)) {
    return { status: "success", message: SUCCESS_MESSAGE, fieldErrors: {} };
  }

  const result = validateEnquiry(formData);

  if (!result.ok) {
    return {
      status: "error",
      message: VALIDATION_ERROR_MESSAGE,
      fieldErrors: result.fieldErrors,
    };
  }

  try {
    await sendEnquiryEmail(result.enquiry);
  } catch (error) {
    /**
     * Sunucu loguna TAM talebi yazıyoruz. Sağlayıcı çöktüğünde müşteri
     * tekrar denemeyebilir; logdaki bu satır, o talebin elde kalan tek
     * kopyası olur.
     */
    console.error("[enquiry] delivery failed", error, result.enquiry);

    return {
      status: "error",
      message: DELIVERY_ERROR_MESSAGE,
      fieldErrors: {},
    };
  }

  return { status: "success", message: SUCCESS_MESSAGE, fieldErrors: {} };
}
