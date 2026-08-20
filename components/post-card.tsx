import Image from "next/image";
import { LocaleLink as Link } from "@/components/locale-link";
import { ArrowUpRight, Clock } from "lucide-react";
import { formatPostDate } from "@/lib/posts";
import type { Post } from "@/lib/types";

/**
 * Blog kartı. `VillaCard` ile aynı etkileşim kalıbını izler: kartın tamamı
 * tıklanabilirdir ama erişilebilir link metni gerçek başlıktır ("read more"
 * değil), çünkü ekran okuyucu kullanıcıları linkleri bağlamından kopuk bir
 * liste hâlinde gezebilir.
 */
export function PostCard({
  post,
  priority = false,
  /** Öne çıkan kart: liste başında daha büyük ve yatay yerleşimli. */
  featured = false,
}: {
  post: Post;
  priority?: boolean;
  featured?: boolean;
}) {
  return (
    <article
      className={`group relative flex h-full ${
        featured ? "flex-col lg:flex-row lg:items-center lg:gap-14" : "flex-col"
      }`}
    >
      <div
        className={`relative overflow-hidden bg-shell-deep ${
          featured ? "aspect-[16/10] w-full lg:w-3/5" : "aspect-[4/3] w-full"
        }`}
      >
        <Image
          src={post.image.src}
          alt={post.image.alt}
          fill
          priority={priority}
          sizes={
            featured
              ? "(min-width: 1024px) 60vw, 100vw"
              : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          }
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
      </div>

      <div
        className={`flex flex-1 flex-col ${featured ? "pt-8 lg:pt-0" : "pt-7"}`}
      >
        <p className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs uppercase tracking-widest text-sea">
          {post.category}
          <span className="inline-flex items-center gap-1.5 text-ink-40">
            <Clock className="size-3.5" aria-hidden="true" />
            {post.readingMinutes} min read
          </span>
        </p>

        <h3
          className={`mt-4 font-display leading-snug text-sea-deep ${
            featured ? "text-3xl sm:text-4xl" : "text-xl"
          }`}
        >
          <Link
            href={`/blog/${post.slug}`}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {post.title}
          </Link>
        </h3>

        <p
          className={`mt-4 leading-relaxed text-ink-70 ${
            featured ? "max-w-xl text-base" : "line-clamp-3 text-sm"
          }`}
        >
          {post.excerpt}
        </p>

        <p className="mt-6 flex items-center justify-between border-t border-line pt-5 text-sm text-ink-40">
          {/* <time>: makine okunabilir tarih, BlogPosting datePublished ile aynı. */}
          <time dateTime={post.publishedAt}>
            {formatPostDate(post.publishedAt)}
          </time>
          <ArrowUpRight
            className="size-5 text-sea transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
            aria-hidden="true"
          />
        </p>
      </div>
    </article>
  );
}
