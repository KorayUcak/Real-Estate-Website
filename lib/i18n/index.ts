/**
 * ÇEVİRİ KATMANI — sözlükler + arama.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * MİMARİ: ROTA TABANLI. Dil URL'dedir (`app/[lang]/`), tarayıcı
 * depolamasında değil. /tr/properties ile /properties iki ayrı belgedir:
 * ayrı canonical, ayrı hreflang girdisi, ayrı statik çıktı.
 *
 * ⚠️ BU DOSYANIN ESKİ SÜRÜMÜ TAM TERSİNİ SAVUNUYORDU. Dil localStorage'da
 * tutulurken bu doğruydu — çeviri yalnızca arayüz kabuğunu kapsıyordu ve
 * URL'e taşımak, o kapsam için ağır bir bedeldi. Sayfa METİNLERİ de
 * çevrilmeye başlayınca denklem değişti: Google localStorage okumaz, yani
 * o kurulumda Türkçe ve Rusça içerik hiçbir zaman dizine giremezdi.
 * Onbinlerce kelimelik bir çeviri yatırımının görünmez kalması kabul
 * edilebilir değildi.
 *
 * SÖZLÜKLER O GEÇİŞTE HİÇ DEĞİŞMEDİ — yalnızca dilin nereden okunduğu
 * değişti. Anahtar biçimi, İngilizce yedeği ve derleme zamanı kontrolü aynı.
 *
 * İKİ GİRİŞ NOKTASI:
 *   sunucu   → `lib/i18n/server.ts` `getT()`   ← sayfa metinleri için BU
 *   istemci  → `components/translation.tsx`     ← yalnızca etkileşimli kabuk
 *
 * Hangisinin ne zaman kullanılacağı server.ts başında yazılı.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { LANGUAGE_META, type LanguageCode } from "@/lib/locale";
import en from "./dictionaries/en.json";
import ru from "./dictionaries/ru.json";
import tr from "./dictionaries/tr.json";

/**
 * İngilizce sözlük ŞEMANIN KENDİSİ.
 *
 * TR/RU `Dictionary` olarak değil, `DeepPartial<Dictionary>` olarak
 * tiplenseydi eksik anahtar sessizce geçerdi. Tam tip zorunlu tutuluyor:
 * en.json'a bir anahtar eklendiği anda diğer iki dosya DERLENMİYOR. Eksik
 * çeviri, çalışma zamanında fark edilen bir içerik hatası olmaktan çıkıp
 * build hatasına dönüşüyor — tek fark bu, ama sözlüklerin bayatlamasını
 * engelleyen tek şey de bu.
 */
export type Dictionary = typeof en;

export const DICTIONARIES: Record<LanguageCode, Dictionary> = {
  EN: en,
  TR: tr,
  RU: ru,
};

/**
 * `"footer.exploreHeading"` gibi noktalı yolların BİRLEŞİM tipi.
 *
 * Anahtarı düz `string` alsaydık yazım hatası ("footer.explore") derleyiciden
 * geçer, ekranda ham anahtar olarak görünürdü. Bu tip sayesinde editör
 * tamamlama veriyor ve olmayan anahtar derlenmiyor.
 */
type Leaves<T> = {
  [K in keyof T & string]: T[K] extends string
    ? K
    : /*
         DİZİLER BU BİRLEŞİMİN DIŞINDA.

         `Leaves<string[]>` dizinin kendi anahtarlarını üretirdi —
         "length", "toString", "flatMap"… yani anahtar birleşimi yüzlerce
         anlamsız üyeyle şişer ve `t("...")` çağrısındaki tamamlama
         kullanılamaz hâle gelirdi.

         Dizi taşıyan alanlar zaten `t()` ile okunmuyor: bölge maddeleri
         gibi yapılar tipli getter'lardan geçiyor (bkz. getAreaCopy /
         getTurkeyCopy), çünkü sonuç bir dize değil bir liste.
      */
      T[K] extends readonly unknown[]
      ? never
      : `${K}.${Leaves<T[K]>}`;
}[keyof T & string];

export type TranslationKey = Leaves<Dictionary>;

/** `{name}` yer tutucularına geçirilen değerler. */
export type TranslationVars = Record<string, string | number>;

function resolve(dictionary: Dictionary, key: string): string | undefined {
  let node: unknown = dictionary;

  for (const segment of key.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[segment];
  }

  return typeof node === "string" ? node : undefined;
}

