"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  CURRENCIES,
  formatPrice,
  type CurrencyCode,
  type Rates,
} from "@/lib/currency";
import {
  DEFAULT_CURRENCY,
  DEFAULT_LANGUAGE,
  isLanguage,
  type LanguageCode,
} from "@/lib/locale";

/**
 * DİL + PARA BİRİMİ DURUMU — tek seçim, iki ayrı saklanan eksen.
 *
 * Arayüzde artık TEK bir seçici var (bkz. locale-switcher) ve dört hazır
 * çiftten birini yazıyor. Buna rağmen durum tek bir "seçenek kimliği" olarak
 * DEĞİL, iki düz alan olarak saklanıyor:
 *
 *   - `language` çeviriyi/etiketleri, `currency` matematiği sürer. İkisini
 *     tek bir id'nin arkasına saklamak, her okuyanı önce o id'yi çözmeye
 *     zorlardı — `format()` para birimini doğrudan ister.
 *   - Çiftler listesi ürün kararıdır ve değişebilir (yarın "EN + USD"
 *     eklenebilir). Depolama biçimi bu karara bağlı kalmamalı; eski
 *     kombinasyonlar da geçerli durum olarak okunmaya devam eder
 *     (bkz. `matchLocalization`).
 *
 * Yani ekseni birlikte YAZIYORUZ, ayrı ayrı OKUYORUZ.
 */

type LocaleContextValue = {
  language: LanguageCode;
  currency: CurrencyCode;
  rates: Rates;
  /** Her iki ekseni TEK adımda yazar — başlıktaki seçicinin tek eylemi. */
  setLocalization: (language: LanguageCode, currency: CurrencyCode) => void;
  /** GBP tutarı alır, seçili para biriminde biçimlenmiş string döner. */
  format: (gbpAmount: number) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

const LANGUAGE_KEY = "c2c:lang";
const CURRENCY_KEY = "c2c:currency";

/**
 * localStorage harici bir sistemdir; React'e useSyncExternalStore ile bağlanır.
 * Bunun useState + useEffect'e üstünlüğü:
 *  - Sunucu anlık görüntüsü ile istemci ilk render'ı hiç çelişmez → hydration hatası yok.
 *  - Sekmeler arası senkron çalışır (storage olayı).
 *  - Effect içinde setState çağrılmadığı için ekstra render turu oluşmaz.
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

/**
 * ⚠️ İKİ AYRI ABONELİK, TEK NESNE DEĞİL.
 *
 * `getSnapshot` her çağrıldığında `{ language, currency }` gibi YENİ bir nesne
 * dönseydi React onu her seferinde değişmiş sayar ve sonsuz render döngüsüne
 * girerdi (useSyncExternalStore snapshot'ı Object.is ile karşılaştırır).
 * Bu yüzden her eksen kendi hook'unu kullanıyor ve daima bir PRİMİTİF dönüyor.
 */
function getLanguageSnapshot(): LanguageCode {
  const stored = window.localStorage.getItem(LANGUAGE_KEY);
  return isLanguage(stored) ? stored : DEFAULT_LANGUAGE;
}

function getCurrencySnapshot(): CurrencyCode {
  const stored = window.localStorage.getItem(CURRENCY_KEY);
  return CURRENCIES.includes(stored as CurrencyCode)
    ? (stored as CurrencyCode)
    : DEFAULT_CURRENCY;
}

/**
 * Sunucuda üretilen HTML daima EN + GBP gösterir — yani Google'ın taradığı
 * statik çıktıdaki fiyatlar her zaman KAYNAK para birimindedir.
 */
const getServerLanguageSnapshot = (): LanguageCode => DEFAULT_LANGUAGE;
const getServerCurrencySnapshot = (): CurrencyCode => DEFAULT_CURRENCY;

export function LocaleProvider({
  children,
  rates,
}: {
  children: React.ReactNode;
  /** Sunucuda çözülen GBP tabanlı kurlar — istemcide ekstra istek yapılmaz. */
  rates: Rates;
}) {
  const language = useSyncExternalStore(
    subscribe,
    getLanguageSnapshot,
    getServerLanguageSnapshot,
  );

  const currency = useSyncExternalStore(
    subscribe,
    getCurrencySnapshot,
    getServerCurrencySnapshot,
  );

  const setLocalization = useCallback(
    (nextLanguage: LanguageCode, nextCurrency: CurrencyCode) => {
      /*
        İki yazma, TEK emit: ikisini ayrı ayrı yayınlasaydık React arada bir
        kez daha render eder ve kullanıcı bir kare boyunca yeni dil + ESKİ para
        birimi kombinasyonunu görürdü.
      */
      window.localStorage.setItem(LANGUAGE_KEY, nextLanguage);
      window.localStorage.setItem(CURRENCY_KEY, nextCurrency);
      emit();
    },
    [],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({
      language,
      currency,
      rates,
      setLocalization,
      format: (gbpAmount: number) => formatPrice(gbpAmount, currency, rates),
    }),
    [language, currency, rates, setLocalization],
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
