/**
 * /viewing-day içeriği — eski sitedeki gezi anlatımından genişletildi.
 *
 * TODO: `HOSTS` içindeki isimler eski siteden alındı. Ekip değişirse burayı
 * güncelleyin; sayfa boyunca isimler tek yerden besleniyor.
 */
export const HOSTS = ["Ronnie Higgins", "Nilay Zengin"] as const;

export const TRIP_INCLUDED = [
  "Collection from and return to your accommodation, every day of the trip",
  "Private, air-conditioned transport between every property",
  "A named consultant with you throughout — the same person, start to finish",
  "A shortlist agreed with you in writing before you travel",
  "Local knowledge on each area: winter closures, access, rental demand, resale",
  "Introduction to an independent English-speaking solicitor if you need one",
  "Full aftersale support",
];

export const TRIP_NOT_DOING = [
  "No coach tours with eight buyers viewing the same villa on the same morning",
  "No properties shown above your stated budget to make others look reasonable",
  "No 'today only' pricing, and no pressure to reserve before you fly home",
  "No second agent joining halfway through the trip",
  "No obligation whatsoever — a trip that ends without a purchase is a normal outcome",
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
