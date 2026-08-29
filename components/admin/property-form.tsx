"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useState } from "react";
import { ArrowLeft, Loader2, Save, Trash2, TriangleAlert } from "lucide-react";
import {
  CheckboxField,
  SelectField,
  Section,
  TextArea,
  TextField,
} from "@/components/admin/form-fields";
import { ImageManager } from "@/components/admin/image-manager";
import { FeaturePicker } from "@/components/admin/feature-picker";
import { LocationPicker } from "@/components/admin/location-picker";
import { StringListField } from "@/components/admin/string-list-field";
import { LocaleTabs, type AdminLocale } from "@/components/admin/locale-tabs";
import { serviceAreas } from "@/lib/site";
import { slugify } from "@/lib/slugify";
import type { Villa, VillaImage, VillaStatus } from "@/lib/types";

/**
 * İLAN FORMU — ekleme ve düzenleme İÇİN AYNI BİLEŞEN.
 *
 * İki ayrı form yazmak, alan listesini iki yerde tutmak demekti; bir alan
 * eklendiğinde yalnız birine eklenmesi kaçınılmazdı. Fark tek bir prop'ta
 * toplanıyor: `existing` verilirse PATCH, verilmezse POST.
 *
 * Doğrulama İKİ katmanda:
 *   - burada, anında geri bildirim için (alan kırmızıya döner, mesaj çıkar);
 *   - sunucuda, `parsePropertyInput` içinde — asıl olan bu. İstemci
 *     doğrulaması bir KOLAYLIK, güvenlik sınırı değil: formu atlayıp
 *     doğrudan fetch atmak her zaman mümkün.
 */

const PROPERTY_TYPES = ["Detached villa", "Apartment", "Townhouse", "Land"];

/**
 * Tapu durumu — sunucudaki `DEED_STATUSES` beyaz listesiyle BİREBİR aynı
 * olmalı. Sunucu listede olmayan bir değeri boşa çeviriyor, yani buradaki
 * bir sapma sessizce veri kaybı olurdu.
 *
 * Liste `lib/admin/property-input.ts`ten import EDİLEMİYOR: o modül
 * `server-only` (safeSlugSegment üzerinden `node:fs`e bağlı) ve bu bir
 * istemci bileşeni.
 */
const DEED_STATUS_OPTIONS = [
  { value: "", label: "Not specified" },
  { value: "Freehold (TAPU)", label: "Freehold (TAPU)" },
  { value: "Leasehold", label: "Leasehold" },
  { value: "Condominium (Kat Mülkiyeti)", label: "Condominium (Kat Mülkiyeti)" },
  {
    value: "Construction servitude (Kat İrtifakı)",
    label: "Construction servitude (Kat İrtifakı)",
  },
  { value: "Shared title (Hisseli)", label: "Shared title (Hisseli)" },
];

const STATUSES: { value: VillaStatus; label: string }[] = [
  { value: "for-sale", label: "For sale" },
  { value: "reserved", label: "Reserved" },
  { value: "sold", label: "Sold" },
  { value: "off-market", label: "Off market (hidden from the site)" },
];

type Errors = Record<string, string>;

