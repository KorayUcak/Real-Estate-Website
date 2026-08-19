"use client";

import { useLocale } from "@/components/locale-provider";
import { formatPrice } from "@/lib/currency";

/**
 * Fiyat gösterimi. GBP dışında bir para birimi seçiliyken ekranda o birim
 * görünür ama makine tarafından okunan değer (<data value>) DAİMA kaynak GBP
 * tutarıdır — arama motorları ve Product schema ile ekranın çelişmemesi için.
 */
export function Price({
  gbp,
  className = "",
  showApproxNote = false,
}: {
  gbp: number;
  className?: string;
  showApproxNote?: boolean;
}) {
  const { currency, rates } = useLocale();

  /* GBP kaynak birimdir: çevrilmediği için "yaklaşık" notu da anlamsız. */
  const isConverted = currency !== "GBP";

  return (
    <span className={className}>
      <data value={gbp}>{formatPrice(gbp, currency, rates)}</data>
      {showApproxNote && isConverted ? (
        <span className="ml-2 text-xs font-normal text-ink-40">
          approx. — priced in {formatPrice(gbp, "GBP", rates)}
        </span>
      ) : null}
    </span>
  );
}
