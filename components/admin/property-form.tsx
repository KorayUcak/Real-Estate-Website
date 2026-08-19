"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Loader2, Save, Trash2, TriangleAlert } from "lucide-react";
import {
  CheckboxField,
  SelectField,
  Section,
  TextArea,
  TextField,
} from "@/components/admin/form-fields";
import { ImageManager } from "@/components/admin/image-manager";
import { cn } from "@/lib/cn";
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

export function PropertyForm({ existing }: { existing?: Villa }) {
  const router = useRouter();
  const isEdit = Boolean(existing);

  const [title, setTitle] = useState(existing?.title ?? "");
  const [headline, setHeadline] = useState(existing?.headline ?? "");
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
    Açıklama ekranda TEK bir metin alanı, veride ise paragraf DİZİSİ
    (her eleman bir <p>). Boş satırla ayırmak, yöneticiye markdown veya
    HTML öğretmeden paragraf kurmanın en doğal yolu.
  */
  const [description, setDescription] = useState(
    (existing?.description ?? []).join("\n\n"),
  );
  const [features, setFeatures] = useState((existing?.features ?? []).join(", "));

  /* Slug düzenlemede DOKUNULMAZ varsayılan: değiştirmek canlı bir URL'i
     kırar ve gelen bağlantıları 404'e düşürür. Yine de elle değiştirilebilir. */
  const [slug, setSlug] = useState(existing?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);

  const [seoTitle, setSeoTitle] = useState(existing?.seo.title ?? "");
  const [seoDescription, setSeoDescription] = useState(
    existing?.seo.description ?? "",
  );

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
  const effectiveSlug = slugTouched ? slugify(slug) : slugify(title);

  const validate = (): Errors => {
    const next: Errors = {};
    if (!title.trim()) next.title = "Title is required.";
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

    const payload = {
      title: title.trim(),
      headline: headline.trim(),
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
      /* Boş satırla bölünmüş paragraflar → dizi. */
      description: description
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean),
      features: features
        .split(",")
        .map((feature) => feature.trim())
        .filter(Boolean),
      images,
      seoTitle: seoTitle.trim(),
      seoDescription: seoDescription.trim(),
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
            {isEdit ? existing!.title : "New property"}
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
          <div className="sm:col-span-2">
            <TextField
              label="Title"
              required
              value={title}
              onChange={setTitle}
              error={errors.title}
              placeholder="Villa Meltem"
            />
          </div>

          <div className="sm:col-span-2">
            <TextField
              label="Headline"
              hint="One sentence, shown under the title"
              value={headline}
              onChange={setHeadline}
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
          <TextArea
            label="Description"
            value={description}
            onChange={setDescription}
            rows={10}
            hint="Blank line = new paragraph"
            placeholder={"First paragraph.\n\nSecond paragraph."}
          />
          <TextArea
            label="Features"
            value={features}
            onChange={setFeatures}
            rows={3}
            hint="Comma separated"
            placeholder="Private pool, Sea view, Underfloor heating"
          />
        </Section>

        {/* -------------------------------------------- KONUM & TAPU */}
        <Section
          title="Location and title deed"
          description="Coordinates place the exact pin on the listing map. Leave them blank and the map falls back to the centre of the chosen area."
          columns={2}
        >
          <TextField
            label="Latitude"
            type="text"
            value={latitude}
            onChange={setLatitude}
            error={errors.latitude}
            hint="e.g. 36.7522"
            placeholder="36.7522"
          />
          <TextField
            label="Longitude"
            type="text"
            value={longitude}
            onChange={setLongitude}
            error={errors.longitude}
            hint="e.g. 28.9403"
            placeholder="28.9403"
          />

          <div className="sm:col-span-2">
            {/*
              Yöneticiye pinin şu an ne göstereceğini AÇIKÇA söylüyoruz.
              Bu bilgi olmadan "koordinat girmezsem ne olur" sorusunun
              cevabı görünmüyor ve 21 taşınmış ilan sessizce yaklaşık
              konumda kalmaya devam ederdi.
            */}
            <p
              className={cn(
                "rounded-sm border px-4 py-3 text-sm",
                latitude.trim() && longitude.trim()
                  ? "border-line bg-sea-tint text-sea-deep"
                  : "border-line bg-shell-deep text-ink-40",
              )}
            >
              {latitude.trim() && longitude.trim()
                ? "Exact pin — the map will show this position."
                : "Approximate — the map will show the centre of the selected area instead."}
            </p>
          </div>

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
            altBase={title || "Property"}
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
          <TextField
            label="Meta title"
            value={seoTitle}
            onChange={setSeoTitle}
            hint={`${seoTitle.length}/70`}
            placeholder="Detached villa for sale in Göcek | 5 Beds"
          />
          <TextArea
            label="Meta description"
            value={seoDescription}
            onChange={setSeoDescription}
            rows={3}
            hint={`${seoDescription.length}/180`}
            placeholder="5-bedroom detached villa for sale in Göcek, Fethiye. £845,000."
          />
        </Section>
      </div>
    </form>
  );
}