/** `"© {year} {company}."` → değişkenler yerine oturur. */
function interpolate(template: string, vars?: TranslationVars): string {
  if (!vars) return template;

  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

/**
 * Anahtarı çözer; seçili dilde yoksa İNGİLİZCEYE düşer.
 *
 * Tipler eksik anahtarı zaten engelliyor — bu yedek, tipin göremediği tek
 * durum için: sözlük JSON'u elle düzenlenip bir değer boşaltılırsa ekranda
 * boşluk değil İngilizce metin kalır. Boş bir menü etiketi, İngilizce bir
 * menü etiketinden çok daha kötüdür.
 */
export function translate(
  language: LanguageCode,
  key: TranslationKey,
  vars?: TranslationVars,
): string {
  const dictionary = DICTIONARIES[language] ?? en;
  const value = resolve(dictionary, key) || resolve(en, key) || key;

  return interpolate(value, vars);
}

/**
 * ÇOĞUL — `Intl.PluralRules` ile, elle `n === 1` kontrolüyle DEĞİL.
 *
 * ⚠️ NEDEN ÖNEMLİ: `count === 1 ? tekil : çoğul` üç dilin ikisinde yanlış.
 *
 *   İngilizce  1 listing / 2 listings              → iki biçim
 *   Türkçe     1 ilan / 5 ilan                     → TEK biçim; sayıdan
 *              sonra çoğul eki KULLANILMAZ. "5 ilanlar" hatalıdır.
 *   Rusça      1 объект / 2 объекта / 5 объектов   → ÜÇ biçim, üstelik
 *              21 tekile, 22 "few"a, 25 "many"e döner.
 *
 * Bu kuralları elle yazmak Rusça'da kaçınılmaz olarak bozulur. `Intl`
 * her dilin CLDR kategorisini zaten biliyor.
 *
 * Sözlükte dört kategori de TANIMLI olmak zorunda — İngilizce ve Türkçe
 * `Intl`den asla "few"/"many" almasa bile. Sebep tip: üç sözlük birebir
 * aynı şekle sahip olmalı (bkz. `Dictionary`), yoksa eksik anahtar
 * kontrolü çalışmaz.
 */
export type PluralForms = {
  one: string;
  few: string;
  many: string;
  other: string;
};

export function translatePlural(
  language: LanguageCode,
  forms: PluralForms,
  count: number,
  vars?: TranslationVars,
): string {
  const tag = LANGUAGE_META[language].tag;
  const category = new Intl.PluralRules(tag).select(count);

  /* `select()` "zero"/"two" da dönebilir (Arapça, Lehçe…). Bu üç dilde
     olmuyor ama sözlükte karşılığı yoksa `other`a düşmek doğru davranış —
     eksik bir kategori boş metin üretmemeli. */
  const form = forms[category as keyof PluralForms] ?? forms.other;

  return interpolate(form, { count, ...vars });
}

/**
 * GEZİNME ETİKETİ — anahtarı İNGİLİZCE METNİN KENDİSİ.
 *
 * Neden href değil: aynı hedef, bulunduğu menüye göre farklı yazılıyor.
 * `/buying-process` başlıkta "Buying Process", footer'da da öyle, ama
 * `primaryNav` içinde tek kelimelik "Buying" — dokuz öğelik menüde satıra
 * sığsın diye (bkz. lib/site.ts). href'i anahtar yapmak bu iki etiketi tek
 * çeviriye çökertirdi ve kısaltmanın varlık sebebini yok ederdi.
 *
 * İngilizce metni anahtar yapmanın ikinci faydası: lib/site.ts'e HİÇ
 * dokunulmuyor. Gezinme listeleri yapısal veri olarak kalıyor, çeviri
 * onların üstünde ayrı bir katman.
 */
export function translateNavLabel(
  language: LanguageCode,
  label: string,
): string {
  const dictionary = DICTIONARIES[language] ?? en;
  const table = dictionary.nav as Record<string, string | undefined>;

  /* Sözlükte yoksa İngilizce etiket aynen basılır: yeni bir menü öğesi
     eklendiğinde bağlantı çevrilmemiş görünür ama ÇALIŞIR. */
  return table[label] || label;
}

/** Başlık açılır menüsündeki açıklamalar — bunlar yalnız orada, href tekil. */
export function translateNavDescription(
  language: LanguageCode,
  href: string,
  fallback: string,
): string {
  const dictionary = DICTIONARIES[language] ?? en;
  const table = dictionary.navDescriptions as Record<string, string | undefined>;

  return table[href] || fallback;
}
