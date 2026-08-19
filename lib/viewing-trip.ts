import {
  Car,
  Coffee,
  FileSignature,
  Handshake,
  Key,
  Route,
  Sunrise,
  Utensils,
  type LucideIcon,
} from "lucide-react";

/**
 * /viewing-day içeriği — eski sitedeki gezi anlatımından genişletildi.
 *
 * TODO: `HOSTS` içindeki isimler eski siteden alındı. Ekip değişirse burayı
 * güncelleyin; sayfa boyunca isimler tek yerden besleniyor.
 */
export const HOSTS = ["Ronnie Higgins", "Nilay Zengin"] as const;

export type ItineraryEntry = {
  time: string;
  icon: LucideIcon;
  title: string;
  body: string;
};

export type ItineraryDay = {
  id: string;
  label: string;
  title: string;
  summary: string;
  entries: ItineraryEntry[];
};

export const ITINERARY: ItineraryDay[] = [
  {
    id: "before",
    label: "Before you fly",
    title: "The work that happens before anyone books a flight",
    summary:
      "The trip is built around a written specification, not around whatever we happen to have on our books. We only confirm a viewing date once you and we agree the shortlist is worth travelling for.",
    entries: [
      {
        time: "Step 1",
        icon: FileSignature,
        title: "Your written specification",
        body: "Budget, bedrooms, must-haves, deal-breakers, and how you actually intend to use the property. A good agent listens properly first and advises you truthfully about every property you ask about — including the ones we would steer you away from.",
      },
      {
        time: "Step 2",
        icon: Route,
        title: "The shortlist, agreed in advance",
        body: "We send properties that genuinely match. Nothing above your budget, nothing outside your criteria to pad the list. We only schedule the trip once all parties agree the selection is right.",
      },
      {
        time: "Step 3",
        icon: Key,
        title: "Travel and accommodation",
        body: "We help arrange flights and accommodation if you would like us to, including recommendations in the area you are most drawn to so the location is doing some of the work while you sleep.",
      },
    ],
  },
  {
    id: "day-1",
    label: "Day one",
    title: "Orientation and the first viewings",
    summary:
      "The first day is as much about the region as the properties. You cannot judge a house without knowing what is a five-minute walk from it.",
    entries: [
      {
        time: "Morning",
        icon: Coffee,
        title: "Collection and breakfast",
        body: `${HOSTS[0]} and ${HOSTS[1]} collect you from your accommodation. Breakfast together — at your hotel or somewhere local — is optional and entirely up to you.`,
      },
      {
        time: "Morning",
        icon: Route,
        title: "Run through the day",
        body: "We go through the itinerary before setting off: which properties, in what order, and what you should know about each area before you see it.",
      },
      {
        time: "Late morning",
        icon: Car,
        title: "First viewings",
        body: "Travel between properties is where much of the value sits — local knowledge about schools, winter closures, water pressure, access roads and which neighbours are holiday lets.",
      },
      {
        time: "Lunch",
        icon: Utensils,
        title: "A proper break",
        body: "We stop for lunch, with the timing and location flexible depending on the weather and how you are feeling. Six to eight properties in a day is the sensible maximum before they blur into one another.",
      },
      {
        time: "Afternoon",
        icon: Car,
        title: "Afternoon viewings — optional",
        body: "Entirely your call. If you have seen enough, we stop. Jet lag and heat are real, and a tired viewing is a wasted one.",
      },
      {
        time: "Evening",
        icon: Sunrise,
        title: "Back to base",
        body: "We return you to your accommodation, or drop you at a restaurant of your choice if you would rather go straight out.",
      },
    ],
  },
  {
    id: "day-2",
    label: "Day two",
    title: "Refining, revisiting and going deeper",
    summary:
      "Day two is shaped entirely by day one. Almost nobody's shortlist survives contact with the actual houses, and that is the point of coming.",
    entries: [
      {
        time: "Flexible",
        icon: Route,
        title: "A revised shortlist",
        body: "We rebuild the day around what you responded to. If the brief has shifted — and it usually shifts — we bring in properties that fit the new one.",
      },
      {
        time: "Flexible",
        icon: Car,
        title: "Second viewings",
        body: "Returning to a favourite at a different time of day tells you things the first visit cannot: afternoon sun, evening noise, how the road behaves at school run.",
      },
      {
        time: "Flexible",
        icon: Coffee,
        title: "Area immersion",
        body: "Where you are torn between two areas, we spend time in both — the shops, the beach, the walk to the bar — rather than only in the houses.",
      },
    ],
  },
  {
    id: "day-3",
    label: "Day three",
    title: "Decisions, or a relaxed look at the wider region",
    summary:
      "If a property is worth pursuing, the day turns to the purchase procedure. If not, we widen the search or simply show you more of the coast.",
    entries: [
      {
        time: "Option A",
        icon: Handshake,
        title: "Making an offer",
        body: "We negotiate in Turkish on your behalf and talk you through the reservation contract line by line in English. Nothing is signed on the day under pressure.",
      },
      {
        time: "Option A",
        icon: FileSignature,
        title: "Meeting your solicitor",
        body: "We introduce you to an independent, English-speaking solicitor instructed by you — never by us and never by the seller — and can arrange a notary appointment for a power of attorney if you want to complete after you fly home.",
      },
      {
        time: "Option B",
        icon: Car,
        title: "Third viewings or a wider search",
        body: "If nothing has landed, that is a perfectly good outcome for a first trip. We extend the search area or arrange third viewings on the properties still in contention.",
      },
    ],
  },
];

