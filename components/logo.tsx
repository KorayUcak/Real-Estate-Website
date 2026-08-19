import type { SVGProps } from "react";

/**
 * Coast 2 Coast Properties — marka işareti.
 *
 * Eski logodan yalnızca GEOMETRİ alındı: iki düzlemli, kırık çatı silueti.
 * Gölge, degrade, filtre ve arka plan artığı bilinçli olarak taşınmadı —
 * bunlar 2010'ların "web 2.0" dili ve ekranda büyütüldüğünde ilk bozulan
 * şeyler. Burada her şey düz renk ve düz kenar.
 *
 * İki dizilim var ve ikisi AYNI çatı yolunu kullanır (tek doğruluk kaynağı);
 * fark yalnızca viewBox ile yerleşimdedir:
 *
 *   stacked    → çatı üstte, kelime işareti altında. Navbar, footer, paylaşım
 *                görselleri, basılı kullanım. Kelime işareti çatıya
 *                yaklaştırılıp viewBox kısaldıktan sonra (bkz. VIEW_BOX)
 *                alt sınır 80 px'ten ~64 px'e indi.
 *   horizontal → çatı solda, iki satır metin sağda. Navbar için: 48 px
 *                yükseklikte bile "Properties" satırı ~10.5 px render olur,
 *                yani okunur kalır. Yığılmış dizilim aynı yükseklikte
 *                okunmaz hâle geliyordu.
 *
 * Neden hook yok: bileşen sunucu bileşeni olarak da kullanılabilsin diye
 * (footer sunucuda render ediliyor). `useId` bunu imkânsız kılardı.
 */

export type LogoVariant = "stacked" | "horizontal";

type LogoProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  /** Dizilim. Varsayılan: "stacked". */
  variant?: LogoVariant;
  /** Çatının ana (sağ) düzlemi. */
  roofColor?: string;
  /**
   * Çatının sol düzlemi. Orijinal logodaki katlanma etkisini korumak için
   * bir ton koyu. Tek renkli, tamamen düz bir işaret istiyorsanız
   * `roofColor` ile aynı değeri verin.
   */
  roofShadeColor?: string;
  /** Ekran okuyucuya verilecek ad. */
  title?: string;
  /** Erişilebilir adı olan bir bağlantı/buton içindeyken `true` verin. */
  decorative?: boolean;
};

/**
 * Çatı geometrisi. İki düz üçgen düzlem tepe noktasında birleşir; ortadaki
 * kırılma çizgisi (tepe → iç köşe) orijinal logodaki katlanmanın kendisidir.
 * Hacim hissi gölgeyle değil, bu iki düzlemin renk farkıyla verilir.
 *
 * Kaynak kutusu: x 4–276, y 4–92.
 */
const ROOF_SHADE_PATH = "M112 4 L4 82 L104 58 Z";
const ROOF_MAIN_PATH = "M112 4 L276 92 L104 58 Z";

/**
 * Ortak font yığını — projedeki next/font değişkeninden beslenir.
 * Kelime işareti de başlıklarla aynı sesi konuşur (Playfair Display);
 * marka adının navbar'da serif, başlıkların serif olması bütünlüğü kurar.
 */
const FONT_STACK =
  "var(--font-playfair), 'Iowan Old Style', 'Palatino Linotype', Georgia, serif";

/**
 * YIĞILMIŞ DİZİLİMİN YÜKSEKLİĞİ 192 → 166.
 *
 * Çatı y=4–92 arasında bitiyor, kelime işareti ise 146 taban çizgisinden
 * başlıyordu: Playfair'in ~0.7 kapital yüksekliğiyle "Coast 2 Coast"ın üst
 * kenarı 119'a denk geliyor, yani ikisi arasında 27 birimlik bir boşluk
 * kalıyordu. Kapital yüksekliğinin tam bir katı kadar boşluk, iki ayrı
 * nesne izlenimi veriyordu — tek bir marka işareti değil.
 *
 * İki metin satırı 20 birim yukarı çekildi (146→126, 178→158); boşluk 27'den
 * 7'ye, yani kapital yüksekliğinin ~0.26'sına indi. Çatı merkeze doğru
 * yükselen bir kama olduğu için OPTİK boşluk bu geometrik değerden bir miktar
 * daha geniş görünür; yığılmış lockup'larda aranan oran tam olarak burası.
 *
 * viewBox yüksekliği de kısaldı, yoksa altta 26 birimlik ölü alan kalır ve
 * bileşen CSS'te YÜKSEKLİKLE ölçüldüğü için (`h-16`, `h-28`) işaret
 * boşuna küçülürdü. Yan etkisi olumlu: oran 280/192'den 280/166'ya çıkınca
 * aynı `h-*` değerinde tipografi büyüyor — "Properties" satırı h-16'da
 * 6.7px yerine 7.7px, h-20'de 8.3px yerine 9.6px render oluyor. Header'daki
 * mobil okunurluk notu bu değişiklikle kendiliğinden karşılandı.
 *
 * Alt boşluk 4 birim: "Properties"in alt uzantısı 162'de bitiyor, üstteki
 * çatı da y=4'ten başlıyor — dört bir yanda simetrik bir nefes payı.
 */
