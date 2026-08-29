import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Sunucu imzasını gizle — gereksiz bilgi sızıntısı. */
  poweredByHeader: false,

  /**
   * Dev sunucusuna localhost dışından gelen istekler varsayılan olarak bloklanır.
   * Aynı ağdaki cihazlardan (telefon/tablet) test edebilmek için LAN IP'sini
   * allowlist'e alıyoruz. Protokol ve port yazılmaz — yalnızca host.
   * Not: yalnızca `next dev` için geçerlidir, production build'i etkilemez.
   */
  /**
   * Telefondan/tabletten test ederken JS paketleri BLOKLANMASIN.
   *
   * Next 16 geliştirme sunucusuna localhost dışından gelen istekleri
   * varsayılan olarak reddeder. Sayfanın HTML'i yine de sunulur — çünkü o
   * SSR'dan gelir — ama `/_next/static/chunks/*` istekleri engellenir.
   * Sonuç: sayfa açılır, doğru görünür, AMA React hidrasyonu hiç olmaz.
   * Hamburger menü ve açılır filtreler "hiç tepki vermiyor" görünür.
   * Kod kusursuz olsa bile.
   *
   * Buraya tek bir IP yazmak kalıcı bir çözüm değil: DHCP kirası
   * değiştiğinde (ya da başka bir ağa geçildiğinde) adres değişir ve hata
   * geri gelir — nitekim öyle oldu, eski kayıt 192.168.182.253 idi ve
   * makine artık 192.168.1.41 üzerinde.
   *
   * Bu yüzden RFC1918 özel ağ aralıklarının tamamı joker ile açıldı.
   * Yalnızca `next dev` için geçerlidir; production build bundan etkilenmez.
   */
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],

  images: {
    /**
     * Uzak görsel kaynakları allowlist'i. Bu tanım olmadan `next/image`
     * harici bir host'tan gelen `src` için hata fırlatır — açık uçlu bir
     * proxy'ye dönüşüp başkasının bant genişliğini bizim üzerimizden
     * servis etmesin diye.
     *
     * TODO: Gerçek ilan fotoğrafları çekildiğinde görseller /public altına
     * (veya kendi CDN'imize) taşınacak ve bu kayıt kaldırılacak.
     */
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
    /**
     * Next.js 16'da `qualities` allowlist'i zorunlu: tanımlamazsanız yalnızca
     * varsayılan 75 kullanılabilir. Hero gibi büyük görsellerde 85'e çıkıyoruz.
     *
     * 95 EKLENDİ — ve yalnızca TEK bir görsel için: /about kurucular banner'ı.
     *
     * Gerekçe, "daha yüksek daha iyidir" değil. Sitedeki diğer görseller
     * Unsplash'ten kayıpsıza yakın geliyor ve 85'te yeniden kodlanınca
     * gözle görülür bir kayıp olmuyor. About banner'ı ise KAYNAĞINDA
     * sıkıştırılmış (WhatsApp üzerinden gelmiş bir JPEG): üzerine 85'lik
     * ikinci bir kayıplı geçiş bindirmek, zaten var olan blok
     * artefaktlarını belirginleştiriyor — ve o artefaktlar bu karede İKİ
     * YÜZÜN üstüne düşüyor. 95, o ikinci geçişi mümkün olduğunca şeffaf
     * tutmak için.
     *
     * ⚠️ 90 LİSTEDEN ÇIKTI, DEĞER YÜKSELDİĞİ İÇİN DEĞİL — KİMSE KULLANMADIĞI
     * İÇİN. Listedeki tek tüketicisi About banner'ıydı; o 95'e geçince 90
     * ölü bir girdiye dönüştü. Bırakılsaydı aşağıdaki önbellek çarpımını
     * karşılığı olmayan bir boyutta şişirmeye devam ederdi.
     *
     * ⚠️ Liste bilinçli olarak KISA tutuluyor. Her değer, her boyut için ayrı
     * bir önbellek girdisi demek: `deviceSizes` × `formats` × `qualities`
     * çarpımı optimizasyon önbelleğinin boyutunu doğrudan belirliyor.
     * Yeni bir değer eklemeden önce, mevcutlardan biri gerçekten yetmiyor mu
     * diye bakın.
     */
    qualities: [75, 85, 95],
    /** AVIF önce denenir; desteklemeyen tarayıcı WebP'ye düşer. */
    formats: ["image/avif", "image/webp"],
    /** Görseller bir yıl cache'lenir — dosya adları değiştiğinde zaten invalidate olur. */
    minimumCacheTTL: 31_536_000,
  },
};

export default nextConfig;
