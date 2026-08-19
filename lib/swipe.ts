import type { PointerEvent as ReactPointerEvent } from "react";

/**
 * Dokunmatik kaydırma (swipe) — pointer olaylarıyla, kütüphanesiz.
 *
 * NEDEN EMBLA DEĞİL: embla bir KAYDIRMA KABI kurar; slaytları yan yana
 * dizip şeridi hareket ettirir. Hem hero'nun çapraz geçişi (cross-fade)
 * hem de lightbox'ın tek-görsel düzeni için yanlış model — ikisinde de
 * ekranda tek bir görsel var ve aralarındaki geçiş opaklıkla yapılıyor.
 * Sırf parmak hareketini yakalamak için bir karusel motoru kurmak,
 * çözdüğünden fazla kısıt getirir.
 *
 * NEDEN `touchstart`/`touchend` DEĞİL: pointer olayları fare, dokunmatik
 * ve kalemi tek API'de birleştirir; masaüstünde fareyle sürükleme de
 * bedavaya çalışır.
 *
 * EŞİK 48px: 30px denendi, dikey kaydırma sırasındaki doğal parmak sapması
 * yanlışlıkla slayt değiştiriyordu. Dikey baskınlık kontrolü de bu yüzden
 * var — hareket daha çok yukarı/aşağıysa bu bir sayfa kaydırmasıdır,
 * slayt geçişi değil.
 */
const THRESHOLD = 48;

export function swipeHandlers(onPrev: () => void, onNext: () => void) {
  let startX = 0;
  let startY = 0;
  let tracking = false;

  return {
    onPointerDown: (event: ReactPointerEvent) => {
      /* Fareyle yalnızca sol tuş sürükler; sağ tık/orta tık sayılmaz. */
      if (event.pointerType === "mouse" && event.button !== 0) return;
      startX = event.clientX;
      startY = event.clientY;
      tracking = true;
    },
    onPointerUp: (event: ReactPointerEvent) => {
      if (!tracking) return;
      tracking = false;

      const dx = event.clientX - startX;
      const dy = event.clientY - startY;

      if (Math.abs(dx) < THRESHOLD) return;
      /* Dikey hareket baskınsa kullanıcı sayfayı kaydırıyor demektir. */
      if (Math.abs(dy) > Math.abs(dx)) return;

      if (dx > 0) onPrev();
      else onNext();
    },
    onPointerCancel: () => {
      tracking = false;
    },
  };
}
