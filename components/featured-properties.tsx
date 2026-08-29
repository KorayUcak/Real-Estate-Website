import { LocaleLink as Link } from "@/components/locale-link";
import { getT } from "@/lib/i18n/server";
import { ArrowRight } from "lucide-react";
import { FeaturedCarousel } from "@/components/featured-carousel";
import { Reveal } from "@/components/reveal";
import { toPropertyCardList } from "@/lib/property-card-data";
import { getFeaturedVillas } from "@/lib/villas";
import { currentLanguage } from "@/lib/current-locale";

/**
 * Ana sayfanın "Featured Properties" bölümü.
 *
 * Sunucu bileşeni: veri build anında okunur, istemciye yalnızca karusel
 * (embla) iniyor. Bölüm başlığı ve CTA JS gerektirmez.
 *
 * `getFeaturedVillas` data/villas.json'u okuyup `featured === true` olanları
 * süzer ve FİYATA GÖRE AZALAN sıralar — yani buradaki liste portföyün en üst
 * segmenti demek. Sayı 3'ten 7'ye çıkarıldı: üç kart bir ızgarada tamdı ama
 * bir karuselde "kaydırılacak bir şey var" hissi vermiyordu.
 */
export async function FeaturedProperties() {
  const t = await getT();
  const villas = await getFeaturedVillas(7);
  const language = await currentLanguage();

  /** Dar görünüm modeli: koordinatlar sınırı hiç geçmiyor. */
  const cards = toPropertyCardList(villas, language);

  if (cards.length === 0) return null;

  return (
    <section
      aria-labelledby="featured-heading"
      className="relative bg-white py-12 sm:py-20 lg:py-section"
    >
      <div className="container-page">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2
            id="featured-heading"
            className="font-display text-2xl uppercase leading-[1.1] tracking-[0.02em] text-sea-deep sm:text-4xl"
          >
            {t("home.featuredHeading")}
          </h2>
        </Reveal>

        {/*
          IZGARA → KARUSEL.

          Önceki hâl üç kartlık bir `grid`di ve mobilde üçü alt alta
          diziliyordu: yedi kart aynı düzende 2.500px'lik bir şerit olurdu.
          Yatay karusel, vitrinin uzunluğunu sayfa uzunluğuna çevirmiyor.

          `max-w-6xl` KALDIRILDI: karusel şeridi container'ın tam genişliğini
          kullanmalı ki masaüstünde üçüncü kartın yanında dördüncünün kenarı
          görünsün — kaydırılabilirliğin en sessiz ve en etkili işareti bu.
        */}
        <Reveal className="mt-10 sm:mt-14" y={28}>
          <FeaturedCarousel cards={cards} />
        </Reveal>

        {/* CTA karuselin ALTINDA ve ortada kalıyor. Sayı taşımıyor. */}
        <Reveal className="mt-10 flex justify-center sm:mt-12" y={16}>
          <Link href="/properties" className="btn btn-solid">
            {t("home.featuredCta")}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
