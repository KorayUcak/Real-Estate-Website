import "server-only";

import nodemailer, { type Transporter } from "nodemailer";
import type { Enquiry } from "@/lib/enquiry";
import { contact, SITE_URL } from "@/lib/site";

/**
 * SMTP GÖNDERİM KATMANI.
 *
 * Tek iş yapar: doğrulanmış bir talebi şirketin gelen kutusuna yollar.
 * Doğrulama burada YOK (lib/enquiry.ts), HTTP burada YOK (route/action) —
 * çünkü aynı gönderici iki farklı giriş kapısından çağrılıyor.
 *
 * ⚠️ Bu modül `server-only` işaretli. Yanlışlıkla bir istemci bileşeninden
 * import edilirse derleme HATA verir; sessizce paketlenip SMTP parolasını
 * tarayıcıya taşımaz.
 */

/**
 * ZORUNLU DEĞİŞKENLER. Eksikse gönderim denenmez ve arayan tarafa hata
 * döner — "gönderildi" deyip hiçbir yere gitmeyen bir form, kaybedilmiş
 * müşteri demektir. Yerel geliştirmede .env.local'e bakın.
 */
type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean;
};

function readConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT ?? 587);

  if (!host || !user || !pass || !Number.isFinite(port)) return null;

  return {
    host,
    port,
    user,
    pass,
    /**
     * 465 = örtük TLS (bağlantı şifreli başlar). 587 ve 25 = düz başlar,
     * STARTTLS ile yükseltilir — nodemailer bunu `secure: false` iken
     * kendiliğinden yapar. Bu tek satır, GoDaddy/Microsoft 365/Gmail
     * arasındaki tek pratik farktır.
     */
    secure: port === 465,
  };
}

/**
 * Taşıyıcı modül kapsamında saklanıyor: her istekte yeni bir tane kurmak
 * her talep için yeniden TCP + TLS + kimlik doğrulama turu demek.
 * Nodemailer bağlantıyı havuzda tutar, ikinci talep hazır bağlantıyı bulur.
 */
let cachedTransporter: Transporter | null = null;

function getTransporter(config: SmtpConfig): Transporter {
  if (cachedTransporter) return cachedTransporter;

  cachedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    pool: true,
    maxConnections: 2,
    /* Sağlayıcı yanıt vermezse istek sonsuza kadar asılı kalmasın. */
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  return cachedTransporter;
}

/**
 * HTML KAÇIŞI — pazarlık konusu değil.
 *
 * Buraya gelen her şeyi bir yabancı yazdı. Kaçış olmadan `<img onerror>`
 * ya da bir açılır bağlantı doğrudan meslektaşımızın gelen kutusunda
 * çalışır. Ayrıca sıradan bir "3 < 4 bedroom" cümlesi de kaçışsız bozulur.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * BAŞLIK ENJEKSİYONU. Müşteri adı `Subject:` içine giriyor; içindeki bir
 * satır sonu, saldırganın kendi başlığını (ör. `Bcc:`) eklemesine izin
 * verirdi. Satır sonlarını boşluğa çeviriyoruz.
 */
function singleLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

/** Boş alanlar tabloya hiç girmez — "Phone: —" satırı gürültüden ibaret. */
type Row = { label: string; value: string };

function buildRows(enquiry: Enquiry): Row[] {
  const rows: Row[] = [
    { label: "Full name", value: enquiry.name },
    { label: "Email", value: enquiry.email },
  ];

  if (enquiry.phone) rows.push({ label: "Phone", value: enquiry.phone });
  if (enquiry.budget) rows.push({ label: "Budget", value: enquiry.budget });
  if (enquiry.propertyReference) {
    rows.push({ label: "Property", value: enquiry.propertyReference });
  }
  if (enquiry.arrivalDate) {
    rows.push({ label: "Arrival", value: enquiry.arrivalDate });
  }
  if (enquiry.departureDate) {
    rows.push({ label: "Departure", value: enquiry.departureDate });
  }
  if (enquiry.travellers) {
    rows.push({ label: "Travellers", value: enquiry.travellers });
  }

  rows.push({ label: "Enquiry type", value: enquiry.enquiryType });

  return rows;
}

/**
 * E-POSTA ŞABLONU — 2005 tekniğiyle, bilerek.
 *
 * Tablo düzeni, satır içi stil, web fontu yok. Outlook hâlâ Word'ün
 * render motorunu kullanıyor; flexbox/grid ve <style> bloğu orada
 * güvenilmez. Gelen kutusu, tasarım gösterisi yapılacak yer değil —
 * telefondan bakan bir satış temsilcisinin adı, numarayı ve mesajı üç
 * saniyede görmesi gereken yer.
 */
