import Image from "next/image";
import { Info, Quote } from "lucide-react";
import type { PostBlock } from "@/lib/types";

/**
 * Blok dizisini semantik HTML'e çevirir.
 *
 * Her blok tipi kendi doğru etiketini alır (<h2>, <ul>/<ol>, <blockquote>,
 * <figure>/<figcaption>) — görsel olarak benzeyen <div>'ler yerine. Bu,
 * ekran okuyucuların belge yapısını gezebilmesi ve Google'ın içerik
 * hiyerarşisini anlaması için gereken tek şey.
 *
 * Yazı gövdesinde H1 YOKTUR: sayfadaki tek H1 yazının başlığıdır, gövde
 * başlıkları H2'den başlar.
 */
export function PostBody({ blocks }: { blocks: PostBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "heading":
            return (
              <h2
                key={block.id}
                id={block.id}
                /* scroll-mt: sticky header çapayı örtmesin. */
                className="mt-16 scroll-mt-28 font-display text-2xl leading-tight text-sea-deep sm:text-3xl"
              >
                {block.text}
              </h2>
            );

          case "paragraph":
            return (
              <p
                key={index}
                className="mt-6 text-lg leading-[1.75] text-ink-70"
              >
                {block.text}
              </p>
            );

          case "list": {
            const items = block.items.map((item) => (
              <li key={item} className="flex gap-4 leading-relaxed text-ink-70">
                {!block.ordered ? (
                  <span
                    aria-hidden="true"
                    className="mt-2.5 size-1.5 shrink-0 bg-sea"
                  />
                ) : null}
                <span>{item}</span>
              </li>
            ));

            return block.ordered ? (
              /* Sıralı listede numarayı tarayıcı üretir — anlam kaybolmasın. */
              <ol
                key={index}
                className="mt-8 list-decimal space-y-4 pl-6 marker:font-display marker:text-sea"
              >
                {items}
              </ol>
            ) : (
              <ul key={index} className="mt-8 space-y-4">
                {items}
              </ul>
            );
          }

          case "quote":
            return (
              <blockquote
                key={index}
                className="my-14 border-l-2 border-sea pl-8"
              >
                <Quote className="size-6 text-sea" aria-hidden="true" />
                <p className="mt-5 font-display text-xl leading-relaxed text-sea-deep sm:text-2xl">
                  {block.text}
                </p>
                {block.attribution ? (
                  <footer className="mt-5 text-xs uppercase tracking-widest text-ink-40">
                    {block.attribution}
                  </footer>
                ) : null}
              </blockquote>
            );

          case "callout":
            return (
              <aside
                key={index}
                className="my-12 border border-line bg-shell-deep p-8"
              >
                <p className="inline-flex items-center gap-3 font-display text-lg text-sea-deep">
                  <Info className="size-5 shrink-0 text-sea" aria-hidden="true" />
                  {block.title}
                </p>
                <p className="mt-4 leading-relaxed text-ink-70">{block.text}</p>
              </aside>
            );

          case "image":
            return (
              <figure key={block.image.src} className="my-14">
                <div className="relative aspect-[3/2] overflow-hidden bg-shell-deep">
                  <Image
                    src={block.image.src}
                    alt={block.image.alt}
                    fill
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    className="object-cover"
                  />
                </div>
                {block.caption ? (
                  <figcaption className="mt-4 text-xs leading-relaxed text-ink-40">
                    {block.caption}
                  </figcaption>
                ) : null}
              </figure>
            );
        }
      })}
    </>
  );
}