const VIEW_BOX: Record<LogoVariant, string> = {
  stacked: "0 0 280 166",
  horizontal: "0 0 446 96",
};

export function Logo({
  variant = "stacked",
  roofColor = "#F59E0B",
  roofShadeColor = "#D97706",
  title = "Coast 2 Coast Properties",
  decorative = false,
  ...props
}: LogoProps) {
  const isHorizontal = variant === "horizontal";

  return (
    <svg
      viewBox={VIEW_BOX[variant]}
      /*
        `width`/`height` bilerek verilmedi: ölçü tamamen CSS'e bırakıldı.
        Kullanım: <Logo variant="horizontal" className="h-11 w-auto" />
        viewBox + oran sayesinde her boyutta keskin kalır.
      */
      fill="none"
      shapeRendering="geometricPrecision"
      textRendering="geometricPrecision"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      focusable="false"
      {...props}
    >
      {decorative ? null : <title>{title}</title>}

      {/*
        Yatay dizilimde çatı %62 ölçekle küçültülüp dikeyde ortalanır.
        Yolları yeniden yazmak yerine dönüştürmek, ileride geometri
        değiştiğinde iki yerde birden düzeltme yapma riskini ortadan kaldırır.
      */}
      <g transform={isHorizontal ? "translate(0 18) scale(0.62)" : undefined}>
        <path d={ROOF_SHADE_PATH} fill={roofShadeColor} />
        <path d={ROOF_MAIN_PATH} fill={roofColor} />
      </g>

      {/*
        KELİME İŞARETİ.
        `currentColor`: logo, içinde bulunduğu bloğun metin rengini alır —
        lacivert navbar'da açık, beyaz zeminde koyu. Tek bileşen, iki zemin.

        Kesitler 600/500 seçildi çünkü layout.tsx yalnızca 500/600/700
        indiriyor — burada 800 istemek tarayıcıyı sahte kalınlaştırmaya
        (faux bold) zorlardı. Playfair'in kontrastı zaten ağırlık ihtiyacını
        düşürüyor.
      */}
      <text
        x={isHorizontal ? 186 : 140}
        y={isHorizontal ? 45 : 126}
        textAnchor={isHorizontal ? "start" : "middle"}
        fill="currentColor"
        fontFamily={FONT_STACK}
        fontSize={isHorizontal ? 36 : 38}
        fontWeight={600}
        letterSpacing={isHorizontal ? "-0.3" : "-0.5"}
      >
        Coast <tspan fill={roofColor}>2</tspan> Coast
      </text>

      <text
        x={isHorizontal ? 186 : 140}
        y={isHorizontal ? 73 : 158}
        textAnchor={isHorizontal ? "start" : "middle"}
        fill="currentColor"
        fontFamily={FONT_STACK}
        fontSize={isHorizontal ? 21 : 20}
        fontWeight={500}
        letterSpacing={isHorizontal ? "3.2" : "3.6"}
        /*
          Harf aralığı son harften SONRA da boşluk ekler. Ortalanmış
          dizilimde bu, bloğu optik olarak sola kaydırır; yarım aralık
          kadar geri itip düzeltiyoruz. Sola yaslı yatay dizilimde
          böyle bir sorun yok.
        */
        dx={isHorizontal ? undefined : "1.8"}
      >
        Properties
      </text>
    </svg>
  );
}