function renderHtml(enquiry: Enquiry): string {
  const rows = buildRows(enquiry)
    .map(
      ({ label, value }) => `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #e4ded2;font:600 12px/1.4 Arial,Helvetica,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#79817d;width:150px;vertical-align:top;">${escapeHtml(label)}</td>
            <td style="padding:10px 0;border-bottom:1px solid #e4ded2;font:400 15px/1.5 Arial,Helvetica,sans-serif;color:#23292b;">${escapeHtml(value)}</td>
          </tr>`,
    )
    .join("");

  /* Satır sonları <br> olur: düz metin gövdesi HTML'de tek paragrafa yapışmasın. */
  const message = escapeHtml(enquiry.message).replace(/\r?\n/g, "<br />");
  const received = new Date(enquiry.receivedAt).toUTCString();

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px 12px;background:#f3efe7;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e4ded2;">
      <tr>
        <td style="padding:28px 32px;background:#16332b;">
          <p style="margin:0;font:700 11px/1.4 Arial,Helvetica,sans-serif;letter-spacing:.24em;text-transform:uppercase;color:#c2a461;">Coast 2 Coast Properties</p>
          <h1 style="margin:8px 0 0;font:400 24px/1.3 Georgia,'Times New Roman',serif;color:#fbf9f5;">New website enquiry</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px 8px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${rows}
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 32px 28px;">
          <p style="margin:0 0 10px;font:600 12px/1.4 Arial,Helvetica,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#79817d;">Message</p>
          <div style="padding:16px 18px;background:#edf2ee;border-left:3px solid #2f5a4c;font:400 15px/1.65 Arial,Helvetica,sans-serif;color:#23292b;">${message}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 28px;">
          <!-- Yanıtla düğmesi ZATEN doğru adrese gider (Reply-To), ama
               mobil istemcilerde tek dokunuşluk bir yol daha bırakıyoruz. -->
          <a href="mailto:${escapeHtml(enquiry.email)}" style="display:inline-block;padding:12px 22px;background:#16332b;color:#fbf9f5;font:600 13px/1 Arial,Helvetica,sans-serif;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;">Reply to ${escapeHtml(enquiry.name)}</a>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 32px;background:#fbf9f5;border-top:1px solid #e4ded2;font:400 12px/1.6 Arial,Helvetica,sans-serif;color:#79817d;">
          Sent from ${escapeHtml(SITE_URL)} · ${escapeHtml(received)}
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Düz metin ikizi. Yalnızca nezaket değil: `text` alanı olmayan bir posta
 * spam filtrelerinde puan kaybeder ve saat bildirimlerinde okunmaz görünür.
 */
function renderText(enquiry: Enquiry): string {
  const rows = buildRows(enquiry)
    .map(({ label, value }) => `${label}: ${value}`)
    .join("\n");

  return `NEW WEBSITE ENQUIRY\n\n${rows}\n\nMessage:\n${enquiry.message}\n\n--\nSent from ${SITE_URL} · ${new Date(enquiry.receivedAt).toUTCString()}\n`;
}

/**
 * Talebi şirketin gelen kutusuna gönderir.
 *
 * Hata FIRLATIR (yutmaz): arayan taraf kullanıcıya dürüst bir hata
 * gösterebilsin diye. Başarısız gönderim, başarı ekranı gösterilmeyecek
 * tek durumdur.
 */
export async function sendEnquiryEmail(enquiry: Enquiry): Promise<void> {
  const config = readConfig();

  if (!config) {
    throw new Error(
      "SMTP is not configured — set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS.",
    );
  }

  const subject = singleLine(
    `New Website Enquiry from ${enquiry.name}${
      enquiry.propertyReference ? ` — ref ${enquiry.propertyReference}` : ""
    }`,
  );

  await getTransporter(config).sendMail({
    /**
     * FROM, DAİMA KİMLİĞİ DOĞRULANMIŞ KUTU.
     *
     * Buraya müşterinin adresini yazmak (görünüşte pratik) SPF/DKIM'i
     * düşürür: alan adı bizim sunucumuzun onun adına posta atmasına izin
     * vermez, mesaj spam'e ya da doğrudan çöpe gider. Müşterinin adı
     * görünen isimde durur, adresi ise Reply-To'da.
     */
    from: { name: `${enquiry.name} (website enquiry)`, address: config.user },
    to: process.env.ENQUIRY_TO?.trim() || contact.email,
    /** "Yanıtla" doğrudan müşteriye gitsin — kopyala/yapıştır yok. */
    replyTo: { name: enquiry.name, address: enquiry.email },
    subject,
    text: renderText(enquiry),
    html: renderHtml(enquiry),
  });
}
