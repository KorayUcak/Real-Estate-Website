import type { LegalSection } from "@/lib/legal";

/**
 * HUKUKİ SAYFA GÖVDESİ — /terms ve /privacy-policy'nin ORTAK dizgisi.
 *
 * Neden `PostBody` yeniden kullanılmadı: o bileşen blog `PostBlock` tipine
 * bağlı ve alıntı/görsel/bilgi kutusu gibi editoryal bloklar taşıyor. Hukuki
 * metinde bunların hiçbiri yok; olan tek şey numaralı başlıklar, paragraflar
 * ve maddeler. İki farklı içerik tipini tek bileşene sığdırmak, ikisini de
 * bulanıklaştırırdı.
 *
 * Neden iki sayfaya kopyalanmadı: aynı belge ailesinden iki metin, farklı
 * satır yüksekliği ya da farklı başlık ölçeğiyle dizildiğinde bunu kimse fark
 * etmez ama sayfa ucuz görünür. Tek bileşen, ikisinin ritminin ayrışmasını
 * imkânsız kılıyor.
 *
 * Sunucu bileşeni — hukuki metnin istemcide hiçbir işi yok.
 */
export function LegalBody({ sections }: { sections: LegalSection[] }) {
  return (
    <div className="max-w-3xl">
      {/*
        İÇİNDEKİLER. Uzun bir hukuki belgede süs değil, gezinme aracı:
        kullanıcı genelde tek bir maddeyi arar (çerezler, iade, sorumluluk)
        ve on iki başlığı kaydırarak taramak zorunda kalmamalı.

        `<nav>` + `aria-label`: ekran okuyucu bunu bir yer işareti olarak
        listeler, sıradan bir bağlantı yığını olarak değil.
      */}
      <nav
        aria-label="On this page"
        className="border border-line bg-shell-deep p-6 sm:p-8"
      >
        <h2 className="eyebrow text-ink-40">On this page</h2>
        <ol className="mt-5 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
          {sections.map((section, index) => (
            <li key={section.id} className="flex gap-3 text-sm">
              <span
                aria-hidden="true"
                className="font-display text-sea tabular-nums"
              >
                {index + 1}.
              </span>
              <a
                href={`#${section.id}`}
                className="text-ink-70 underline-offset-4 transition-colors hover:text-sea hover:underline"
              >
                {section.heading}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {sections.map((section, index) => (
        <section key={section.id} aria-labelledby={section.id}>
          <h2
            id={section.id}
            /* scroll-mt-28: sticky başlık, içindekiler'den atlanan
               başlığın üstünü örtmesin. */
            className="mt-14 scroll-mt-28 font-display text-2xl leading-tight text-sea-deep sm:mt-16 sm:text-3xl"
          >
            <span aria-hidden="true" className="mr-3 text-sea">
              {index + 1}.
            </span>
            {section.heading}
          </h2>

          {section.blocks.map((block, blockIndex) =>
            block.type === "paragraph" ? (
              <p
                key={blockIndex}
                className="mt-6 leading-[1.75] text-ink-70"
              >
                {block.text}
              </p>
            ) : (
              <ul key={blockIndex} className="mt-6 space-y-3.5">
                {block.items.map((item) => (
                  <li
                    key={item}
                    className="flex gap-4 leading-relaxed text-ink-70"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2.5 size-1.5 shrink-0 bg-sea"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ),
          )}
        </section>
      ))}
    </div>
  );
}
