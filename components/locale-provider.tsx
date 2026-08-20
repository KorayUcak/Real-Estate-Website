"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import {
  CURRENCIES,
  formatPrice,
  type CurrencyCode,
  type Rates,
} from "@/lib/currency";
import { LANGUAGE_META, type LanguageCode } from "@/lib/locale";

/**
 * DİL + PARA BİRİMİ DURUMU — artık İKİ FARKLI KAYNAKTAN.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DİL       → URL'den gelir (`app/[lang]/`), sunucudan prop olarak iner.
 * PARA BİRİMİ → localStorage'da kalır.
 *
 * NEDEN AYRIŞTILAR. Önceden ikisi de localStorage'daydı ve bu doğruydu:
 * çeviri yoktu, dil yalnızca bir arayüz tercihiydi. Rota tabanlı i18n ile
 * dil artık SAYFANIN KİMLİĞİ — /tr/properties ile /properties iki ayrı
 * belge, iki ayrı canonical, iki ayrı hreflang girdisi. Böyle bir şey
 * tarayıcı depolamasında tutulamaz: Google localStorage okumaz.
 *
 * Para birimi ise gerçekten bir tercih olmaya devam ediyor. URL'e yazmak
 * (/tr/eur/properties) her sayfayı dört katına çıkarır ve dördü de aynı
 * metni taşıyan yinelenen içerik olurdu. Fiyat, çevrilmiş bir metin değil
 * biçimlendirilmiş bir sayı — istemcide kalması doğru.
 *
 * Yani: DİL sunucuda çözülür ve HTML'e girer, PARA BİRİMİ istemcide.
 * ─────────────────────────────────────────────────────────────────────────
 */

type LocaleContextValue = {
  language: LanguageCode;
  currency: CurrencyCode;
  rates: Rates;
  /** Yalnızca para birimi — dil değişimi bir GEZİNMEDİR (bkz. locale-switcher). */
  setCurrency: (currency: CurrencyCode) => void;
  /** GBP tutarı alır, seçili para biriminde biçimlenmiş string döner. */
  format: (gbpAmount: number) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

const CURRENCY_KEY = "c2c:currency";

/**
 * localStorage harici bir sistemdir; React'e useSyncExternalStore ile bağlanır.
 * Bunun useState + useEffect'e üstünlüğü:
 *  - Sunucu anlık görüntüsü ile istemci ilk render'ı çelişmez → hydration hatası yok.
 *  - Sekmeler arası senkron çalışır (storage olayı).
 *  - Effect içinde setState çağrılmadığı için ekstra render turu oluşmaz.
 *
 * ⚠️ Snapshot PRİMİTİF dönmek zorunda: her çağrıda yeni bir nesne dönseydi
 * React onu Object.is ile "değişmiş" sayar ve sonsuz döngüye girerdi.
 */
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getStoredCurrency(): string | null {
  return window.localStorage.getItem(CURRENCY_KEY);
}

/**
 * Sunucuda saklanan değer YOKTUR — HTML daima dilin varsayılan para
 * biriminde üretilir. Yani /tr sayfası taranırken fiyatlar ₺, /properties
 * taranırken £ görünür: her dil kendi pazarının parasıyla indekslenir.
 */
const getServerCurrency = (): string | null => null;

export function LocaleProvider({
  children,
  language,
  rates,
}: {
  children: React.ReactNode;
  /** Rotadan çözülen dil — `app/[lang]/(site)/layout.tsx` geçiriyor. */
  language: LanguageCode;
  /** Sunucuda çözülen GBP tabanlı kurlar — istemcide ekstra istek yapılmaz. */
  rates: Rates;
}) {
  const stored = useSyncExternalStore(
    subscribe,
    getStoredCurrency,
    getServerCurrency,
  );

  /**
   * Saklanan değer yoksa DİLİN parası devreye girer: Türkçe sayfaya gelen
   * kullanıcı ₺ görür, hiçbir şey seçmeden. Açıkça bir para birimi seçmişse
   * o kazanır — dil değiştirmek, kullanıcının bilinçli tercihini ezmemeli.
   */
  const currency = useMemo<CurrencyCode>(() => {
    if (stored && CURRENCIES.includes(stored as CurrencyCode)) {
      return stored as CurrencyCode;
    }
    return LANGUAGE_META[language].currency;
  }, [stored, language]);

  const setCurrency = useCallback((next: CurrencyCode) => {
    window.localStorage.setItem(CURRENCY_KEY, next);
    emit();
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      language,
      currency,
      rates,
      setCurrency,
      format: (gbpAmount: number) => formatPrice(gbpAmount, currency, rates),
    }),
    [language, currency, rates, setCurrency],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used inside <LocaleProvider>.");
  }

  return context;
}
