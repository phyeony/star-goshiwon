export type Room = {
  slug: string;
  name: string;
  priceNight: number;
  priceMonth: number;
  occupancy: string;
  size: string;
  status: "Available" | "Limited" | "Waitlist";
  summary: string;
  amenities: string[];
  photo: string;
};

export const property = {
  name: "Seoul Stay Goshiwon",
  tagline: "Simple, central, and foreigner-friendly living in Seoul",
  address: "24-1, Heukseok-ro, Dongjak-gu, Seoul",
  neighborhood:
    "Near subway access, late-night food spots, laundromats, and easy bus connections to universities and office districts.",
  mapHref: "https://maps.google.com",
  email: "stay@example.com",
  whatsappHref: "https://wa.me/821012345678",
  kakaotalkHref: "https://open.kakao.com/o/example",
  heroImage:
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80"
};

export const rooms: Room[] = [
  {
    slug: "compact-single",
    name: "Compact Single",
    priceNight: 38,
    priceMonth: 590,
    occupancy: "1 guest",
    size: "6m²",
    status: "Available",
    summary: "Budget-friendly private room with desk, storage, and shared shower access.",
    amenities: ["Wi-Fi", "Desk", "Storage", "Shared kitchen", "Laundry"],
    photo:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80"
  },
  {
    slug: "standard-single",
    name: "Standard Single",
    priceNight: 49,
    priceMonth: 720,
    occupancy: "1 guest",
    size: "8m²",
    status: "Limited",
    summary: "Popular room with private bathroom, larger bed, and brighter natural light.",
    amenities: ["Private bathroom", "Wi-Fi", "Desk", "Mini fridge", "Laundry"],
    photo:
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80"
  },
  {
    slug: "premium-twin",
    name: "Premium Twin",
    priceNight: 78,
    priceMonth: 1090,
    occupancy: "2 guests",
    size: "12m²",
    status: "Waitlist",
    summary: "Best for friends or couples needing more room and a quieter corner location.",
    amenities: ["Private bathroom", "Wi-Fi", "Desk", "Closet", "Microwave access"],
    photo:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=80"
  }
];

export const faqs = [
  {
    question: "Can foreigners stay in this goshiwon?",
    answer:
      "Yes. The website and booking process are designed for foreign guests, including students, travelers, and remote workers."
  },
  {
    question: "Do you support short stays?",
    answer:
      "Yes. You can request both short-term and monthly stays. Final approval depends on room availability and your requested dates."
  },
  {
    question: "Is a booking confirmed immediately?",
    answer:
      "No. This site uses a request-to-book flow. You send your stay request first, then the host reviews and confirms manually."
  }
];

export const requestStatuses = [
  { name: "New", count: 8 },
  { name: "Contacted", count: 5 },
  { name: "Approved", count: 3 },
  { name: "Declined", count: 1 }
];
