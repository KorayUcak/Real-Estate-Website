import {
  GraduationCap,
  Plane,
  ShoppingBasket,
  Stethoscope,
  Sun,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * /about-turkey içeriği.
 *
 * Bölge açıklamaları eski sitedeki metinlerden genişletildi. `serviceAreas`
 * (lib/site.ts) görsel ve slug'ı taşır; buradaki `AREA_DETAIL` ise o bölgeye
 * ait uzun anlatımı ekler. İkisini ayrı tutmanın sebebi: serviceAreas aynı
 * zamanda footer ve schema `areaServed` alanını besliyor — oraya uzun metin
 * koymak o kullanımları şişirirdi.
 */

/** slug → uzun bölge anlatımı. serviceAreas ile aynı slug'ları kullanır. */
export const AREA_DETAIL: Record<
  string,
  { intro: string; points: string[]; bestFor: string }
> = {
  "fethiye-centre": {
    intro:
      "Fethiye is a genuine working town rather than a resort built for the summer. The harbour is busy in February, the Tuesday and Friday markets run all year, and the three-mile promenade stays open when the resort belt has shuttered.",
    points: [
      "A Lycian rock-tomb hillside and a Roman amphitheatre sit inside the town itself, not on a coach trip from it.",
      "Tuesday and Friday markets are the weekly rhythm of the town — produce, textiles and a great deal of noise.",
      "Full-time amenities: state and private hospitals, banks, schools, and an airport transfer of roughly 45 minutes.",
      "The most active winter season on this coast, which matters enormously if you intend to live here rather than visit.",
    ],
    bestFor: "Year-round living and the most defensive resale market",
  },
  oludeniz: {
    intro:
      "Ölüdeniz is Türkiye's most photographed stretch of coast and the reason many buyers first look at this region. The Blue Lagoon is a protected national park, which means the view you buy cannot be built out behind you.",
    points: [
      "The Blue Lagoon sits within a protected nature park — the setting is permanent, not subject to the next planning application.",
      "Babadağ above the bay is one of the world's best-known paragliding sites and hosts the International Air Games each autumn.",
      "The strongest short-let demand in the Fethiye region, reliably from May through to October.",
      "A resort in the truest sense: expect a genuinely quiet November through March.",
    ],
    bestFor: "Rental income and the view people fly out for",
  },
  hisaronu: {
    intro:
      "Hisarönü sits on the hill between Ölüdeniz and Fethiye and delivers the same beach access for noticeably less per square metre. It is compact, walkable and unapologetically lively through the season.",
    points: [
      "Shopping streets, markets and a dense restaurant strip within walking distance of almost any address.",
      "Family attractions including a fun park and an aqua park, which keeps it filling with returning families.",
      "The lowest entry price of the areas within reach of Ölüdeniz beach.",
      "Peak-season noise is real. Buyers seeking quiet are consistently happier in Ovacık or Çalış.",
    ],
    bestFor: "Yield-focused investors and best value near the lagoon",
  },
  ovacik: {
    intro:
      "Ovacık shares the valley with Hisarönü but keeps its distance from the noise. Plots are larger, the evenings are cooler, and the pace is set by families rather than by the bar strip a few minutes down the road.",
    points: [
      "Larger plots and more garden for the money than anywhere else within ten minutes of Ölüdeniz.",
      "Close enough to walk to Hisarönü's restaurants, far enough that you cannot hear them.",
      "A green valley setting with mountain air that makes August materially more comfortable.",
      "A car is useful here, though not strictly essential.",
    ],
    bestFor: "Families and buyers who want space without isolation",
  },
  calis: {
    intro:
      "Çalış Beach is the flat, walkable, open-all-year option and the area we recommend most often to buyers planning to spend real time here. It has the largest established foreign resident community on this stretch of coast.",
    points: [
      "A long, completely traffic-free promenade — which matters more than people expect when planning for later life.",
      "The best sunsets in the region, and a water-taxi link into Fethiye harbour through the season.",
      "International dining and an established expat community, so the winter is sociable rather than empty.",
      "The beach is pebble rather than sand, and Fethiye centre is a fifteen-minute drive.",
    ],
    bestFor: "Retirees, long-stay owners and winter living",
  },
  uzumlu: {
    intro:
      "Yeşil Üzümlü is Fethiye's highland village, twenty-five minutes inland and several degrees cooler. It is a working Turkish village with a genuine local market, vineyards and a well-known annual mushroom festival each May.",
    points: [
      "The lowest price per square metre of any area we cover — your budget buys substantially more house and land.",
      "Traditional village life: local crafts, regional wine, and a weekly market that is not aimed at tourists.",
      "Noticeably cooler summers thanks to the altitude, and a striking mountain backdrop.",
      "A car is essential, and short-let rental demand is a fraction of the coast.",
    ],
    bestFor: "Space, value and a genuinely Turkish setting",
  },
  tasyaka: {
    intro:
      "Taşyaka is the residential shoulder of Fethiye town where the hillside turns to face the bay. It is the only area on this list where a genuine panoramic sea view comes with a walk to the marina.",
    points: [
      "Panoramic views over Fethiye bay and the Twelve Islands from elevated plots.",
      "Walking distance to the marina promenade, the market and the hospital.",
      "Supply is genuinely constrained — elevated plots are largely built out, so good properties move quickly.",
      "The highest price per square metre of the areas we cover, and the most defensive on resale.",
    ],
    bestFor: "A sea view without giving up town convenience",
  },
  gocek: {
    intro:
      "Göcek is the yachting capital of the gulf: six marinas, five-star hotels, and a low-density planning regime that has deliberately kept high-rise development out. It is thirty minutes from Fethiye and twenty from Dalaman airport.",
    points: [
      "Six marinas and a boating culture that draws an international crowd from April to October.",
      "Island boat tours through the Twelve Islands leave from the town itself.",
      "Strict low-density planning has protected the setting — and, with it, values.",
      "The most expensive market we cover, and the most resilient in a downturn.",
    ],
    bestFor: "Blue-chip resale and the yachting set",
  },
};

/**
 * Görseli olmayan ama eski sitede anlatılan yerler.
 * Ayrı tutuluyorlar çünkü kart yerleşimi görsel gerektiriyor; bunlar
 * metin bloğu olarak sunuluyor.
 * TODO: Fotoğraf geldiğinde bunları da ana bölge listesine taşıyın.
 */
export const NEARBY_PLACES = [
  {
    name: "Kayaköy",
    blurb:
      "The stone ghost village abandoned in 1923 and now a protected heritage site. Several hundred roofless houses climb the hillside, with a scattering of boutique hotels and long-lunch restaurants at the bottom. It has stood in as a film location more than once.",
  },
  {
    name: "Faralya",
    blurb:
      "A cliffside village above Butterfly Valley, reached by a mountain road with a view that stops conversation. The valley below is accessible by boat or a serious walk, and the whole area is deliberately undeveloped.",
  },
  {
    name: "Seydikemer",
    blurb:
      "A small inland town thirty-five minutes from Fethiye, ringed by mountains and unusually well watered. It sits near the Saklıkent Gorge and is noticeably more affordable than anywhere on the coast.",
  },
];

export type LifestyleFact = {
  icon: LucideIcon;
  title: string;
  body: string;
};

export const LIFESTYLE_FACTS: LifestyleFact[] = [
  {
    icon: Sun,
    title: "The climate",
    body: "A Mediterranean pattern: hot, dry summers regularly above 35°C in July and August, and mild winters where daytime temperatures often sit in the mid-teens. Rain arrives in concentrated bursts between December and February rather than spreading through the year.",
  },
  {
    icon: Plane,
    title: "Getting there",
    body: "Dalaman airport is roughly 45 minutes from Fethiye and 20 from Göcek, with direct and connecting flights from major European, Gulf and regional hubs through the season and a reduced winter schedule. Flight time from most of Europe is around three to four hours.",
  },
  {
    icon: Stethoscope,
    title: "Healthcare",
    body: "Fethiye has both state and private hospitals, with English-speaking staff common in the private sector. Foreign residents holding a residence permit can join the state health scheme (SGK), and private cover is widely available and inexpensive by international standards.",
  },
  {
    icon: ShoppingBasket,
    title: "Cost of living",
    body: "Day-to-day costs — produce, eating out, fuel, domestic help and property maintenance — remain substantially below the equivalents in most of Europe and North America. Imported goods, cars and electronics are the exception and can cost more than at home.",
  },
  {
    icon: Users,
    title: "The community",
    body: "Çalış and Ovacık hold the largest established international communities, with active social clubs, English-language services and a sociable winter. Üzümlü and Seydikemer are far more traditionally Turkish, which suits some buyers precisely.",
  },
  {
    icon: GraduationCap,
    title: "Schooling",
    body: "State schooling is free and taught in Turkish. Private and international options exist in the wider Muğla region, and most relocating families with school-age children look carefully at this before choosing an area.",
  },
];

export const INVESTMENT_REASONS = [
  {
    title: "Freehold ownership in your own name",
    body: "Foreign nationals can buy freehold property in Türkiye outright, with the title deed (TAPU) registered directly to them. There is no leasehold structure, no ground rent and no service charge regime of the kind buyers from many countries are used to.",
  },
  {
    title: "Entry prices that still surprise international buyers",
    body: "A detached villa with a private pool and a sea view on this coast remains a fraction of the equivalent in Spain, Portugal or the south of France. That gap is what brings most of our buyers here in the first place.",
  },
  {
    title: "A long, reliable rental season",
    body: "Tourism to the Fethiye coast has recovered strongly and short-let demand runs from May to October, with Ölüdeniz and Hisarönü the strongest performers. A well-managed property can comfortably cover its running costs.",
  },
  {
    title: "A straightforward residency route",
    body: "Türkiye operates accessible short-term residence permits for property owners, and the process is well trodden for foreign applicants. We support permit applications as part of our aftercare.",
  },
  {
    title: "Citizenship at a defined threshold",
    body: "Property investment at or above the current government threshold can qualify the whole family for Turkish citizenship, with the asset retained rather than donated.",
  },
  {
    title: "Low ongoing costs of ownership",
    body: "Annual property tax is modest by international standards, and maintenance, gardening and pool servicing are affordable enough that many owners keep a villa serviced year-round without a second thought.",
  },
];

export const TURKEY_FAQS = [
  {
    question: "Can foreign citizens buy property in Turkey?",
    answer:
      "Yes. Foreign nationals buy freehold in their own name and the title deed is registered directly to them, with the only restrictions applying to designated military zones — none of which affect the areas we cover. Owning property and staying long term are separate questions: how long you may remain visa-free depends on your nationality, which is why owners planning extended stays apply for a residence permit.",
  },
  {
    question: "How long can I stay in Turkey as a property owner?",
    answer:
      "Property ownership does not by itself grant unlimited stay. Visa-free allowances depend on your nationality, and for many passports the limit is 90 days in any 180-day period. Owners who want to stay longer apply for a short-term residence permit, which is a well-established route for property owners and one we help with as part of aftercare.",
  },
  {
    question: "What is the weather like in Fethiye in winter?",
    answer:
      "Mild but genuinely wet. Daytime temperatures commonly sit in the mid-teens Celsius from December to February, with concentrated periods of rain rather than persistent drizzle. Many resort businesses in Ölüdeniz and Hisarönü close for the season, while Fethiye centre, Çalış and Taşyaka stay open all year.",
  },
  {
    question: "Is Fethiye a good place to retire?",
    answer:
      "It is one of the most established retirement destinations on the Turkish coast, particularly Çalış and Ovacık, where there are large settled international communities, flat walkable streets and good access to both state and private healthcare. The practical questions worth asking are healthcare cover, winter sociability and how easily family can visit.",
  },
  {
    question: "Do I need to speak Turkish to live in Fethiye?",
    answer:
      "Not to get by. English is widely spoken across Fethiye, Ölüdeniz, Hisarönü and Çalış, and official processes are handled with sworn translators. Learning some Turkish transforms daily life in the villages and markets, and it is genuinely appreciated — but it is not a barrier to buying or living here.",
  },
  {
    question: "Which area of Fethiye is best for rental income?",
    answer:
      "Ölüdeniz and Hisarönü carry the strongest short-let demand, with a season running from May to October. Central Fethiye and Çalış let for less per week but achieve occupancy over a longer period, including winter lets. Üzümlü, Ovacık and Seydikemer are lovely to own but considerably harder to fill in peak season.",
  },
];
