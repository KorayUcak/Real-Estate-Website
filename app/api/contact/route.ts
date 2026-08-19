import {
  DELIVERY_ERROR_MESSAGE,
  isHoneypotFilled,
  SUCCESS_MESSAGE,
  validateEnquiry,
  VALIDATION_ERROR_MESSAGE,
} from "@/lib/enquiry";
import { sendEnquiryEmail } from "@/lib/mail";

/**
 * POST /api/contact — talep formunun JSON kapısı.
 *
 * Sitedeki formlar bunu KULLANMIYOR; onlar Server Action ile gidiyor ve
 * böylece JavaScript yüklenmeden de çalışıyorlar (bkz. app/actions/enquiry.ts).
 * Bu uç nokta, HTML formu dışından gelen gönderimler için: landing page'ler,
 * harici bir istemci, otomasyon araçları, kurulum sonrası duman testi.
 *
 * Doğrulama ve gönderim ortak modüllerden geliyor — iki kapı, tek davranış.
 */

/** Nodemailer bir Node.js kütüphanesi: Edge çalışma zamanında koşamaz. */
export const runtime = "nodejs";

/** Talep her seferinde gerçekten gönderilmeli; bu yanıt asla cache'lenmez. */
export const dynamic = "force-dynamic";

type Payload = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
};

function json(payload: Payload, status: number): Response {
  return Response.json(payload, { status });
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return json({ ok: false, message: "Expected a JSON body." }, 400);
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return json({ ok: false, message: "Expected a JSON object." }, 400);
  }

  const source = body as Record<string, unknown>;

  /**
   * Tuzağa düşen bota 200 dönüyoruz. "Yakalandın" demek, denemesini
   * değiştirmesine yol açar; sessiz başarı ise onu memnun eder ve hiçbir
   * e-posta gönderilmez.
   */
  if (isHoneypotFilled(source)) {
    return json({ ok: true, message: SUCCESS_MESSAGE }, 200);
  }

  const result = validateEnquiry(source);

  if (!result.ok) {
    return json(
      {
        ok: false,
        message: VALIDATION_ERROR_MESSAGE,
        fieldErrors: result.fieldErrors,
      },
      /* 422: gövde iyi biçimli ama içeriği kurallara uymuyor. */
      422,
    );
  }

  try {
    await sendEnquiryEmail(result.enquiry);
  } catch (error) {
    /* Sağlayıcı çökerse logdaki bu satır talebin elde kalan tek kopyasıdır. */
    console.error("[enquiry] delivery failed", error, result.enquiry);

    return json({ ok: false, message: DELIVERY_ERROR_MESSAGE }, 502);
  }

  return json({ ok: true, message: SUCCESS_MESSAGE }, 200);
}
