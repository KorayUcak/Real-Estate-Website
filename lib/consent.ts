/**
 * ÇEREZ RIZASI — durum, saklama ve süre.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * KURAL (UK PECR reg. 6 + UK GDPR):
 *
 *   1. ÖNCE RIZA. Kesinlikle gerekli olmayan hiçbir depolama, kullanıcı
 *      açıkça seçmeden önce YAZILAMAZ ve hiçbir üçüncü taraf script'i
 *      yüklenemez. "Sayfayı kaydırmak rıza sayılır" geçersizdir.
 *   2. REDDETMEK KABUL ETMEK KADAR KOLAY OLMALI. ICO bunu açıkça
 *      denetliyor: iki seçenek aynı düzeyde, aynı tıklama sayısında ve
 *      görsel olarak eşit ağırlıkta olmalı. "Kabul et" düğmesinin yanına
 *      soluk bir "ayarlar" bağlantısı koymak ihlaldir.
 *   3. GERİ ALMAK VERMEK KADAR KOLAY OLMALI. Bu yüzden footer'da kalıcı
 *      bir "Cookie settings" bağlantısı var — banner bir kez kapanıp
 *      kaybolmuyor.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * NEDEN localStorage, NEDEN ÇEREZ DEĞİL: rıza kaydının kendisi "kesinlikle
 * gerekli" istisnasına girer, yani her iki biçim de serbest. localStorage
 * seçildi çünkü sunucuya HİÇ gönderilmiyor — bir çerez her istekte başlıkta
 * taşınırdı ve statik sayfalarda gereksiz bir varyans kaynağı olurdu. Site
 * dil/para birimi tercihini zaten aynı biçimde tutuyor (locale-provider).
 */

export const CONSENT_KEY = "c2c:consent";

/**
 * RIZA SÜRÜMÜ.
 *
 * Hangi amaçlar için rıza istediğimiz değiştiğinde (yeni bir analitik
 * aracı, yeni bir üçüncü taraf) bu sayı ARTIRILIR ve herkese yeniden
 * sorulur. Eski rıza yeni bir amacı kapsamaz; sürümü sabit bırakmak,
 * kullanıcının onaylamadığı bir şeyi onaylamış saymak olurdu.
 */
export const CONSENT_VERSION = 1;

/**
 * Rızanın yeniden sorulma aralığı — 182 gün (~6 ay).
 *
 * PECR bir süre yazmıyor; ICO "makul aralıklarla yenileyin" diyor ve
 * sektör pratiği 6-12 ay. Alt sınıra yakın durmak, denetimde savunması
 * kolay olan taraf.
 */
export const CONSENT_MAX_AGE_DAYS = 182;

/** `unset` = henüz seçim yapılmadı. Rıza YOK demektir — varsayılan ret. */
export type ConsentStatus = "unset" | "accepted" | "essential";

export type ConsentRecord = {
  status: Exclude<ConsentStatus, "unset">;
  version: number;
  /** ISO 8601 — süre kontrolü ve hesap verebilirlik kaydı için. */
  at: string;
};

function isRecord(value: unknown): value is ConsentRecord {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Partial<ConsentRecord>;

  return (
    (record.status === "accepted" || record.status === "essential") &&
    typeof record.version === "number" &&
    typeof record.at === "string"
  );
}

/**
 * Ham localStorage dizesini karara çevirir.
 *
 * Dize alıyor, `localStorage`a kendisi bakmıyor: `useSyncExternalStore`
 * anlık görüntüsü PRİMİTİF dönmek zorunda (gerekçe locale-provider'da) ve
 * sağlayıcı ham dizeyi snapshot olarak tutup çözümlemeyi buraya devrediyor.
 *
 * Bozuk JSON, eski sürüm veya süresi geçmiş kayıt → `unset`. Üçünde de
 * doğru davranış aynı: yeniden sor, bu arada hiçbir şey yükleme.
 */
export function parseConsent(raw: string | null): ConsentStatus {
  if (!raw) return "unset";

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return "unset";
  }

  if (!isRecord(parsed)) return "unset";
  if (parsed.version !== CONSENT_VERSION) return "unset";

  const at = Date.parse(parsed.at);
  if (Number.isNaN(at)) return "unset";

  const ageDays = (Date.now() - at) / 86_400_000;
  if (ageDays > CONSENT_MAX_AGE_DAYS) return "unset";

  return parsed.status;
}

export function serialiseConsent(
  status: Exclude<ConsentStatus, "unset">,
): string {
  return JSON.stringify({
    status,
    version: CONSENT_VERSION,
    at: new Date().toISOString(),
  } satisfies ConsentRecord);
}

/**
 * Clarity'nin BIRAKTIKLARINI siler.
 *
 * ⚠️ BU ADIM ATLANIRSA GERİ ÇEKME SAHTE OLUR. `<Script>` bileşenini
 * kaldırmak yalnızca React ağacından çıkarır: clarity.ms'ten inen kod
 * zaten çalışmış, `window.clarity` yerinde durur ve BIRAKTIĞI ÇEREZLER
 * silinmez. Kullanıcı "vazgeçtim" der, tarayıcısında izleyici çerezi
 * durmaya devam eder — teknik olarak ihlalin sürmesi.
 *
 * Bu yüzden geri çekme iki adım: çerezleri sil, sonra sayfayı yeniden
 * yükle (yüklenmiş script'i bellekten atmanın tek güvenilir yolu).
 *
 * Not: `clarity.ms` ve `c.bing.com` alan adlarındaki ÜÇÜNCÜ TARAF çerezler
 * (CLID, MUID) bizim alan adımızdan silinemez — tarayıcının kendi çerez
 * ayarları dışında bunlara erişimimiz yok. Gizlilik metni bu yüzden
 * Microsoft'un kendi politikasına yönlendiriyor.
 */
export const ANALYTICS_COOKIES = [
  "_clck",
  "_clsk",
  "CLID",
  "ANONCHK",
  "MR",
  "MUID",
  "SM",
] as const;

export function clearAnalyticsCookies(): void {
  const { hostname } = window.location;

  /* Çerez ana alan adına yazılmış olabilir: hem tam host hem de nokta
     önekli üst alan adı için silme denenir. Yanlış alan adına yazılan bir
     silme isteği sessizce yok sayılır, yani fazladan denemenin zararı yok. */
  const domains = [
    undefined,
    hostname,
    `.${hostname}`,
    `.${hostname.split(".").slice(-2).join(".")}`,
  ];

  for (const name of ANALYTICS_COOKIES) {
    for (const domain of domains) {
      document.cookie = [
        `${name}=`,
        "expires=Thu, 01 Jan 1970 00:00:00 GMT",
        "path=/",
        ...(domain ? [`domain=${domain}`] : []),
      ].join("; ");
    }
  }
}
