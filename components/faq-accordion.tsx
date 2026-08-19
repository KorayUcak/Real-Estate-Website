/**
 * <details>/<summary> tabanlı SSS. JavaScript gerektirmez ve cevap metni
 * HTML kaynağında her zaman bulunur — FAQPage schema'sının eşleşmesi için
 * içeriğin sayfada gerçekten var olması şart (JS ile sonradan enjekte edilen
 * cevaplar bu eşleşmeyi kaybettirir).
 *
 * `name` aynı olduğu için aynı anda tek bir soru açık kalır (native accordion).
 */
export function FaqAccordion({
  faqs,
  groupName,
}: {
  faqs: { question: string; answer: string }[];
  /** Sayfada birden fazla SSS bloğu varsa çakışmasın diye benzersiz olmalı. */
  groupName: string;
}) {
  return (
    <div>
      {faqs.map((faq) => (
        <details
          key={faq.question}
          name={groupName}
          className="group border-b border-line py-6"
        >
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-sea-deep marker:content-none">
            <h3 className="font-display text-lg leading-snug">{faq.question}</h3>
            <span
              aria-hidden="true"
              className="mt-1.5 shrink-0 text-sea transition-transform duration-300 group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="mt-4 max-w-prose text-sm leading-relaxed text-ink-70">
            {faq.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
