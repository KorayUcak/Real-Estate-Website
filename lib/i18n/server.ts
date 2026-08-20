import { currentLanguage } from "@/lib/current-locale";
import {
  DICTIONARIES,
  translate,
  translatePlural,
  type Dictionary,
  type PluralForms,
  type TranslationKey,
  type TranslationVars,
} from "@/lib/i18n";

/**
 * SUNUCU TARAFI ÇEVİRİ — sayfa metinleri için doğru araç.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * NEDEN `<T>` DEĞİL. `components/translation.tsx` içindeki `<T>` bir
 * İSTEMCİ bileşeni. Arayüz kabuğu için doğru tercihti: birkaç düzine dize,
 * hepsi zaten etkileşimli bileşenlerin içinde.
 *
 * Sayfa metinleri için yanlış olurdu. `/about-turkey` tek başına iki bini
 * aşkın kelime taşıyor; her paragrafı bir istemci adasına çevirmek, o
 * metinlerin TAMAMINI React ağacı olarak istemciye yollamak demekti —
 * sunucuda üretilmiş HTML'e ek olarak. Sayfa iki kez inerdi.
 *
 * Bu fonksiyon dili sunucuda çözüyor ve düz string döndürüyor: metin
 * HTML'e girer, istemciye tek bayt JavaScript inmez.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Kullanım:
 *
 *   const t = await getT();
 *   <h1>{t("home.heroTitle")}</h1>
 *
 * Anahtar tipi `<T>` ile ORTAK: aynı sözlük, aynı derleme zamanı kontrolü,
 * aynı İngilizce yedeği.
 */

