import { LocaleLink as Link } from "@/components/locale-link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { getSettings, whatsappHref } from "@/lib/settings";
import { getT } from "@/lib/i18n/server";

/**
 * Yazı içine ve sonuna yerleştirilen dönüşüm bandı.
 *
 * Okuma akışını kesen bir reklam değil, akışın parçası gibi görünen bir
 * davet olmalı — bu yüzden makale genişliğinde durur ve tipografisi
 * sayfanın geri kalanıyla aynıdır. `<aside>` kullanılıyor: içerik ana
 * metnin parçası değil, ona eşlik eden bir öğe.
 */
export async function InlineCta({
  /*
    VARSAYILANLAR ARTIK BURADA DEĞİL, GÖVDEDE.
    Parametre varsayılanı olarak yazılsalardı İngilizce sabitler olurdu ve
    `t()` bu noktada henüz çözülmemiş oluyor (bileşen async).
  */
  title,
  text,
  ctaLabel,
  ctaHref = "/contact",
  whatsappMessage,
  tone = "sea-deep",
}: {
  title?: string;
  text?: string;
  ctaLabel?: string;
  ctaHref?: string;
  whatsappMessage?: string;
  /** "sea-deep": koyu, dikkat çeken. "soft": açık, metne daha yakın duran. */
  tone?: "sea-deep" | "soft";
}) {
  const t = await getT();

  const heading = title ?? t("panel.lookingFor");
  const body = text ?? t("blog.listCtaText");
  const label = ctaLabel ?? t("properties.register");
  const waMessage = whatsappMessage ?? t("blog.listCtaWhatsapp");

  const settings = await getSettings();

  const isNavy = tone === "sea-deep";

  return (
    <aside
      aria-label="Enquiry"
      className={
        isNavy
          ? "not-prose my-16 bg-sea-deep px-8 py-12 text-shell sm:px-12"
          : "not-prose my-16 border border-line bg-shell-deep px-8 py-12 sm:px-12"
      }
    >
      <p
        className={`font-display text-2xl leading-snug sm:text-3xl ${
          isNavy ? "text-shell" : "text-sea-deep"
        }`}
      >
        {heading}
      </p>
      <p
        className={`mt-5 max-w-xl leading-relaxed ${
          isNavy ? "text-shell/80" : "text-ink-70"
        }`}
      >
        {body}
      </p>

      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <Link
          href={ctaHref}
          className={`inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-medium transition-colors ${
            isNavy
              ? "bg-shell text-sea-deep hover:bg-white"
              : "bg-sea-deep text-shell hover:bg-sea"
          }`}
        >
          {label}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>

        <a
          href={whatsappHref(settings.contact.whatsappNumber, waMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center justify-center gap-2 border px-7 py-3.5 text-sm font-medium transition-colors ${
            isNavy
              ? "border-shell/40 text-shell hover:bg-shell/10"
              : "border-line text-sea-deep hover:bg-shell"
          }`}
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          {t("panel.whatsappUs")}
        </a>
      </div>
    </aside>
  );
}
