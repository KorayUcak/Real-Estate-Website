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
      {/*
        MOBİL DİKEY BOŞLUK YARIYA İNDİ — ve eşik `sm:` DEĞİL `md:`.

        ⚠️ FARK ÖNEMLİ. Eski değer `py-16 sm:py-20` idi, yani 640px'te
        ZATEN büyüyordu; oysa 640–767px hâlâ telefon. Eşiği `md:`ye almak
        o aralığı da kompakt tarafta bırakıyor ve 768px ÜSTÜNDE hiçbir şey
        değişmiyor: orada eskiden `sm:py-20` geçerliydi, şimdi `md:py-20`
        — aynı değer. Aynı `sm:` → `md:` kaydırması bu bölümdeki tüm
        boşluklara uygulandı.
      */}
      <div className="container-page py-10 md:py-20 lg:py-24">
        <div className="grid gap-8 md:gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            {/*
              Footer'da yığılmış dizilim: burada yer kısıtı yok ve marka
              işaretinin tam hâli, sayfanın kapanışında imza gibi durur.
              `text-shell` ile logo metni açık renge döner — çatı rengi
              sabit, yazı `currentColor` üzerinden gelir.
            */}
            <Logo variant="stacked" className="h-20 w-auto text-shell md:h-28" />

            
            <p className="mt-4 max-w-sm text-sm leading-relaxed md:mt-6">
              <T k="footer.tagline" />
            </p>

            <ul className="mt-5 space-y-2.5 text-sm not-italic md:mt-8 md:space-y-3">
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

          {/*
            İKİ BAĞLANTI SÜTUNU MOBİLDE YAN YANA.

            ⚠️ SARMALAYICI `md:contents` TAŞIYOR — ve bütün numara bu.
            `display: contents` elemanı yerleşimden tamamen kaldırıyor,
            yani 768px üstünde iki `<nav>` yeniden DIŞ ızgaranın doğrudan
            çocuğu oluyor ve `lg:col-span-2` sınıfları eskisi gibi çalışıyor.
            Masaüstü düzeni bit bit aynı kalıyor; sarmalayıcı yalnızca
            mobilde var.

            Alternatif (dış ızgarayı `grid-cols-2` yapmak) marka sütununu
            ve bölge listesini de yarıya bölerdi — ikisi de tam genişlik
            istiyor.

            Not: sarmalayıcı anlamsız bir `<div>`; `display: contents`in
            eski tarayıcılardaki erişilebilirlik hatası semantik
            elemanlarda görülüyordu, burada risk yok.
          */}
          <div className="grid grid-cols-2 gap-8 md:contents">
          <TranslatedNav labelKey="footer.footerNavAria" className="lg:col-span-2">
            <h2 className="eyebrow text-gold">
              <T k="footer.exploreHeading" />
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm md:mt-7 md:space-y-3.5">
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
            <ul className="mt-4 space-y-2.5 text-sm md:mt-7 md:space-y-3.5">
              {guidesNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-shell/70 transition-colors hover:text-gold">
                    <NavLabel label={item.label} />
                  </Link>
                </li>
              ))}
            </ul>
          </TranslatedNav>
          </div>

          <TranslatedNav labelKey="footer.areasNavAria" className="lg:col-span-4">
            <h2 className="eyebrow text-gold">
              <T k="footer.areasHeading" />
            </h2>
            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm md:mt-7 md:gap-y-3.5">
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

          {/*
            HUKUKİ BAĞLANTILAR — çizginin ÜSTÜNDE, sağ uçta.

            Eskiden alt şeritteydi ve orada üç ayrı şeyle (telif, sosyal
            ikonlar, hukuki bağlantılar) yer paylaşıyordu; `justify-between`
            üçünü de kenarlara itince ortadaki grup rastgele bir yerde
            duruyordu. Yukarı alınınca alt şerit üç net sütuna kavuşuyor,
            bağlantılar da üstteki sütunlarla aynı sağ kenara hizalanıyor.

            `lg:col-span-12` + `lg:justify-end`: ızgaranın tam genişliğinde
            kendi satırı, içerik sağa yaslı. Dar ekranda ortalanıyor.
          */}
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs lg:col-span-12 lg:justify-end">
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

        {/*
          ALT ŞERİT — masaüstünde ÜÇ sütun, mobilde tek kolon.

          `sm:grid-cols-3` + `sm:justify-items-*`: telif solda, geliştirici
          kredisi TAM ORTADA, sosyal ikonlar sağda. `justify-between` ile
          yapılsaydı orta öğe gerçek merkezde durmazdı — yan öğelerin
          genişliği farklı olduğu için merkez kayardı. Izgara üç eşit sütun
          verdiği için orta sütunun merkezi = şeridin merkezi.

          Mobilde tek sütun, hepsi ortalı ve `gap-6` ile ayrık.
        */}
        {/*
          Alt şeridin `sm:grid-cols-3`ü KORUNDU: üç sütun zaten kompakt
          biçim, onu `md:`ye itmek 640–767px aralığını UZATIRDI. Yalnızca
          üstteki boşluk ve iç dolgu mobilde kısaldı.
        */}
        <div className="mt-10 grid gap-5 border-t border-shell/15 pt-6 text-center sm:grid-cols-3 sm:items-center sm:text-left md:mt-16 md:gap-6 md:pt-8">
          <p className="text-xs text-shell/50 sm:justify-self-start">
            <T k="footer.rights" vars={{ year, company: companyName }} />
          </p>

          {/*
            GELİŞTİRİCİ KREDİSİ.

            Bağlantı yalnızca ismi değil satırın tamamını sarıyor: "Koray
            Higgins" tek başına ~90px'lik bir dokunma hedefi, çevresindeki
            metinle birlikte ise rahat tıklanır. `rel="noopener noreferrer"`
            yeni sekmede açılan her dış bağlantıda zorunlu — `noopener`
            olmadan hedef sayfa `window.opener` üzerinden bu sayfaya
            erişebilir.
          */}
          <a
            href="https://www.linkedin.com/in/koray-u%C3%A7ak-higgins-b0b2b82b6/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-shell/60 underline-offset-4 transition-colors hover:text-shell hover:underline sm:justify-self-center"
          >
            <T k="footer.credit" vars={{ name: "Koray Higgins" }} />
          </a>

          {socialLinks.length > 0 ? (
            <ul className="flex items-center justify-center gap-4 sm:justify-self-end">
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
          ) : (
            /* Sosyal hesap yoksa sütun BOŞ kalmalı — yoksa ortadaki
               kredi sağa kayar ve merkez bozulur. */
            <span aria-hidden="true" />
          )}
        </div>
      </div>
    </footer>
    </TranslatedRegion>
  );
}