/** `{name}` yer tutucularını doldurur — `translate()` ile aynı sözleşme. */
function interpolateVars(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

export async function getT(): Promise<
  (key: TranslationKey, vars?: TranslationVars) => string
> {
  const language = await currentLanguage();

  return (key, vars) => translate(language, key, vars);
}

/**
 * Sunucu tarafı çoğul — `translatePlural`ın dili çözülmüş hâli.
 *
 * Ayrı bir fonksiyon, çünkü çoğul biçimleri sözlükten NESNE olarak
 * okunuyor: `t()` düz string döndürdüğü için dört kategoriyi taşıyamaz.
 */
export async function getPlural(): Promise<
  (forms: PluralForms, count: number, vars?: TranslationVars) => string
> {
  const language = await currentLanguage();

  return (forms, count, vars) =>
    translatePlural(language, forms, count, vars);
}

/**
 * Ham sözlük — çoğul biçimleri gibi NESNE değerleri için.
 *
 * `getT()` düz string döndürüyor; `{one, few, many, other}` gibi bir yapıyı
 * taşıyamaz. Bu getter yalnızca o durumlar için: sayfa `dict.home.listingCount`
 * nesnesini alıp `plural()`a veriyor.
 */
export async function getDictionary(): Promise<Dictionary> {
  const language = await currentLanguage();
  return DICTIONARIES[language] ?? DICTIONARIES.EN;
}

/**
 * BÖLGE METNİ — `serviceAreas` (lib/site.ts) üstüne binen çeviri katmanı.
 *
 * `serviceAreas` yapısal veri olarak KALIYOR: slug, görsel, koordinat ve
 * `areaServed` schema alanı oradan besleniyor ve bunların dili yok. Çeviri
 * yalnızca insanın okuduğu iki alanı (`headline`, `blurb`) değiştiriyor.
 *
 * Sözlükte karşılığı olmayan bir slug İngilizce değerini korur — yeni bir
 * bölge eklendiğinde sayfa çalışmaya devam eder, yalnız o kart çevrilmemiş
 * görünür.
 */
export async function getAreaCopy(): Promise<
  (slug: string, fallback: { headline: string; blurb: string }) => {
    headline: string;
    blurb: string;
  }
> {
  const dictionary = await getDictionary();
  const table = dictionary.areas as Record<
    string,
    { headline: string; blurb: string } | undefined
  >;

  return (slug, fallback) => table[slug] ?? fallback;
}

/**
 * /about-turkey İÇERİĞİ — `lib/turkey.ts` üstüne binen çeviri katmanı.
 *
 * `getAreaCopy` ile aynı kalıp ve aynı gerekçe: yapısal veri (ikonlar,
 * slug'lar, sıralama, schema alanları) kod tarafında kalıyor, yalnızca
 * insanın okuduğu alanlar sözlükten geliyor. Sözlükte karşılığı olmayan
 * bir anahtar İngilizce değerini koruyor.
 */
export async function getTurkeyCopy() {
  const dictionary = await getDictionary();
  const t = dictionary.turkey;

  return {
    areaDetail: (
      slug: string,
      fallback: { intro: string; points: string[]; bestFor: string },
    ) =>
      (t.areaDetail as Record<string, typeof fallback | undefined>)[slug] ??
      fallback,
    lifestyle: (key: string, fallback: { title: string; body: string }) =>
      (t.lifestyle as Record<string, typeof fallback | undefined>)[key] ??
      fallback,
    investment: (key: string, fallback: { title: string; body: string }) =>
      (t.investment as Record<string, typeof fallback | undefined>)[key] ??
      fallback,
    nearby: (key: string, fallback: { name: string; blurb: string }) =>
      (t.nearby as Record<string, typeof fallback | undefined>)[key] ?? fallback,
    faq: () =>
      [1, 2, 3, 4, 5].map((n) => ({
        question: (t.faq as Record<string, string>)[`q${n}`],
        answer: (t.faq as Record<string, string>)[`a${n}`],
      })),
  };
}

/**
 * /buying-process ve /selling-process içeriği.
 *
 * `getTurkeyCopy` ile aynı kalıp: ikon, id, sıralama ve HowTo schema
 * alanları `lib/process.ts`te kalıyor; yalnızca okunan metin sözlükten
 * geliyor. Sözlükte karşılığı olmayan bir id İngilizce değerini koruyor,
 * yani yeni bir adım eklendiğinde sayfa çalışmaya devam ediyor.
 */
export async function getProcessCopy() {
  const dictionary = await getDictionary();
  const p = dictionary.process;

  type Step = {
    title: string;
    summary: string;
    detail: string[];
    timing: string;
    owner: string;
  };

  const pick = <T,>(table: unknown, key: string, fallback: T): T =>
    (table as Record<string, T | undefined>)[key] ?? fallback;

  const faqList = (table: unknown) =>
    [1, 2, 3, 4, 5].map((n) => ({
      question: (table as Record<string, string>)[`q${n}`],
      answer: (table as Record<string, string>)[`a${n}`],
    }));

  return {
    buyingStep: (id: string, fallback: Step) =>
      pick<Step>(p.buyingSteps, id, fallback),
    sellingStep: (id: string, fallback: Step) =>
      pick<Step>(p.sellingSteps, id, fallback),
    cost: (
      key: string,
      fallback: { item: string; amount: string; note: string },
    ) => pick(p.buyingCosts, key, fallback),
    painPoint: (key: string, fallback: { problem: string; answer: string }) =>
      pick(p.painPoints, key, fallback),
    buyingFaq: () => faqList(p.buyingFaq),
    sellingFaq: () => faqList(p.sellingFaq),
    marketing: p.marketing,
    soleAgent: p.soleAgent as readonly string[],
  };
}

/** /selling-process evrak listesi — başlık + açıklama, sözlükten. */
export async function getSellingDocuments(): Promise<
  Record<string, { title: string; body: string }>
> {
  const dictionary = await getDictionary();
  return dictionary.sellingProcess.documents as Record<
    string,
    { title: string; body: string }
  >;
}

/**
 * /citizenship içeriği.
 *
 * ⚠️ EŞİK VE SÜRE YER TUTUCUYLA GEÇİYOR (`{threshold}`, `{years}`).
 * `lib/citizenship.ts` başındaki bakım notu, rakamın TEK bir yerden
 * geldiğini söylüyor — kararname değiştiğinde orası güncelleniyor.
 * Çevirilere rakamı gömseydik o söz üç dilde birden bozulur, üstelik
 * sessizce: sayfa çalışmaya devam eder, yalnızca yanlış rakamı gösterirdi.
 */
export async function getCitizenshipCopy(vars: {
  threshold: string;
  years: number;
}) {
  const dictionary = await getDictionary();
  const c = dictionary.citizenship;
  const fill = (text: string) => interpolateVars(text, vars);

  type Step = {
    title: string;
    summary: string;
    detail: string[];
    timing: string;
    owner: string;
  };

  return {
    step: (id: string, fallback: Step): Step => {
      const t = (c.steps as Record<string, Step | undefined>)[id] ?? fallback;
      return {
        ...t,
        title: fill(t.title),
        summary: fill(t.summary),
        detail: t.detail.map(fill),
      };
    },
    benefit: (key: string, fallback: { title: string; body: string }) => {
      const t =
        (c.benefits as Record<string, typeof fallback | undefined>)[key] ??
        fallback;
      return { title: fill(t.title), body: fill(t.body) };
    },
    documents: () => (c.documents as string[]).map(fill),
    faq: () =>
      [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
        question: fill((c.faq as Record<string, string>)[`q${n}`]),
        answer: fill((c.faq as Record<string, string>)[`a${n}`]),
      })),
  };
}