export function PropertyForm({
  existing,
  /*
    Portföyde geçen özellikler — açılır listeyi besliyor.

    Varsayılan boş dizi: prop opsiyonel kalsın ki bileşen liste olmadan da
    çalışsın. O durumda seçici serbest girişe düşüyor, yani ESKİ davranış —
    bozulan bir şey yok, yalnızca hızlandırma devre dışı.
  */
  knownFeatures = [],
}: {
  existing?: Villa;
  knownFeatures?: string[];
}) {
  const router = useRouter();
  const isEdit = Boolean(existing);

  /* `headline` de üç dilli — durum aşağıdaki dil bloğunda kuruluyor. */
  const [propertyType, setPropertyType] = useState(
    existing?.propertyType ?? PROPERTY_TYPES[0],
  );
  const [areaSlug, setAreaSlug] = useState(existing?.location.areaSlug ?? "");
  const [status, setStatus] = useState<VillaStatus>(existing?.status ?? "for-sale");
  const [featured, setFeatured] = useState(existing?.featured ?? false);

  const [price, setPrice] = useState(String(existing?.price.gbp ?? ""));
  const [bedrooms, setBedrooms] = useState(String(existing?.bedrooms ?? ""));
  const [bathrooms, setBathrooms] = useState(String(existing?.bathrooms ?? ""));
  const [buildSize, setBuildSize] = useState(String(existing?.buildSizeSqm ?? ""));
  const [plotSize, setPlotSize] = useState(String(existing?.plotSizeSqm ?? ""));

  /*
    ─────────────────────────── ÜÇ DİLLİ METİN ALANLARI ───────────────────
    `title`, `description` ve `whyThisOne` artık dil başına bir değer
    tutuyor (bkz. lib/localized.ts). Form durumu bu yüzden düz bir dize
    değil, `Record<AdminLocale, …>`.

    ⚠️ BOŞ DİZE = ÇEVİRİ YOK. Veride `null` yazıyoruz ama formda `""`
    tutuyoruz: `<input value={null}>` React'te kontrolsüz bileşen uyarısı
    üretir. Dönüşüm gönderim anında, tek yerde yapılıyor (`toLocalized*`).
  */
  const [activeLocale, setActiveLocale] = useState<AdminLocale>("en");

  const [title, setTitle] = useState<Record<AdminLocale, string>>({
    en: existing?.title.en ?? "",
    tr: existing?.title.tr ?? "",
    ru: existing?.title.ru ?? "",
  });

  const [headline, setHeadline] = useState<Record<AdminLocale, string>>({
    en: existing?.headline.en ?? "",
    tr: existing?.headline.tr ?? "",
    ru: existing?.headline.ru ?? "",
  });

  /*
    Açıklama ekranda TEK bir metin alanı, veride ise paragraf DİZİSİ
    (her eleman bir <p>). Boş satırla ayırmak, yöneticiye markdown veya
    HTML öğretmeden paragraf kurmanın en doğal yolu.
  */
  const [description, setDescription] = useState<Record<AdminLocale, string>>({
    en: (existing?.description.en ?? []).join("\n\n"),
    tr: (existing?.description.tr ?? []).join("\n\n"),
    ru: (existing?.description.ru ?? []).join("\n\n"),
  });
  /*
    Özellikler artık DİZİ, virgülle ayrılmış dize değil.

    Eski hâlinde durum bir metin alanıydı ve her gönderimde `split(",")`
    ile parçalanıyordu. Rozet arayüzü bunu sürdüremezdi: bir rozeti
    kaldırmak, dizenin içinden doğru virgül aralığını kesip çıkarmak
    demekti — ve içinde virgül geçen bir özellik ("Kitchen, fully fitted")
    o işlemi sessizce bozardı.
  */
  /*
    ⚠️ ROZETLER ARTIK DİL BAŞINA. Önceki not "features çevrilmiyor" diyordu;
    o karar geri alındı (gerekçe lib/types.ts).

    İngilizce liste KANONİK: `knownFeatures` seçicisi ondan besleniyor ve
    diğer diller onun çevirisi. Bu yüzden seçici yalnızca `en` sekmesinde
    öneri gösteriyor — Türkçe sekmede İngilizce öneri sunmak, yöneticiyi
    kanonik değeri Türkçe alana yazmaya davet ederdi.
  */
  const [features, setFeatures] = useState<Record<AdminLocale, string[]>>({
    en: existing?.features.en ?? [],
    tr: existing?.features.tr ?? [],
    ru: existing?.features.ru ?? [],
  });

  /*
    "Why this one" maddeleri — DİZİ olarak tutuluyor, `features` gibi tek bir
    dize olarak değil.

    Fark kasıtlı: `features` rozet ("Sea view"), bunlar cümle ("Walking
    distance to the marina and the Tuesday market"). Virgülle ayrılmış tek
    bir alanda, içinde virgül geçen ilk cümle sessizce ikiye bölünürdü.

    `?? []` gerekli: alan sonradan eklendi ve `Villa.whyThisOne` opsiyonel,
    yani daha önce kaydedilmiş bir ilan onu taşımayabilir.
  */
  const [whyThisOne, setWhyThisOne] = useState<Record<AdminLocale, string[]>>({
    en: existing?.whyThisOne?.en ?? [],
    tr: existing?.whyThisOne?.tr ?? [],
    ru: existing?.whyThisOne?.ru ?? [],
  });

  /* Slug düzenlemede DOKUNULMAZ varsayılan: değiştirmek canlı bir URL'i
     kırar ve gelen bağlantıları 404'e düşürür. Yine de elle değiştirilebilir. */
  const [slug, setSlug] = useState(existing?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);

  const [seoTitle, setSeoTitle] = useState<Record<AdminLocale, string>>({
    en: existing?.seo.title.en ?? "",
    tr: existing?.seo.title.tr ?? "",
    ru: existing?.seo.title.ru ?? "",
  });
  const [seoDescription, setSeoDescription] = useState<Record<AdminLocale, string>>({
    en: existing?.seo.description.en ?? "",
    tr: existing?.seo.description.tr ?? "",
    ru: existing?.seo.description.ru ?? "",
  });

  const [images, setImages] = useState<VillaImage[]>(existing?.images ?? []);

  const [reference, setReference] = useState(existing?.reference ?? "");
  const [deedStatus, setDeedStatus] = useState(existing?.deedStatus ?? "");

  /*
    Koordinatlar DİZE olarak tutuluyor, sayı olarak değil.

    Sebep: `isPlaceholder` true olan 21 taşınmış ilanda koordinat alanı
    Miami'yi gösteren çöp veri. Bunları forma önceden doldurmak, yöneticiye
    "burası doğru" demek olurdu — o yüzden yalnızca GERÇEK sayılan
    koordinatlar dolduruluyor, gerisi boş açılıyor.

    Dize olması ayrıca "boş" ile "0" ayrımını koruyor: sayı state'inde
    ikisi de 0 olurdu ve boş bırakılan bir alan geçerli bir koordinat
    gibi kaydedilirdi.
  */
  const hasRealCoords = Boolean(existing && !existing.location.isPlaceholder);
  const [latitude, setLatitude] = useState(
    hasRealCoords ? String(existing!.location.coordinates.lat) : "",
  );
  const [longitude, setLongitude] = useState(
    hasRealCoords ? String(existing!.location.coordinates.lng) : "",
  );

  /**
   * HARİTANIN FORMA YAZDIĞI TEK KAPI — enlem ve boylam BİRLİKTE.
   *
   * İki ayrı setter'ı haritadan çağırmak, aralarında bir render'ın
   * sıkışabileceği bir aralık bırakıyordu: o an durum "enlem yeni, boylam
   * eski", yani var olmayan bir konum. Pin o karede görünür biçimde
   * zıplıyordu. Tek çağrı ikisini aynı toplu güncellemeye koyuyor.
   *
   * `useCallback` süs değil: `LocationPicker` bu referansı Leaflet
   * işaretçisinin olay yöneticilerine bağlıyor. Her render'da yeni bir
   * fonksiyon vermek, sürükleme sırasında dinleyicileri sökmek ve yeniden
   * bağlamak demekti.
   */
  const setCoordinates = useCallback((lat: string, lng: string) => {
    setLatitude(lat);
    setLongitude(lng);
  }, []);

  /**
   * HATA DURUMU — iki kaynak, biri TÜRETİLMİŞ.
   *
   * ⚠️ Bu başta `useState` ile tutuluyordu ve gözle görülür bir hataya yol
   * açıyordu: hatalar yalnızca gönderim anında hesaplandığı için, yönetici
   * eksik alanı doldurduktan SONRA da "Title is required." yazısı ekranda
   * kalıyordu. Dolu bir alanın altında duran kırmızı bir mesaj, formun
   * bozuk olduğu izlenimi veriyor.
   *
   * Çözüm: istemci hataları durum DEĞİL, her render'da yeniden hesaplanan
   * türetilmiş bir değer. `submitted` bayrağı da onları ilk gönderim
   * denemesinden ÖNCE göstermiyor — kullanıcı daha yazmaya başlamadan
   * kırmızı bir formla karşılaşmamalı.
   */
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /** Başlık yazılırken slug canlı türetilir — yönetici elle değiştirene kadar. */
  /*
    ⚠️ SLUG DAİMA İNGİLİZCE BAŞLIKTAN. Türkçe sekmesinde yazarken URL'in
    değişmesi, canlı bir ilanın adresini sessizce kırardı — üstelik dil
    başına farklı bir slug üretmek üç ayrı kayıt izlenimi verirdi.
  */
  const effectiveSlug = slugTouched ? slugify(slug) : slugify(title.en);

  const validate = (): Errors => {
    const next: Errors = {};
    /* Yalnızca İNGİLİZCE zorunlu: TR/RU boş bırakılabilir, site onları
       İngilizceye düşürerek gösterir (bkz. getLocalizedField). */
    if (!title.en.trim()) next.title = "English title is required.";
    if (!(Number(price) > 0)) next.priceGbp = "Enter a price greater than zero.";
    if (!areaSlug) next.areaSlug = "Choose an area.";
    if (!effectiveSlug) next.slug = "Could not build a URL from this title.";

    /* İkisi birden ya da hiçbiri — tek koordinat haritayı ekvatora çakar. */
    const latFilled = latitude.trim() !== "";
    const lngFilled = longitude.trim() !== "";

    if (latFilled && !(Math.abs(Number(latitude)) <= 90) ) {
      next.latitude = "Must be a number between -90 and 90.";
    }
    if (lngFilled && !(Math.abs(Number(longitude)) <= 180)) {
      next.longitude = "Must be a number between -180 and 180.";
    }
    if (latFilled !== lngFilled) {
      next[latFilled ? "longitude" : "latitude"] =
        "Enter both, or leave both blank.";
    }

    return next;
  };

  const clientErrors = validate();

  /* Sunucu hataları üstte: istemcinin geçerli saydığı ama sunucunun
     reddettiği bir değer varsa (ör. slug çakışması) o mesaj kazanmalı. */
  const errors: Errors = submitted
    ? { ...clientErrors, ...serverErrors }
    : serverErrors;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setServerErrors({});
    setSubmitted(true);

    if (Object.keys(clientErrors).length > 0) {
      /*
        İlk hatalı alana kaydır ve odakla. Uzun bir formda sayfanın
        altındaki "Save" düğmesine basan yönetici, yukarıdaki hatayı
        aksi hâlde hiç görmez ve düğmenin bozuk olduğunu sanır.
      */
      const firstInvalid = document.querySelector<HTMLElement>("[aria-invalid='true']");
      firstInvalid?.scrollIntoView({ block: "center", behavior: "smooth" });
      firstInvalid?.focus({ preventScroll: true });
      return;
    }

    setSaving(true);

    /*
      TODO: Trigger DeepL translation queue for empty TR/RU fields here in the future
      (boş dilleri `missingLocales()` ile tespit edip kuyruğa yollayın —
      lib/localized.ts).
    */

    const payload = {
      title: toLocalizedText(title),
      headline: toLocalizedText(headline),
      propertyType,
      areaSlug,
      status,
      featured,
      priceGbp: Number(price),
      bedrooms: Number(bedrooms) || 0,
      bathrooms: Number(bathrooms) || 0,
      buildSizeSqm: Number(buildSize) || 0,
      plotSizeSqm: Number(plotSize) || 0,
      slug: effectiveSlug,
      /* Boş satırla bölünmüş paragraflar → dizi, dil başına. */
      description: toLocalizedList(description, splitParagraphs),
      features: toLocalizedList(features, (value) => value),
      whyThisOne: toLocalizedList(whyThisOne, (value) => value),
      images,
      seoTitle: toLocalizedText(seoTitle),
      seoDescription: toLocalizedText(seoDescription),
      reference: reference.trim(),
      deedStatus,
      /* Boş dize gönderiliyor, 0 değil: sunucu boşu "girilmedi" sayıyor. */
      latitude: latitude.trim(),
      longitude: longitude.trim(),
    };

    try {
      const response = await fetch(
        isEdit ? `/api/admin/properties/${existing!.slug}` : "/api/admin/properties",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        /* Sunucu alan bazlı hata döndüyse onu forma yansıt. */
        if (result.errors) setServerErrors(result.errors);
        setFormError(result.error ?? "The listing could not be saved.");
        return;
      }

      /*
        `refresh()` + `push()` birlikte: panel sayfaları `force-dynamic`
        ama router'ın istemci önbelleği eski listeyi tutabiliyor.
        Yenilemeden yönlendirirsek yönetici az önce kaydettiği kaydı
        listede göremez ve iki kez kaydetmeye çalışır.
      */
      router.refresh();
      router.push("/admin/properties");
    } catch {
      setFormError("Network error — the listing was not saved.");
    } finally {
      setSaving(false);
    }
  };

  const destroy = async () => {
    if (!existing) return;

    const confirmed = window.confirm(
      `Delete “${existing.title}” permanently?\n\nThis removes the listing and its photographs. It cannot be undone.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/properties/${existing.slug}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setFormError("The listing could not be deleted.");
        return;
      }

      router.refresh();
      router.push("/admin/properties");
    } catch {
      setFormError("Network error — the listing was not deleted.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      noValidate
      /*
        Sunucu hataları istemcide yeniden hesaplanamaz (slug çakışması gibi
        şeyleri yalnızca sunucu bilir), o yüzden kullanıcı herhangi bir
        alana dokunur dokunmaz temizleniyorlar. `change` olayı form
        kontrollerinden yukarı kabardığı için tek bir dinleyici yetiyor.
      */
      onChange={() => setServerErrors({})}
    >
      {/* ------------------------------------------------------- BAŞLIK */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/admin/properties"
            className="inline-flex items-center gap-1.5 font-sans text-xs uppercase tracking-[0.14em] text-ink-40 transition-colors hover:text-sea"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            All properties
          </Link>
          <h1 className="mt-2 truncate font-display text-3xl text-sea-deep sm:text-4xl">
            {isEdit ? existing!.title.en : "New property"}
          </h1>
          {effectiveSlug ? (
            <p className="mt-1.5 font-mono text-xs text-ink-40">
              /properties/{effectiveSlug}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          {isEdit ? (
            <button
              type="button"
              onClick={destroy}
              disabled={deleting || saving}
              className="inline-flex items-center gap-2 rounded-sm border border-line px-4 py-3 font-sans text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-ink-70 transition-colors hover:border-gold-deep hover:text-gold-deep disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="size-3.5" aria-hidden="true" />
              )}
              Delete
            </button>
          ) : null}

          <button
            type="submit"
            disabled={saving || deleting}
            className="inline-flex items-center gap-2 bg-sea-deep px-6 py-3 font-sans text-xs font-bold uppercase tracking-widest text-shell transition-colors hover:bg-gold hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Saving…
              </>
            ) : (
              <>
                <Save className="size-4" aria-hidden="true" />
                {isEdit ? "Save changes" : "Create listing"}
              </>
            )}
          </button>
        </div>
      </header>

      {formError ? (
        <p
          role="alert"
          className="mt-6 flex items-start gap-2 rounded-sm border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold-deep"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {formError}
        </p>
      ) : null}

      <div className="mt-8 space-y-6">
        {/* ------------------------------------------------------ TEMEL */}
        <Section
          title="The basics"
          description="Title and price are required. Everything else can be filled in later."
          columns={2}
        >
          {/*
            ÜÇ DİLLİ BAŞLIK. Sekme yalnızca hangi dilin DÜZENLENDİĞİNİ
            değiştiriyor; üç değer de durumda duruyor, sekme değiştirmek
            yazılanı kaybetmiyor.
          */}
          <div className="sm:col-span-2">
            <div className="mb-2 flex items-center justify-between gap-3">
              <LocaleTabs
                idPrefix="Title"
                active={activeLocale}
                onChange={setActiveLocale}
                filled={localeFilled(title)}
              />
              {activeLocale !== "en" ? (
                <span className="text-[0.6875rem] text-ink-40">
                  Leave empty to show the English title
                </span>
              ) : null}
            </div>
            <TextField
              label={`Title (${activeLocale.toUpperCase()})`}
              required={activeLocale === "en"}
              value={title[activeLocale]}
              onChange={(value) =>
                setTitle((current) => ({ ...current, [activeLocale]: value }))
              }
              /* Hata yalnızca İngilizce sekmesinde: zorunluluk orada. */
              error={activeLocale === "en" ? errors.title : undefined}
              placeholder="Villa Meltem"
            />
          </div>

          <div className="sm:col-span-2">
            <div className="mb-2 flex items-center justify-between gap-3">
              <LocaleTabs
                idPrefix="Headline"
                active={activeLocale}
                onChange={setActiveLocale}
                filled={localeFilled(headline)}
              />
              {activeLocale !== "en" ? (
                <span className="text-[0.6875rem] text-ink-40">
                  Leave empty to show the English headline
                </span>
              ) : null}
            </div>
            <TextField
              label={`Headline (${activeLocale.toUpperCase()})`}
              hint="One sentence, shown under the title"
              value={headline[activeLocale]}
              onChange={(value) =>
                setHeadline((current) => ({ ...current, [activeLocale]: value }))
              }
              placeholder="A five-bedroom villa above Göcek marina with an infinity pool."
            />
          </div>

          <SelectField
            label="Property type"
            value={propertyType}
            onChange={setPropertyType}
            options={PROPERTY_TYPES.map((type) => ({ value: type, label: type }))}
          />

          <SelectField
            label="Area"
            required
            value={areaSlug}
            onChange={setAreaSlug}
            error={errors.areaSlug}
            options={[
              { value: "", label: "Choose an area…" },
              ...serviceAreas.map((area) => ({
                value: area.slug,
                label: area.name,
              })),
            ]}
          />

          <SelectField
            label="Status"
            value={status}
            onChange={(value) => setStatus(value as VillaStatus)}
            options={STATUSES}
          />

          <div className="flex items-end">
            <CheckboxField
              label="Feature on the homepage"
              description="Featured listings appear in the homepage carousel."
              checked={featured}
              onChange={setFeatured}
            />
          </div>
        </Section>

        {/* ------------------------------------------------ ÖLÇÜ / FİYAT */}
        <Section
          title="Price and dimensions"
          description="Prices are stored in GBP. Visitors can switch currency on the site; the conversion happens at display time."
          columns={3}
        >
          <TextField
            label="Price"
            required
            type="number"
            min={0}
            value={price}
            onChange={setPrice}
            error={errors.priceGbp}
            suffix="GBP"
            placeholder="845000"
          />
          <TextField
            label="Bedrooms"
            type="number"
            min={0}
            value={bedrooms}
            onChange={setBedrooms}
          />
          <TextField
            label="Bathrooms"
            type="number"
            min={0}
            value={bathrooms}
            onChange={setBathrooms}
          />
          <TextField
            label="Internal size"
            type="number"
            min={0}
            value={buildSize}
            onChange={setBuildSize}
            suffix="m²"
            hint="0 hides it"
          />
          <TextField
            label="Plot size"
            type="number"
            min={0}
            value={plotSize}
            onChange={setPlotSize}
            suffix="m²"
            hint="0 hides it"
          />
        </Section>

        {/* ----------------------------------------------------- İÇERİK */}
        <Section
          title="Description and features"
          description="Separate paragraphs with a blank line. Features become the badges shown on the listing."
          columns={1}
        >
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <LocaleTabs
                idPrefix="Description"
                active={activeLocale}
                onChange={setActiveLocale}
                filled={localeFilled(description)}
              />
              {activeLocale !== "en" ? (
                <span className="text-[0.6875rem] text-ink-40">
                  Leave empty to show the English description
                </span>
              ) : null}
            </div>
            <TextArea
              label={`Description (${activeLocale.toUpperCase()})`}
              value={description[activeLocale]}
              onChange={(value) =>
                setDescription((current) => ({
                  ...current,
                  [activeLocale]: value,
                }))
              }
              rows={10}
              hint="Blank line = new paragraph"
              placeholder={"First paragraph.\n\nSecond paragraph."}
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <LocaleTabs
                idPrefix="Features"
                active={activeLocale}
                onChange={setActiveLocale}
                filled={localeFilled(features)}
              />
              {activeLocale !== "en" ? (
                <span className="text-[0.6875rem] text-ink-40">
                  Leave empty to show the English badges
                </span>
              ) : null}
            </div>
            <FeaturePicker
              label={`Features (${activeLocale.toUpperCase()})`}
              selected={features[activeLocale]}
              /*
                ÖNERİ LİSTESİ YALNIZCA İNGİLİZCE SEKMESİNDE. `knownFeatures`
                portföyün KANONİK (`en`) rozetlerinden derleniyor
                (lib/villas.ts); Türkçe sekmede sunmak, yöneticiyi İngilizce
                bir değeri Türkçe alana yazmaya davet ederdi.
              */
              known={activeLocale === "en" ? knownFeatures : []}
              onChange={(items) =>
                setFeatures((current) => ({ ...current, [activeLocale]: items }))
              }
              /* Sunucudaki `asLocalizedStringArray(raw.features, 40, 80)` ile
                 AYNI sınırlar — ayrışırlarsa form sunucunun atacağı bir
                 değeri kabul etmiş olur. */
              maxItems={40}
              maxLength={80}
              placeholder="Type a new feature…"
            />
          </div>
        </Section>

        {/* ------------------------------------------------ WHY THIS ONE */}
        <Section
          title="Why this one"
          description="The selling points shown in a two-column grid near the top of the listing page. Leave it empty and the section does not appear at all."
          columns={1}
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <LocaleTabs
              idPrefix="Selling points"
              active={activeLocale}
              onChange={setActiveLocale}
              filled={localeFilled(whyThisOne)}
            />
            {activeLocale !== "en" ? (
              <span className="text-[0.6875rem] text-ink-40">
                Leave empty to show the English points
              </span>
            ) : null}
          </div>
          <StringListField
            label={`Selling points (${activeLocale.toUpperCase()})`}
            items={whyThisOne[activeLocale]}
            onChange={(items) =>
              setWhyThisOne((current) => ({
                ...current,
                [activeLocale]: items,
              }))
            }
            addLabel="Add"
            /* Sunucudaki `asStringArray(raw.whyThisOne, 12, 200)` ile AYNI
               sınırlar. Ayrışırlarsa form 13. maddeyi kabul eder, sunucu
               sessizce atar ve yönetici kaybı ancak sayfada fark eder. */
            maxItems={12}
            maxLength={200}
            placeholder="Walking distance to the marina and the Tuesday market"
          />
        </Section>

        {/* -------------------------------------------- KONUM & TAPU */}
        <Section
          title="Location and title deed"
          description="Click the map to place the property's pin, or drag it to fine-tune. Leave the map untouched and the listing falls back to the centre of the chosen area."
          columns={2}
        >
          <div className="sm:col-span-2">
            <LocationPicker
              latitude={latitude}
              longitude={longitude}
              onChange={setCoordinates}
              areaSlug={areaSlug}
              /*
                İki alanın hatası TEK bir mesajda toplanıyor: harita da tek
                bir denetim. "Enlem geçersiz" ile "boylam geçersiz"i ayrı
                ayrı göstermenin, altında sayı kutusu olmayan bir haritada
                karşılığı yok.
              */
              error={errors.latitude ?? errors.longitude}
            />
          </div>

          {/*
            SAYI ALANLARI DURUYOR — ama artık İKİNCİL.

            Kaldırılmadılar çünkü iki gerçek iş görüyorlar: (1) elde hazır
            bir koordinat varsa yapıştırmak sürüklemekten hızlı, (2)
            kaydedilecek değeri tam hâliyle GÖSTERİYORLAR — harita yalnızca
            bir pin çiziyor, sayıyı okutmuyor.

            Bağlantı çift yönlü: buraya yazılan değer haritadaki pini
            oynatıyor, haritada oynatılan pin buradaki sayıyı yazıyor.
            İkisi de aynı state'i okuyup yazdığı için ayrışmaları mümkün
            değil.
          */}
          <TextField
            label="Latitude"
            type="text"
            value={latitude}
            onChange={setLatitude}
            error={errors.latitude}
            hint="Set by the map — or paste"
            placeholder="36.7522"
          />
          <TextField
            label="Longitude"
            type="text"
            value={longitude}
            onChange={setLongitude}
            error={errors.longitude}
            hint="Set by the map — or paste"
            placeholder="28.9403"
          />

          <SelectField
            label="Title deed status"
            value={deedStatus}
            onChange={setDeedStatus}
            options={DEED_STATUS_OPTIONS}
          />

          <TextField
            label="Reference code"
            value={reference}
            onChange={setReference}
            hint={isEdit ? "Internal listing code" : "Auto-generated if blank"}
            placeholder="C2C-GOC-01234"
          />
        </Section>

        {/* ------------------------------------------------------ MEDYA */}
        <section className="border border-line bg-shell p-6 sm:p-8">
          <ImageManager
            slug={effectiveSlug}
            /* Alt metin tabanı kaynak dilden: görsel dosyaları dile göre
               değişmiyor, tek bir kayda ait. */
            altBase={title.en || "Property"}
            images={images}
            onChange={setImages}
          />
        </section>

        {/* -------------------------------------------------------- SEO */}
        <Section
          title="Search engine listing"
          description="Leave blank and the site falls back to the title and first paragraph."
          columns={1}
        >
          <TextField
            label="URL slug"
            value={slugTouched ? slug : effectiveSlug}
            onChange={(value) => {
              setSlugTouched(true);
              setSlug(value);
            }}
            error={errors.slug}
            hint={
              isEdit
                ? "⚠ Changing this breaks existing links to the listing"
                : "Derived from the title"
            }
          />
          {/*
            ⚠️ SEKMELER İKİ ALAN İÇİN ORTAK. Meta başlık ve meta açıklama
            aynı arama sonucunun iki satırı; ayrı sekme çiftleri, yöneticiyi
            birini TR birini EN sekmesinde bırakıp yarım çevrilmiş bir
            snippet kaydetmeye açık hâle getirirdi.

            Sayaçlar (70/180) AKTİF DİLİN uzunluğunu sayıyor: Türkçe bir
            başlık İngilizcesinden uzun olabilir ve sınırı aşan dil hangisiyse
            onu görmek gerekiyor.
          */}
          <div className="sm:col-span-2">
            <div className="mb-2 flex items-center justify-between gap-3">
              <LocaleTabs
                idPrefix="Search snippet"
                active={activeLocale}
                onChange={setActiveLocale}
                filled={localeFilled(seoTitle)}
              />
              {activeLocale !== "en" ? (
                <span className="text-[0.6875rem] text-ink-40">
                  Leave empty to show the English snippet
                </span>
              ) : null}
            </div>
          </div>
          <TextField
            label={`Meta title (${activeLocale.toUpperCase()})`}
            value={seoTitle[activeLocale]}
            onChange={(value) =>
              setSeoTitle((current) => ({ ...current, [activeLocale]: value }))
            }
            hint={`${seoTitle[activeLocale].length}/70`}
            placeholder="Detached villa for sale in Göcek | 5 Beds"
          />
          <TextArea
            label={`Meta description (${activeLocale.toUpperCase()})`}
            value={seoDescription[activeLocale]}
            onChange={(value) =>
              setSeoDescription((current) => ({
                ...current,
                [activeLocale]: value,
              }))
            }
            rows={3}
            hint={`${seoDescription[activeLocale].length}/180`}
            placeholder="5-bedroom detached villa for sale in Göcek, Fethiye. £845,000."
          />
        </Section>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ i18n */

/** Boş satırla ayrılmış metni paragraf dizisine böler. */
function splitParagraphs(value: string): string[] {
  return value
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

/**
 * ⚠️ BOŞ ÇEVİRİ `null` OLARAK GİDER, `""` OLARAK DEĞİL.
 *
 * İkisi veride farklı şey söylüyor: `""` "yönetici boş bir çeviri kaydetti",
 * `null` ise "bu dil henüz çevrilmedi". Ayrım DeepL kuyruğu için kritik —
 * kuyruk `null` olanları arayacak. Ayrıca `getLocalizedField` boş dizeyi
 * zaten yedeğe düşürüyor, yani ekranda fark yok; fark yalnızca NİYETTE.
 */
function toLocalizedText(value: Record<AdminLocale, string>) {
  return {
    en: value.en.trim(),
    tr: value.tr.trim() || null,
    ru: value.ru.trim() || null,
  };
}

/** Aynı kural liste alanları için (`description`, `whyThisOne`). */
function toLocalizedList<T>(
  value: Record<AdminLocale, T>,
  toList: (value: T) => string[],
) {
  const en = toList(value.en);
  const tr = toList(value.tr);
  const ru = toList(value.ru);

  return {
    en,
    tr: tr.length ? tr : null,
    ru: ru.length ? ru : null,
  };
}

/** Sekme rozetleri için: bu dilde içerik var mı? */
export function localeFilled(
  value: Record<AdminLocale, string | string[]>,
): Record<AdminLocale, boolean> {
  const has = (v: string | string[]) =>
    Array.isArray(v) ? v.length > 0 : v.trim().length > 0;

  return { en: has(value.en), tr: has(value.tr), ru: has(value.ru) };
}
