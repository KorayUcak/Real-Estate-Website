"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  clearAnalyticsCookies,
  CONSENT_KEY,
  parseConsent,
  serialiseConsent,
  type ConsentStatus,
} from "@/lib/consent";

/**
 * RIZA DURUMU — sitenin tamamının tek kaynağı.
 *
 * `locale-provider` ile birebir aynı kalıp: localStorage harici bir sistem,
 * React'e `useSyncExternalStore` ile bağlanıyor. Gerekçeler orada uzun uzun
 * yazılı; buradaki tek fark neyin saklandığı.
 *
 * ⚠️ SNAPSHOT PRİMİTİF: `getSnapshot` HAM DİZEYİ dönüyor, çözümlenmiş
 * nesneyi değil. Her çağrıda yeni bir `{ status, version }` nesnesi
 * dönseydi React onu Object.is ile karşılaştırıp her seferinde "değişti"
 * sayar ve sonsuz render döngüsüne girerdi.
 */

type ConsentContextValue = {
  status: ConsentStatus;
  /** Analitik yüklenebilir mi — tek okuma noktası. */
  analyticsAllowed: boolean;
  /** Banner görünür mü (henüz seçim yok, ya da kullanıcı yeniden açtı). */
  bannerOpen: boolean;
  acceptAll: () => void;
  essentialOnly: () => void;
  /** Footer'daki "Cookie settings" bağlantısı — rızayı geri almanın yolu. */
  reopen: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  /* Sekmeler arası: bir sekmede reddeden kullanıcı için diğer sekmede de
     analitik durmalı. */
  window.addEventListener("storage", onStoreChange);

  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getSnapshot(): string | null {
  return window.localStorage.getItem(CONSENT_KEY);
}

/**
 * SUNUCUDA DAİMA `null` — yani "rıza yok".
 *
 * Bu, güvenli tarafa düşen varsayılan: sunucuda üretilen HTML hiçbir
 * koşulda analitik script'i İÇERMEZ. Rızası olan kullanıcıda script,
 * hydration'dan sonra istemcide ekleniyor.
 *
 * Banner'ın kendisi de sunucu HTML'inde YOK. Bilinçli: rızasını çoktan
 * vermiş bir ziyaretçiye her sayfa yüklemesinde bir kare boyunca banner
 * göstermek (sonra kaybolan) kötü bir deneyim olurdu.
 */
const getServerSnapshot = (): string | null => null;

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const status = useMemo(() => parseConsent(raw), [raw]);

  /**
   * Kullanıcı footer'dan yeniden açtı mı.
   *
   * Durumdan TÜRETİLEMEZ: seçim yapılmış olsa bile banner açık olabilir
   * (fikrini değiştirmek isteyen kullanıcı). Bu yüzden ayrı bir bayrak.
   */
  const [reopened, setReopened] = useState(false);

  const write = useCallback(
    (next: "accepted" | "essential") => {
      window.localStorage.setItem(CONSENT_KEY, serialiseConsent(next));
      setReopened(false);
      emit();
    },
    [],
  );

  const acceptAll = useCallback(() => write("accepted"), [write]);

  const essentialOnly = useCallback(() => {
    /*
      GERİ ÇEKME YOLU. Kullanıcı önce "Accept all" deyip sonra fikrini
      değiştirmiş olabilir; o durumda Clarity çoktan yüklenmiştir.
      Bileşeni ağaçtan çıkarmak yüklenmiş script'i geri almaz — çerezleri
      silip sayfayı yeniden yüklemek gerekir (gerekçe lib/consent.ts).

      Sıra önemli: önce KARARI yaz, sonra temizle, en son yeniden yükle.
      Yeniden yükleme kararın yazılmasından önce olsaydı seçim kaybolurdu.
    */
    const hadAnalytics = status === "accepted";
    write("essential");

    if (hadAnalytics) {
      clearAnalyticsCookies();
      window.location.reload();
    }
  }, [status, write]);

  const reopen = useCallback(() => setReopened(true), []);

  const value = useMemo<ConsentContextValue>(
    () => ({
      status,
      analyticsAllowed: status === "accepted",
      bannerOpen: status === "unset" || reopened,
      acceptAll,
      essentialOnly,
      reopen,
    }),
    [status, reopened, acceptAll, essentialOnly, reopen],
  );

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  );
}

export function useConsent(): ConsentContextValue {
  const context = useContext(ConsentContext);

  /*
    Sessizce "rıza var" varsayımına düşmek felaket olurdu: sağlayıcı
    unutulduğunda site ÇALIŞIR ama izleme rızasız akar. Erken ve gürültülü
    patlamak, sessizce ihlal etmekten iyidir.
  */
  if (!context) {
    throw new Error("useConsent must be used inside <ConsentProvider>.");
  }

  return context;
}