export const TRIP_INCLUDED = [
  "Collection from and return to your accommodation, every day of the trip",
  "Private, air-conditioned transport between every property",
  "A named consultant with you throughout — the same person, start to finish",
  "A shortlist agreed with you in writing before you travel",
  "Local knowledge on each area: winter closures, access, rental demand, resale",
  "Introduction to an independent English-speaking solicitor if you need one",
  "Help arranging flights and accommodation on request",
  "Full purchase support afterwards, whether you buy this trip or in two years",
];

export const TRIP_NOT_DOING = [
  "No coach tours with eight buyers viewing the same villa on the same morning",
  "No properties shown above your stated budget to make others look reasonable",
  "No 'today only' pricing, and no pressure to reserve before you fly home",
  "No second agent joining halfway through the trip",
  "No obligation whatsoever — a trip that ends without a purchase is a normal outcome",
];

export const TRIP_PREPARE = [
  {
    title: "Passport and a rough budget",
    body: "An all-in figure rather than a villa price. Purchase costs run to roughly 6–8% on top, and knowing your true ceiling changes what we show you.",
  },
  {
    title: "Comfortable shoes and layers",
    body: "Hillside plots involve steps and unmade access roads. Summer viewings are hot; winter mornings genuinely need a jacket.",
  },
  {
    title: "Your non-negotiables, written down",
    body: "Single storey, walk to the beach, no shared pool, space for grandchildren. Write them down before you arrive — it is remarkably easy to be talked out of them by a good view.",
  },
  {
    title: "Questions about the boring things",
    body: "Habitation certificates, service charges, water pressure, winter damp, road access. Ask us the unglamorous questions — they are the ones that decide whether you enjoy owning the place.",
  },
];

export const VIEWING_FAQS = [
  {
    question: "How much does a viewing trip cost?",
    answer:
      "There is no charge for our time, the transport during the trip or the itinerary planning. You cover your own flights and accommodation, and we are happy to recommend or help arrange both. There is no deposit and no obligation to buy.",
  },
  {
    question: "How many properties will I see?",
    answer:
      "Six to eight over a full day is the sensible maximum, and most trips run across two or three days. More than that and the properties genuinely start to blur together — we would rather show you fewer houses properly than march you through twenty.",
  },
  {
    question: "How long should I stay?",
    answer:
      "Three to four nights suits most buyers. That gives two full viewing days, a third day to revisit favourites or meet a solicitor, and enough time to sit in a couple of areas at different times of day rather than only seeing them from the car.",
  },
  {
    question: "When is the best time of year to visit?",
    answer:
      "February to June is ideal: the weather is comfortable for walking around properties, everything is open, and you avoid the August heat. Visiting in winter has one real advantage — you see which areas genuinely stay open, which is difficult to judge in July.",
  },
  {
    question: "Do I have to buy on the trip?",
    answer:
      "No, and most people do not. A first trip that ends without an offer is a completely normal outcome and often the right one. We would far rather you go home, think, and come back than reserve something on the day and regret it.",
  },
  {
    question: "Can you help with flights and accommodation?",
    answer:
      "Yes. We will suggest where to stay based on the areas you want to see — staying in the right place does half the work of assessing it — and we can help you find flights into Dalaman, which is around 45 minutes from Fethiye.",
  },
  {
    question: "What if I want to buy after I fly home?",
    answer:
      "That is straightforward. You can complete under a power of attorney granted to your solicitor, signed either at a Turkish notary while you are here or at a Turkish consulate or embassy in your own country. Many of our buyers complete this way.",
  },
];
