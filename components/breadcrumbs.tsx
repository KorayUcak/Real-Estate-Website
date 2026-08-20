import { LocaleLink as Link } from "@/components/locale-link";
import { ChevronRight } from "lucide-react";
import type { Crumb } from "@/lib/seo";

/**
 * Görsel breadcrumb. BreadcrumbList schema'sı ile AYNI diziden beslenir
 * (`breadcrumbSchema(crumbs)`), çünkü Google, ekranda görünmeyen bir
 * breadcrumb markup'ını yok sayar — ikisinin ayrışmaması şart.
 *
 * Son öğe link değildir: bulunduğunuz sayfaya link vermek hem gereksiz
 * hem de ekran okuyucuda kafa karıştırıcıdır. `aria-current="page"` bunu bildirir.
 */
export function Breadcrumbs({
  crumbs,
  tone = "light",
}: {
  crumbs: Crumb[];
  /** "dark": koyu zeminde (sea-deep/görsel üstünde) kullanılırken. */
  tone?: "light" | "dark";
}) {
  const muted = tone === "dark" ? "text-shell/60" : "text-ink-40";
  const active = tone === "dark" ? "text-shell" : "text-sea-deep";

  return (
    <nav aria-label="Breadcrumb">
      <ol className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs ${muted}`}>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <li key={crumb.path} className="flex items-center gap-2">
              {isLast ? (
                <span aria-current="page" className={active}>
                  {crumb.name}
                </span>
              ) : (
                <>
                  <Link
                    href={crumb.path}
                    className="underline-offset-4 transition-colors hover:underline"
                  >
                    {crumb.name}
                  </Link>
                  <ChevronRight className="size-3 shrink-0" aria-hidden="true" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
