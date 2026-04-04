import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const rooms = [
  {
    name: "Premium En-Suite Room",
    slug: "premium-en-suite",
    description:
      "Our largest and most private room with your own bathroom and an outer-facing window. Includes a single bed, desk, mini-fridge, and AC. Ideal for longer stays.",
    price_monthly: 550000,
    price_weekly: 165000,
    price_daily: 25000,
    capacity: 1,
    size_sqm: 8.5,
    amenities: [
      "Private Shower",
      "AC / Heat",
      "Mini-fridge",
      "Fast WiFi",
      "Desk & Chair",
      "Outer Window",
    ],
    status: "available" as const,
    featured: true,
    sort_order: 1,
  },
  {
    name: "Standard Room",
    slug: "standard-room",
    description:
      "A comfortable private room with an inner window. Shared bathrooms on each floor. Includes a single bed, desk, and AC. Great value for budget-conscious stays.",
    price_monthly: 350000,
    price_weekly: 105000,
    price_daily: 18000,
    capacity: 1,
    size_sqm: 5.5,
    amenities: [
      "Shared Showers",
      "AC / Heat",
      "Fast WiFi",
      "Desk & Chair",
      "Inner Window",
    ],
    status: "available" as const,
    featured: true,
    sort_order: 2,
  },
  {
    name: "Economy Room",
    slug: "economy-room",
    description:
      "Our most affordable option. A compact private room with shared bathroom facilities. Perfect for short-term stays and students on a tight budget.",
    price_monthly: 280000,
    price_weekly: 85000,
    price_daily: 15000,
    capacity: 1,
    size_sqm: 4.0,
    amenities: ["Shared Showers", "AC / Heat", "Fast WiFi", "Desk & Chair"],
    status: "available_soon" as const,
    featured: false,
    sort_order: 3,
  },
  {
    name: "Double Room",
    slug: "double-room",
    description:
      "A larger room designed for two guests. Features a bunk bed or twin setup, shared bathroom, and extra storage space. Ideal for friends or couples.",
    price_monthly: 450000,
    price_weekly: 135000,
    price_daily: 22000,
    capacity: 2,
    size_sqm: 9.0,
    amenities: [
      "Shared Showers",
      "AC / Heat",
      "Mini-fridge",
      "Fast WiFi",
      "Desk & Chair",
      "Extra Storage",
    ],
    status: "limited" as const,
    featured: false,
    sort_order: 4,
  },
];

const roomImages: Record<string, { url: string; alt: string }[]> = {
  "premium-en-suite": [
    {
      url: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      alt: "Premium En-Suite Room - clean modern room with private bathroom",
    },
    {
      url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      alt: "Premium En-Suite Room - desk and window area",
    },
  ],
  "standard-room": [
    {
      url: "https://images.unsplash.com/photo-1540518614846-7eded433c457?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      alt: "Standard Room - cozy private room with bed and desk",
    },
  ],
  "economy-room": [
    {
      url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      alt: "Economy Room - compact and functional",
    },
  ],
  "double-room": [
    {
      url: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      alt: "Double Room - spacious room for two guests",
    },
  ],
};

async function seed() {
  console.log("Seeding database...");

  // Clear existing data
  await supabase.from("room_images").delete().neq("id", "");
  await supabase.from("booking_requests").delete().neq("id", "");
  await supabase.from("rooms").delete().neq("id", "");

  // Insert rooms
  for (const room of rooms) {
    const { data: insertedRoom, error } = await supabase
      .from("rooms")
      .insert(room)
      .select()
      .single();

    if (error) {
      console.error(`Failed to insert room ${room.name}:`, error.message);
      continue;
    }

    console.log(`Created room: ${insertedRoom.name}`);

    // Insert images
    const images = roomImages[room.slug] || [];
    for (let i = 0; i < images.length; i++) {
      const { error: imgError } = await supabase.from("room_images").insert({
        room_id: insertedRoom.id,
        url: images[i].url,
        alt: images[i].alt,
        sort_order: i,
      });

      if (imgError) {
        console.error(`Failed to insert image for ${room.name}:`, imgError.message);
      }
    }
  }

  console.log("Seed complete!");
}

seed().catch(console.error);
