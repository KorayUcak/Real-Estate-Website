"use client";

import { useCallback, useMemo } from "react";
import { useLocale } from "@/components/locale-provider";
import { LANGUAGE_META } from "@/lib/locale";
import {
  DICTIONARIES,
  translate,
  translateNavDescription,
  translateNavLabel,
  type TranslationKey,
  type TranslationVars,
} from "@/lib/i18n";

/**
 * ÇEVİRİNİN ARAYÜZ TARAFI.
 *
 * Dil durumu zaten `locale-provider` içinde — bu dosya YENİ BİR SAĞLAYICI
 * KURMUYOR. İkinci bir bağlam açmak, dil ve para biriminin tek karar olduğu
 * gerçeğini ikiye bölerdi: iki sağlayıcı, iki güncelleme, arada bir kare
 * boyunca yeni dil + eski para birimi.
 *
 * `useT()` yalnızca `useLocale().language` üstüne oturan ince bir sarmalayıcı.
 */
export function useT() {
  const { language } = useLocale();

  const t = useCallback(
    (key: TranslationKey, vars?: TranslationVars) =>
      translate(language, key, vars),
    [language],
  );

  const tNav = useCallback(
    (label: string) => translateNavLabel(language, label),
    [language],
  );

  const tNavDescription = useCallback(
    (href: string, fallback: string) =>
      translateNavDescription(language, href, fallback),
    [language],
  );

  return useMemo(
    () => ({
      t,
      tNav,
      tNavDescription,
      language,
      /** BCP 47 etiketi — çevrilmiş bölgelerdeki `lang` niteliği için. */
      tag: LANGUAGE_META[language].tag,
      /**
       * Ana sayfa hero slaytlarının alt metni.
       *
       * Dizi olduğu için `t()` ile okunamıyor (dizi alanları anahtar
       * birleşiminin dışında — bkz. lib/i18n/index.ts). Sözlükte karşılığı
       * yoksa kaynaktaki İngilizce alt korunuyor: eksik bir alt metin, boş
       * bir alt metinden iyidir.
       */
      slideAlt: (index: number, fallback: string) => {
        const slides = DICTIONARIES[language]?.imagery.slides as
          | string[]
          | undefined;
        return slides?.[index] ?? fallback;
      },
    }),
    [t, tNav, tNavDescription, language],
  );
}

/**
 * SUNUCU BİLEŞENLERİ İÇİN ÇEVİRİ.
 *
 * Sayfaların çoğu sunucu bileşeni (iletişim sayfası, footer) ve hook
 * çağıramaz. Tüm dosyayı `"use client"` yapmak bedeli ağır bir çözüm:
 * footer, sırf başlıkları çevrilsin diye JS bundle'a girerdi — oysa içindeki
 * ~40 dahili bağlantının hiçbirinin istemcide işi yok.
 *
 * Bunun yerine çeviri, metnin kendisi kadar küçük bir istemci adasına
 * indiriliyor. Sunucu bileşeni yapısını ve bağlantılarını sunucuda üretmeye
 * devam eder; yalnızca ÇEVRİLEN dizeler istemcide çözülür.
 *
 * `<span>` yok, düz metin dönüyor: bir <ul> ya da <p> içine ekstra eleman
 * sokmak, sarılma ve `text-overflow` gibi davranışları sessizce değiştirir.
 */
export function T({
  k,
  vars,
}: {
  k: TranslationKey;
  vars?: TranslationVars;
}) {
  const { t } = useT();
  return <>{t(k, vars)}</>;
}

/**
 * Gezinme etiketi — sunucu bileşenlerinden kullanılan `<T>` karşılığı.
 *
 * Ayrı bir bileşen, çünkü anahtar noktalı bir yol değil ETİKETİN KENDİSİ
 * (gerekçe lib/i18n/index.ts içinde) ve sözlükte karşılığı yoksa İngilizce
 * etiket aynen basılıyor.
 */
export function NavLabel({ label }: { label: string }) {
  const { tNav } = useT();
  return <>{tNav(label)}</>;
}

/**
 * `aria-label`i ÇEVRİLİ bir `<nav>` yer işareti.
 *
 * Yer işareti etiketleri ekranda görünmez ama ekran okuyucu kullanıcısının
 * sayfayı gezme biçimidir — "Footer", "Areas we cover" listesi. Türkçe bir
 * arayüzde bunların İngilizce kalması, tam da bu kullanıcı için çeviriyi
 * yarım bırakmak olurdu.
 *
 * `children` sunucudan PROP olarak geliyor: içerideki onlarca <Link> sunucuda
 * render edilmeye devam eder, istemciye yalnızca bu ince kabuk iner.
 */
export function TranslatedNav({
  labelKey,
  className,
  children,
}: {
  labelKey: TranslationKey;
  className?: string;
  children: React.ReactNode;
}) {
  const { t } = useT();

  return (
    <nav aria-label={t(labelKey)} className={className}>
      {children}
    </nav>
  );
}

/**
 * ÇEVRİLMİŞ BÖLGE İŞARETİ — `lang` niteliği.
 *
 * ⚠️ NEDEN `<html lang>` DEĞİL. Site şu an KISMEN çevrili: gezinme, formlar
 * ve arayüz etiketleri üç dilde, sayfaların uzun metinleri hâlâ İngilizce.
 * Bu durumda `documentElement.lang = "tr"` yazmak, ekran okuyucuya İngilizce
 * paragrafları Türkçe telaffuz kurallarıyla okutur — lib/locale.ts'in en
 * baştan uyardığı hata.
 *
 * Doğru olan, HTML'in tam olarak bunun için tanımladığı davranış: `lang`
 * dilin gerçekten değiştiği DÜĞÜMDE durur ve alta miras kalır. Başlık,
 * footer ve form çevrildiği için işareti onlar taşıyor; gövde metni
 * İngilizce kaldığı için belge dili İngilizce kalıyor.
 *
 * `display: contents` — sarmalayıcı yerleşimde YOK. Bir `<div>` eklemek
 * footer'ın grid'ini ve header'ın sticky yığınını bozardı; `contents`
 * kutusunu kaldırır, `lang` mirası ise DOM ağacından geldiği için etkilenmez.
 *
 * Sayfa metinleri çevrildiği gün: bu sarmalayıcılar kalkar, `lang` kök
 * <html> düğümüne çıkar.
 */
export function TranslatedRegion({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { tag } = useT();

  return (
    <div lang={tag} className={className ?? "contents"}>
      {children}
    </div>
  );
}