/**
 * /insurance içeriği.
 *
 * `status` alanı da çevriliyor: "Compulsory by law" ekranda rozet olarak
 * görünüyor ve sayfanın en önemli ayrımını (zorunlu vs. tavsiye) taşıyor —
 * İngilizce kalsaydı Türkçe sayfadaki en kritik bilgi çevrilmemiş olurdu.
 */
export async function getInsuranceCopy() {
  const dictionary = await getDictionary();
  const i = dictionary.insurance;

  type Policy = {
    name: string;
    status: string;
    summary: string;
    detail: string[];
  };

  return {
    policy: (id: string, fallback: Policy): Policy =>
      (i.policies as Record<string, Policy | undefined>)[id] ?? fallback,
    daskCovered: i.daskCovered as string[],
    daskNotCovered: i.daskNotCovered as string[],
    privateCovered: i.privateCovered as string[],
    privateNotCovered: i.privateNotCovered as string[],
    checklistItem: (key: string, fallback: { title: string; body: string }) =>
      (i.checklist as Record<string, typeof fallback | undefined>)[key] ??
      fallback,
    faq: () =>
      [1, 2, 3, 4, 5, 6, 7].map((n) => ({
        question: (i.faq as Record<string, string>)[`q${n}`],
        answer: (i.faq as Record<string, string>)[`a${n}`],
      })),
  };
}

/** /about — ilkeler ve "yapmadıklarımız" listesi. */
export async function getAboutCopy() {
  const dictionary = await getDictionary();
  const a = dictionary.about;

  return {
    principle: (key: string, fallback: { title: string; body: string }) =>
      (a.principles as Record<string, typeof fallback | undefined>)[key] ??
      fallback,
    notDoing: a.notDoing as string[],
  };
}

/** /viewing-day — dâhil olanlar, yapmadıklarımız ve SSS. */
export async function getViewingDayCopy() {
  const dictionary = await getDictionary();
  const v = dictionary.viewingDay;

  return {
    included: v.included as string[],
    notDoing: v.notDoing as string[],
    faq: () =>
      [1, 2, 3, 4, 5, 6].map((n) => ({
        question: (v.faq as Record<string, string>)[`q${n}`],
        answer: (v.faq as Record<string, string>)[`a${n}`],
      })),
  };
}

/**
 * GÖRSEL ALT METİNLERİ.
 *
 * `lib/imagery.ts` src ve alt'ı birlikte tutuyor; src dilsiz, alt değil.
 * Alt metni erişilebilirlik VE görsel aramada indekslenen bir sinyal —
 * Türkçe sayfada İngilizce alt metin, ekran okuyucu kullanıcısını sayfanın
 * geri kalanından kopuk bırakır.
 *
 * `silhouette` gibi DEKORATİF görseller sözlükte yok: onların `alt=""`
 * kalması gerekiyor, çevrilmesi değil. Boş alt, "bu görseli atla" demenin
 * doğru yolu; oraya metin koymak ekran okuyucuya gürültü ekler.
 */
export async function getImageAlt() {
  const dictionary = await getDictionary();
  const named = dictionary.imagery.named as Record<string, string | undefined>;
  const slides = dictionary.imagery.slides as string[];

  return {
    alt: (key: string, fallback: string) => named[key] ?? fallback,
    slideAlt: (index: number, fallback: string) => slides[index] ?? fallback,
  };
}
