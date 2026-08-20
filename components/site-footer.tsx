import { LocaleLink as Link } from "@/components/locale-link";
import { Mail, MapPin, Phone } from "lucide-react";
import { CookieSettingsButton } from "@/components/cookie-banner";
import { Logo } from "@/components/logo";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  XIcon,
} from "@/components/social-icons";
import {
  NavLabel,
  T,
  TranslatedNav,
  TranslatedRegion,
} from "@/components/translation";
import { isAreaVisibleInGuide } from "@/lib/turkey";
import { guidesNav, primaryNav, serviceAreas } from "@/lib/site";
import type { SiteSettings } from "@/lib/settings";

/**
 * Sunucu bileşeni — JS bundle'a hiç girmez.
 * Footer, bölge sayfalarına giden dahili linklerin ana dağıtım noktasıdır:
 * her sayfadan her bölgeye link vermek, tarama derinliğini 1 seviyede tutar.
 */
export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const year = new Date().getFullYear();
  const { contact, social, companyName } = settings;

  /* Boş bırakılan sosyal hesap ikonu HİÇ render edilmiyor — boş bir href
     kullanıcıyı ana sayfaya atar ve "hesap var" izlenimi verir. */
  const socialLinks = (
    [
      { key: "instagram", href: social.instagram, label: "Instagram", Icon: InstagramIcon },
      { key: "facebook", href: social.facebook, label: "Facebook", Icon: FacebookIcon },
      { key: "x", href: social.x, label: "X", Icon: XIcon },
      { key: "linkedin", href: social.linkedin, label: "LinkedIn", Icon: LinkedInIcon },
    ] as const
  ).filter((item) => item.href);

  return (
    <TranslatedRegion>
    <footer className="mt-auto bg-sea-deep text-shell/80">
      <div className="container-page py-16 sm:py-20 lg:py-24">
        <div className="grid gap-12 sm:gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            {/*
              Footer'da yığılmış dizilim: burada yer kısıtı yok ve marka
              işaretinin tam hâli, sayfanın kapanışında imza gibi durur.
              `text-shell` ile logo metni açık renge döner — çatı rengi
              sabit, yazı `currentColor` üzerinden gelir.
            */}
            <Logo variant="stacked" className="h-28 w-auto text-shell" />

            
            <p className="mt-6 max-w-sm text-sm leading-relaxed">
              <T k="footer.tagline" />
            </p>

            <ul className="mt-8 space-y-3 text-sm not-italic">
              <li>
                <a
                  href={`tel:${contact.phoneE164}`}
                  className="inline-flex items-center gap-3 hover:text-shell"
                >
                  <Phone className="size-4 shrink-0 text-gold" aria-hidden="true" />
                  {contact.phoneDisplay}
                </a>
              </li>
              {/*
                İKİNCİ HAT. Panelden boşaltılabildiği için iki alan da dolu
                değilse satır hiç basılmıyor — boş bir `tel:` bağlantısı
                tıklanabilir görünüp hiçbir yeri aramaz.

                İkon tekrarlanmıyor ama yeri `invisible` bir kopyayla
                korunuyor: iki numara aynı sol kenardan başlıyor, ekran
                okuyucu ise aynı simgeyi iki kez duyurmuyor.
              */}
              {contact.phoneSecondaryDisplay && contact.phoneSecondaryE164 ? (
                <li>
                  <a
                    href={`tel:${contact.phoneSecondaryE164}`}
                    className="inline-flex items-center gap-3 hover:text-shell"
                  >
                    <Phone className="size-4 shrink-0 invisible" aria-hidden="true" />
                    {contact.phoneSecondaryDisplay}
                  </a>
                </li>
              ) : null}
              <li>
                <a
                  href={`mailto:${contact.email}`}
                  className="inline-flex items-center gap-3 hover:text-shell"
                >
                  <Mail className="size-4 shrink-0 text-gold" aria-hidden="true" />
                  {contact.email}
                </a>
              </li>
              <li className="inline-flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
                <span>{contact.address.full}</span>
              </li>
            </ul>
          </div>

          <TranslatedNav labelKey="footer.footerNavAria" className="lg:col-span-2">
            <h2 className="eyebrow text-gold">
              <T k="footer.exploreHeading" />
            </h2>
            <ul className="mt-7 space-y-3.5 text-sm">
              {primaryNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-shell/70 transition-colors hover:text-gold">
                    <NavLabel label={item.label} />
                  </Link>
                </li>
              ))}
            </ul>
          </TranslatedNav>

          {/* Rehber sayfaları header'da değil — dahili linkleri buradan alıyorlar. */}
          <TranslatedNav labelKey="footer.guidesNavAria" className="lg:col-span-2">
            <h2 className="eyebrow text-gold">
              <T k="footer.guidesHeading" />
            </h2>
            <ul className="mt-7 space-y-3.5 text-sm">
              {guidesNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-shell/70 transition-colors hover:text-gold">
                    <NavLabel label={item.label} />
                  </Link>
                </li>
              ))}
            </ul>
          </TranslatedNav>

          <TranslatedNav labelKey="footer.areasNavAria" className="lg:col-span-4">
            <h2 className="eyebrow text-gold">
              <T k="footer.areasHeading" />
            </h2>
            <ul className="mt-7 grid grid-cols-2 gap-x-6 gap-y-3.5 text-sm">
              {/*
                Süzgeç ÖLÜ ÇAPA içindir, içeriği kısıtlamak için değil.
                Bu bağlantılar /about-turkey#area-<slug> adresine gidiyor;
                rehberden gizlenen dört bölgenin orada karşılığı yok, yani
                bağlantı sayfayı açar ama hiçbir yere kaydırmaz — kullanıcı
                için sessiz bir kırık bağlantı.
              */}
              {serviceAreas.filter((area) => isAreaVisibleInGuide(area.slug)).map((area) => (
                <li key={area.slug}>
                  <Link
                    href={`/about-turkey#area-${area.slug}`}
                    className="text-shell/70 transition-colors hover:text-gold"
                  >
                    {area.name}
                  </Link>
                </li>
              ))}
            </ul>
          </TranslatedNav>
        </div>

        <div className="mt-16 flex flex-col gap-6 border-t border-shell/15 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-shell/50">
            <T k="footer.rights" vars={{ year, company: companyName }} />
          </p>

          {socialLinks.length > 0 ? (
            <ul className="flex items-center gap-4">
              {socialLinks.map(({ key, href, label, Icon }) => (
                <li key={key}>
                  <a
                    href={href}
                    target="_blank"
                    rel="me noopener noreferrer"
                    aria-label={`${companyName} on ${label}`}
                    className="inline-flex size-10 items-center justify-center rounded-sm border border-shell/20 transition-colors hover:border-gold hover:text-gold"
                  >
                    <Icon className="size-4" />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}

          <ul className="flex gap-6 text-xs text-shell/50">
            <li>
              <Link href="/privacy-policy" className="text-shell/70 transition-colors hover:text-gold">
                <T k="footer.privacy" />
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-shell/70 transition-colors hover:text-gold">
                <T k="footer.terms" />
              </Link>
            </li>
            {/*
              RIZAYI GERİ ALMA YOLU — her sayfada. UK GDPR altında rızayı
              geri çekmek vermek kadar kolay olmalı; banner bir kez kapanıp
              erişilemez hâle gelseydi bu ölçüt karşılanmazdı.
            */}
            <li>
              <CookieSettingsButton className="text-shell/70 transition-colors hover:text-gold" />
            </li>
          </ul>
        </div>
      </div>
    </footer>
    </TranslatedRegion>
  );
}
