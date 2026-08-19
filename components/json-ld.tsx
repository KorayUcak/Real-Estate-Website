import type { Thing, WithContext } from "schema-dts";

type Schema = WithContext<Thing> | WithContext<Thing>[];

/**
 * JSON-LD enjeksiyonu. App Router'da `<head>` doğrudan yazılamadığı için
 * script server component ağacında render edilir — Google, JSON-LD'yi
 * belgenin herhangi bir yerinde okuduğundan bu tamamen geçerlidir.
 *
 * `<` karakteri kaçırılır: aksi hâlde veri içindeki "</script>" dizisi
 * HTML'i erken kapatıp XSS'e kapı açardı.
 */
export function JsonLd({ schema }: { schema: Schema }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
      }}
    />
  );
}
