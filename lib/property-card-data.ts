import { normalizeSearch } from "@/lib/property-filters";
import { formatAreaLabel, getServiceArea } from "@/lib/site";
import type { Villa, VillaImage } from "@/lib/types";
import { getLocalizedField } from "@/lib/localized";
import type { LanguageCode } from "@/lib/locale";

/**
 * İstemci bileşenlerine geçen DAR görünüm modeli.
 *
 * NEDEN `Villa` DOĞRUDAN GEÇİLMİYOR:
 * Bir sunucu bileşeni, istemci bileşenine verdiği her prop'u RSC payload'ına
 * serileştirir ve bu payload HTML kaynağına yazılır. Tam `Villa` nesnesi
 * geçildiğinde 57 ilanın tamamının koordinatları sayfa kaynağına giriyordu —
 * bunların 21'i Houzez'in varsayılan pin'i, yani MİAMİ, FLORIDA.
 *
 * Ekranda görünmemesi yeterli değil: "görünmüyor" ile "orada değil" aynı şey
 * değildir. Bu tip, sınırdan geçmesine izin verilen alanların tamamıdır ve
 * `coordinates` ile `isPlaceholder` kasıtlı olarak YOKTUR.
 *
 * Yan fayda: açıklama paragrafları, seo bloğu, tapu metni ve 30 görselin
 * tamamı da dışarıda kalıyor — payload belirgin şekilde küçülüyor.
 */
export type PropertyCardData = {
  id: string;
  slug: string;
  title: string;
  headline: string;
  status: string;
  /** Kaynak daima GBP; TRY görünümü istemcide kurla hesaplanır. */
  price: number;
  bedrooms: number;
  bathrooms: number;
  /** 0 = bilinmiyor. Kart bu durumda m² satırını hiç basmaz. */
  buildSizeSqm: number;
  propertyType: string;
  /** Filtreleme bu alanla yapılır; koordinat değil, yalnızca slug. */
  areaSlug: string;
  /** "Ovacık, Fethiye" — serviceAreas'tan çözülmüş, hazır etiket. */
  areaLabel: string;
  images: VillaImage[];
  /** ISO tarih. "Newest" sıralamasının kaynağı. */
  publishedAt: string;
  /** "Recommended" sıralamasında öne alınır. */
  featured: boolean;
  /**
   * Serbest metin aramasının ARADIĞI TEK ALAN — önceden normalize edilmiş,
   * küçük harfli, aksanları katlanmış tek bir metin.
   *
   * NEDEN `description` BURADA YOK:
   * Açıklama paragrafları 57 ilan için 164 KB. İstemciye göndermek /properties
   * yükünü 358 KB'den ~520 KB'ye çıkarırdı — kademeli gösterimle yeni
   * kazandığımızın tamamından fazlası. Bunun yerine aranmaya DEĞER alanlar
   * derleniyor: başlık, vaat cümlesi, tip, bölge, `features` ve `highlights`
   * (toplam ~15 KB). "Sea view", "Private pool", "Ovacık" gibi gerçek arama
   * terimleri zaten bu listelerde yaşıyor.
   *
   * BEDELİ: açıklamanın gövdesinde geçip başka hiçbir alanda geçmeyen bir
   * kelime bulunamaz. Bu kabul edilmiş bir sınır, hata değil — tam metin
   * arama gerekirse çözüm alanı büyütmek değil, bir arama indeksi (ör.
   * derleme anında üretilmiş ters indeks) eklemektir.
   */
  searchText: string;
};

/**
 * Karta kaç görsel gitsin?
 *
 * İlanlarda 30'a kadar fotoğraf var ve embla her slaytı DOM'da tutuyor.
 * /properties sayfasında 57 kart × 30 görsel = 1710 <img> olurdu. Altı tanesi
 * galeriyi anlamlı kılmaya yetiyor; tam set ilan sayfasında zaten var.
 */
export const CARD_IMAGE_LIMIT = 6;

/**
 * ⚠️ ÇEVİRİ BURADA ÇÖZÜLÜYOR — istemcide DEĞİL.
 *
 * `PropertyCard` bir istemci bileşeni. Başlığı orada çözmek, `Localized`
 * nesnesini RSC payload'ına koymayı ve aktif dili istemciye taşımayı
 * gerektirirdi; ikisi de gereksiz ve ikincisi HİDRASYON RİSKİ — sunucunun
 * bastığı dil ile istemcinin ilk render'da okuduğu dil ayrışırsa React
 * uyuşmazlık verir.
 *
 * Bu projeksiyon zaten sunucuda çalışıyor ve zaten düz `string` üretiyor.
 * Dili burada uygulamak hem sınırı korumuş oluyor hem de payload'ı üç
 * dilden bire indiriyor.
 */
export function toPropertyCardData(
  villa: Villa,
  language: LanguageCode,
  imageLimit = CARD_IMAGE_LIMIT,
): PropertyCardData {
  const title = getLocalizedField(villa.title, language);

  const area = getServiceArea(villa.location.areaSlug);
  const name = area?.name ?? villa.location.area;

  return {
    id: villa.id,
    slug: villa.slug,
    title,
    headline: villa.headline,
    status: villa.status,
    price: villa.price.gbp,
    bedrooms: villa.bedrooms,
    bathrooms: villa.bathrooms,
    buildSizeSqm: villa.buildSizeSqm,
    propertyType: villa.propertyType,
    areaSlug: villa.location.areaSlug,
    areaLabel: formatAreaLabel(name, villa.location.district),
    images: villa.images.slice(0, imageLimit),
    publishedAt: villa.publishedAt,
    featured: villa.featured,
    /*
      Normalizasyon SUNUCUDA, ilan başına bir kez. İstemci her tuş vuruşunda
      57 ilanı yeniden normalize etmez; yalnızca sorguyu normalize edip
      hazır metinde arar.
    */
    searchText: normalizeSearch(
      [
        /* Arama metni de aktif dilden: Türkçe sayfada Türkçe başlıkla
           aranabilmeli. İngilizce yedeği zaten `getLocalizedField`ten
           geliyor, yani çevrilmemiş ilan da bulunabilir durumda kalıyor. */
        title,
        villa.headline,
        villa.propertyType,
        name,
        villa.location.district,
        ...villa.features,
        ...villa.highlights,
      ].join(" "),
    ),
  };
}

export function toPropertyCardList(
  villas: Villa[],
  language: LanguageCode,
  imageLimit = CARD_IMAGE_LIMIT,
): PropertyCardData[] {
  return villas.map((villa) => toPropertyCardData(villa, language, imageLimit));
}
