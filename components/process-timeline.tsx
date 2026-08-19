import type { ProcessStep } from "@/lib/process";

/**
 * Dikey zaman çizelgesi — alım ve satım rehberlerinin ortak omurgası.
 *
 * Neden <ol>: adımların SIRASI anlamın kendisidir. Ekran okuyucuya
 * "8 öğeli sıralı liste" bilgisini vermek, aynı görünümü <div> yığınıyla
 * elde etmekten hem erişilebilirlik hem de HowTo schema'sı açısından üstündür.
 *
 * Bağlantı çizgisi ::before yerine mutlak konumlu tek bir öğe ile çizilir ve
 * son adımda yarıda kesilir; böylece çizgi "devam ediyor" hissi vermez.
 */
export function ProcessTimeline({ steps }: { steps: ProcessStep[] }) {
  return (
    <ol className="relative">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const number = String(index + 1).padStart(2, "0");

        return (
          <li
            key={step.id}
            id={`step-${index + 1}`}
            /* scroll-mt: sticky header'ın altına gizlenmeden çapaya inmek için */
            className="relative scroll-mt-28 pb-10 sm:pb-16 pl-16 last:pb-0 sm:pl-24"
          >
            {/* Dikey bağlantı çizgisi — son adımda çizilmez. */}
            {!isLast ? (
              <span
                aria-hidden="true"
                className="absolute left-[1.4375rem] top-14 h-[calc(100%-2.5rem)] w-px bg-line sm:left-[1.9375rem]"
              />
            ) : null}

            {/* Numaralı düğüm */}
            <span
              aria-hidden="true"
              className="absolute left-0 top-0 inline-flex size-12 items-center justify-center border border-line bg-shell font-display text-sm text-sea-deep sm:size-16 sm:text-base"
            >
              {number}
            </span>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
              <h3 className="font-display text-2xl leading-tight text-sea-deep sm:text-3xl">
                {step.title}
              </h3>
              <p className="eyebrow shrink-0 text-sea">{step.timing}</p>
            </div>

            <p className="mt-4 sm:mt-5 max-w-2xl text-lg leading-relaxed text-ink-70">
              {step.summary}
            </p>

            <ul className="mt-5 sm:mt-8 max-w-2xl space-y-4">
              {step.detail.map((line) => (
                <li
                  key={line}
                  className="flex gap-4 text-sm leading-relaxed text-ink-70"
                >
                  <span
                    aria-hidden="true"
                    className="mt-2 size-1.5 shrink-0 bg-sea"
                  />
                  {line}
                </li>
              ))}
            </ul>

            <p className="mt-5 sm:mt-8 inline-flex items-center gap-3 border-t border-line pt-5 text-xs uppercase tracking-widest text-ink-40">
              <step.icon className="size-4 text-sea" aria-hidden="true" />
              {step.owner}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
