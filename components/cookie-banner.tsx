"use client";

import { LocaleLink as Link } from "@/components/locale-link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Cookie } from "lucide-react";
import { useConsent } from "@/components/consent-provider";
import { useT } from "@/components/translation";

/**
 * ÇEREZ RIZASI BANNER'I.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * İKİ DÜĞME GÖRSEL OLARAK EŞİT — ve bu bir tasarım tercihi değil, kuralın
 * kendisi. ICO'nun en sık denetlediği kalıp şu: parlak dolu bir "Accept
 * all" düğmesinin yanında soluk, ince, küçük bir "Reddet" bağlantısı.
 * Rızayı reddetmeyi kabul etmekten zorlaştıran her tasarım geçersiz rıza
 * üretir.
 *
 * Bu yüzden iki düğme: AYNI genişlikte (`flex-1`, `basis-0`), AYNI yükseklik
 * ve dolgu, AYNI punto, AYNI ağırlık. Fark yalnızca dolu/çerçeveli — ikisi
 * de markanın lacivertini taşıyor, biri diğerinin "ikincil" varyantı değil.
 *
 * ESCAPE İLE KAPANMIYOR ve "×" düğmesi YOK. Kapatmak bir seçim değildir;
 * seçim yapılmadan kapanabilen bir banner, "kapattı demek ki kabul etti"
 * varsayımına kapı açar. Banner hiçbir şeyi engellemiyor — sayfa altında
 * duran bir şerit, içerik tamamen kullanılabilir — dolayısıyla seçim
 * yapılana kadar durması kimseyi kilitlemiyor.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * KLAVYE SIRASI: bileşen layout'ta başlığın ÖNÜNE monte ediliyor (bkz.
 * `(site)/layout.tsx`). Ekranda altta duruyor çünkü `fixed`, ama DOM'da
 * erken olduğu için klavye kullanıcısı atlama bağlantısından sonra doğrudan
 * buraya geliyor. Odağı zorla ÇALMAK yerine (WCAG 3.2.1 açısından tartışmalı
 * ve her sayfa yüklemesinde rahatsız edici) sırayı doğru kurmak yeterli.
 */
export function CookieBanner() {
  const { bannerOpen, acceptAll, essentialOnly } = useConsent();
  const { t, tag } = useT();
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {bannerOpen ? (
        <motion.div
          /*
            `role="dialog"` + `aria-modal="false"`: ekran okuyucu bunu ayrı
            bir bölge olarak duyurur ama sayfanın geri kalanını gizlemez —
            gerçekten de engellemiyor. `aria-modal="true"` yazmak, olmayan
            bir kilidi beyan etmek olurdu.
          */
          role="dialog"
          aria-modal="false"
          aria-labelledby="consent-heading"
          aria-describedby="consent-body"
          lang={tag}
          initial={reduceMotion ? false : { y: "100%" }}
          animate={{ y: 0 }}
          exit={reduceMotion ? undefined : { y: "100%" }}
          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          /*
            z-[110]: başlık z-50, dil seçicinin paneli z-[100]. Rıza şeridi
            hepsinin üstünde kalmalı — altında kalırsa tıklanamaz görünür.
          */
          className="fixed inset-x-0 bottom-0 z-[110] border-t border-line bg-shell shadow-panel"
        >
          {/*
            `pb-[env(safe-area-inset-bottom)]` içeride, dolgunun üstüne
            EKLENİYOR: iPhone'un ana ekran çubuğu "Accept all" düğmesinin
            üstüne biniyordu. Çentiksiz cihazlarda değer 0, yani bedeli yok.
          */}
          <div className="container-page py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:py-8 sm:pb-[calc(2rem+env(safe-area-inset-bottom))]">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-10">
              <div className="flex min-w-0 flex-1 items-start gap-4">
                <Cookie
                  className="mt-0.5 hidden size-5 shrink-0 text-sea sm:block"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <h2
                    id="consent-heading"
                    className="font-display text-lg text-sea-deep"
                  >
                    {t("consent.heading")}
                  </h2>
                  <p
                    id="consent-body"
                    className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-70"
                  >
                    {t("consent.body")}
                  </p>
                  <Link
                    href="/privacy-policy"
                    className="mt-3 inline-block text-sm text-sea underline underline-offset-4 transition-colors hover:text-sea-deep"
                  >
                    {t("consent.privacyLink")}
                  </Link>
                </div>
              </div>

              {/*
                `basis-0 flex-1` her iki düğmede: içerikleri farklı
                uzunlukta olmasına rağmen ("Accept all" / "Essential only",
                Rusçada çok daha uzun) genişlikleri BİREBİR eşit kalıyor.
                `w-full` + `sm:w-auto` olsaydı daha uzun etiket daha geniş
                düğme üretir, yani daha "önemli" görünürdü.
              */}
              <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:w-[26rem]">
                <button
                  type="button"
                  onClick={essentialOnly}
                  className="basis-0 border border-sea-deep px-6 py-3.5 text-center text-sm font-medium text-sea-deep transition-colors hover:bg-sea-deep hover:text-shell sm:flex-1"
                >
                  {t("consent.essentialOnly")}
                </button>
                <button
                  type="button"
                  onClick={acceptAll}
                  className="basis-0 border border-sea-deep bg-sea-deep px-6 py-3.5 text-center text-sm font-medium text-shell transition-colors hover:border-sea hover:bg-sea sm:flex-1"
                >
                  {t("consent.acceptAll")}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/**
 * Footer'daki "Cookie settings" — rızayı GERİ ALMANIN yolu.
 *
 * Zorunlu: UK GDPR altında rızayı geri çekmek, vermek kadar kolay olmalı.
 * Banner bir kez kapanıp bir daha erişilemeseydi, fikrini değiştiren
 * kullanıcının tek çaresi tarayıcı ayarlarını kurcalamak olurdu — ve bu,
 * "kadar kolay" ölçütünü karşılamaz.
 *
 * `<button>`, `<a>` değil: bir yere gitmiyor, sayfadaki bir paneli açıyor.
 */
export function CookieSettingsButton({ className }: { className?: string }) {
  const { reopen } = useConsent();
  const { t } = useT();

  return (
    <button type="button" onClick={reopen} className={className}>
      {t("consent.settingsLink")}
    </button>
  );
}
