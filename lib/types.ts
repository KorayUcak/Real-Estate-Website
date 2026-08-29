/** data/villas.json şemasının tip karşılığı. JSON dosyası bu sözleşmeye uymak zorundadır. */

import type { Localized } from "@/lib/localized";

export type VillaStatus = "for-sale" | "reserved" | "sold" | "off-market";

/** Görsel varlık — hem ilanlar hem blog yazıları aynı sözleşmeyi kullanır. */
export type ImageAsset = {
  src: string;
  /** Boş bırakmayın: alt metni hem erişilebilirlik hem Google Görseller sıralaması içindir. */
  alt: string;
  width: number;
  height: number;
};

/** Geriye dönük ad — mevcut ilan kodu bu ismi kullanmaya devam ediyor. */
export type VillaImage = ImageAsset;

export type Villa = {
  id: string;
  /** URL segmenti → /properties/{slug}. Sadece küçük harf, tire ayraçlı, ASCII. */
  slug: string;
  /** Dahili ilan kodu (ör. C2C-FET-014) — Product schema'da `sku` olarak kullanılır. */
  reference: string;
  /**
   * ⚠️ ARTIK DÜZ DİZE DEĞİL — üç dilli kayıt (bkz. lib/localized.ts).
   *
   * `en` zorunlu, `tr`/`ru` opsiyonel. Okurken DOĞRUDAN basılmaz;
   * `getLocalizedField(villa.title, language)` üzerinden geçer, o da
   * çeviri boşsa İngilizceye düşer.
   */
  title: Localized<string>;
  /** Kart ve hero altında görünen tek cümlelik satış vaadi. */
  headline: Localized<string>;
  status: VillaStatus;
  featured: boolean;
  propertyType: string;
  location: {
    /** serviceAreas[].slug ile eşleşir — filtreleme bu alan üzerinden yapılır. */
    areaSlug: string;
    area: string;
    district: string;
    city: string;
    region: string;
    country: string;
    coordinates: { lat: number; lng: number };
    /**
     * WordPress kaydı Houzez'in varsayılan haritası ile geldiyse true olur —
     * o pin Miami, Florida'yı gösteriyor, Fethiye'yi değil.
     *
     * true ise `coordinates` GERÇEK DEĞİLDİR: harita bileşeni render
     * edilmemeli, "yaklaşık konum" gibi bir ifadeyle de gösterilmemelidir.
     */
    isPlaceholder: boolean;
  };
  /** Fiyatlar kaynakta daima GBP tutulur; TRY görünümü istemcide kur ile hesaplanır. */
  price: { gbp: number; currency: "GBP" };
  bedrooms: number;
  bathrooms: number;
  buildSizeSqm: number;
  plotSizeSqm: number;
  floors: number;
  /** Tapu durumu — İngiliz alıcıların en sık sorduğu kalem. */
  deedStatus: string;
  /** Vatandaşlık programı eşiğini karşılıyor mu? */
  citizenshipEligible: boolean;
  /**
   * Kısa özellik rozetleri (Private pool, Sea view, ...)
   *
   * ⚠️ ÜÇ DİLLİ HÂLE GETİRİLDİ. Önceki not "rozetler tek dilde kalıyor"
   * diyordu; o karar geri alındı. Sebep tutarlılık: aynı ilan sayfasında
   * başlık ve açıklama Türkçe basılırken "Sea view" rozetinin İngilizce
   * kalması, sayfanın yarım çevrilmiş görünmesine yol açıyordu.
   *
   * ⚠️ YÖNETİCİ SEÇİCİSİ HÂLÂ İNGİLİZCE ÇALIŞIR. `getKnownFeatures`
   * listeyi `en` üzerinden kuruyor — rozetler kanonik olarak İngilizce
   * yazılıp diğer diller ondan türetiliyor (bkz. lib/villas.ts).
   */
  features: Localized<string[]>;
  /**
   * Kart üzerinde gösterilen en güçlü 3 madde — TAŞIMADA ÜRETİLMİŞ veri.
   *
   * ⚠️ `whyThisOne` ile karıştırmayın. Bu alan `scripts/adapt-villas.js`
   * tarafından yazılıyor ("4 bedrooms, 4 bathrooms — 245 m² internal") ve
   * artık yalnızca kart arama metnini besliyor (lib/property-card-data.ts).
   * İlan sayfasındaki "Why this one" bölümü buradan DEĞİL, aşağıdaki elle
   * yazılan alandan besleniyor.
   */
  highlights: string[];
  /**
   * "Why this one" — ilan sayfasındaki satış maddeleri, ELLE yazılır.
   *
   * OPSİYONEL ve bu bilinçli: alan sonradan eklendi ve `data/villas.json`
   * dışında bir yerden (eski bir yedek, elle düzenlenmiş bir kayıt) gelen
   * bir ilan onu taşımayabilir. Zorunlu yapmak, o kaydı okuyan her yerin
   * derleme hatası vermesi demekti; opsiyonel olması ise tek bir davranış
   * gerektiriyor — boşsa bölüm hiç basılmaz.
   */
  whyThisOne?: Localized<string[]>;
  /**
   * Her eleman bir <p>. İlk paragraf meta description için de kullanılabilir.
   * Üç dilli — `title` ile aynı sözleşme.
   */
  description: Localized<string[]>;
  images: VillaImage[];
  seo: {
    title: Localized<string>;
    description: Localized<string>;
    /**
     * ⚠️ ANAHTAR KELİMELER ÇEVRİLMİYOR — bilinçli.
     *
     * `keywords` meta etiketi Google tarafından on yıldan uzun süredir
     * sıralama sinyali olarak kullanılmıyor; alan `pageMetadata` üzerinden
     * hâlâ basılıyor ama okunan bir metin değil. Üç dile çıkarmak DeepL
     * kotasından karakter yerken ekranda hiçbir şeyi değiştirmezdi.
     */
    keywords: string[];
  };
  publishedAt: string;
  updatedAt: string;
};

/* ------------------------------------------------------------------ BLOG */

/**
 * Yazı gövdesi Markdown yerine yapılandırılmış bloklardan oluşur.
 *
 * Sebep: Markdown ayrıştırmak bir bağımlılık (ve `dangerouslySetInnerHTML`
 * ile birlikte bir XSS yüzeyi) getirir. Bloklar ise tip güvenlidir, her blok
 * kendi semantik etiketiyle render edilir ve başlıklara `id` vererek
 * içindekiler tablosu üretmeyi mümkün kılar.
 */
export type PostBlock =
  | { type: "paragraph"; text: string }
  /** `id`: hem içindekiler tablosunun çapası hem de derin link hedefi. */
  | { type: "heading"; id: string; text: string }
  | { type: "list"; ordered?: boolean; items: string[] }
  | { type: "quote"; text: string; attribution?: string }
  /** Vurgulanmış uyarı/ipucu kutusu. */
  | { type: "callout"; title: string; text: string }
  | { type: "image"; image: ImageAsset; caption?: string };

export type Post = {
  id: string;
  /** URL segmenti → /blog/{slug}. Sadece küçük harf, tire ayraçlı, ASCII. */
  slug: string;
  title: string;
  /** Kartlarda ve meta description'da kullanılan özet. */
  excerpt: string;
  category: string;
  /** Kart üzerinde gösterilen tahmini okuma süresi (dakika). */
  readingMinutes: number;
  featured: boolean;
  image: ImageAsset;
  /** ISO tarih (YYYY-MM-DD). BlogPosting schema'sında datePublished olur. */
  publishedAt: string;
  updatedAt: string;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  body: PostBlock[];
};
