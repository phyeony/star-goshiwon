import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const rooms = [
  {
    name: "Economy Room",
    slug: "economy-room",
    description:
      "Our most affordable private room with shared shower and toilet facilities. Perfect for short stays, students, and budget-conscious guests. All rooms include an outside-facing window, fast Wi-Fi, AC/heating, a desk, and a mini fridge.",

        price_monthly: 340000,
    price_weekly: 100000,
    price_daily: 15000,
    capacity: 1,
    size_sqm: 45.5,
    amenities: [
      "Shared Showers",
      "Shared Toilets",
      "AC / Heat",
      "Fast WiFi",
      "Desk & Chair",
      "Mini Fridge",
      "Shelf & Cabinet",
      "Outside-Facing Window",
    ],
    status: "available" as const,
    featured: false,
    sort_order: 1,
  },
  {
    name: "Private Shower Room",
    slug: "room-with-private-shower",
    description:
      "A private room with your own shower and access to a shared toilet. A smart choice for guests who want extra convenience at a reasonable price. Includes an outside-facing window, fast Wi-Fi, AC/heating, a desk, and a mini fridge.",
    price_monthly: 408000,
    price_weekly: 120000,
    price_daily: 18000,
    capacity: 1,
    size_sqm: 6.5,
    amenities: [
      "Private Shower",
      "Shared Toilet",
      "AC / Heat",
      "Fast WiFi",
      "Desk & Chair",
      "Mini Fridge",
      "Shelf & Cabinet",
      "Outside-Facing Window",
    ],
    status: "available" as const,
    featured: true,
    sort_order: 2,
  },
  {
    name: "Private Shower & Toilet Room",
    slug: "room-with-private-shower-and-toilet",
    description:
      "Our most private room with both your own shower and toilet. Ideal for guests who want the most convenience and privacy during their stay. Includes an outside-facing window, fast Wi-Fi, AC/heating, a desk, and a mini fridge.",
    price_monthly: 408000,
    price_weekly: 120000,
    price_daily: 18000,
    capacity: 1,
    size_sqm: 6.5,
    amenities: [
      "Private Shower",
      "Private Toilet",
      "AC / Heat",
      "Fast WiFi",
      "Desk & Chair",
      "Mini-fridge",
      "Shelf & Cabinet",
      "Outside-Facing Window",
    ],
    status: "available" as const,
    featured: true,
    sort_order: 3,
  },
];

const roomImages: Record<string, { url: string; alt: string; sort_order: number }[]> = {
  "economy-room": [
    { url: "/images/economy/1.main.jpg", alt: "Economy room - main view", sort_order: 1 },
    { url: "/images/economy/2.desk.jpg", alt: "Desk", sort_order: 2 },
    { url: "/images/economy/3.right-side-cabinet.jpg", alt: "Cabinet on the right side", sort_order: 3 },
    { url: "/images/economy/4.shelf.jpg", alt: "Shelf", sort_order: 4 },
    { url: "/images/economy/5.ac.jpg", alt: "Air conditioning", sort_order: 5 },
    { url: "/images/economy/6.refrigerator.jpg", alt: "Mini fridge", sort_order: 6 },
    { url: "/images/economy/7.window-room-corner.jpg", alt: "Window and corner of the room", sort_order: 7 },
  ],
  "room-with-private-shower": [
    { url: "/images/private-shower/1.main.jpg", alt: "Private shower room - main view", sort_order: 1 },
    { url: "/images/private-shower/2.main-2.jpg", alt: "Private shower room - alternate angle", sort_order: 2 },
    { url: "/images/private-shower/3.shower-right-side.jpg", alt: "Private shower", sort_order: 3 },
    { url: "/images/private-shower/4.window-and-shower.jpg", alt: "Window and shower", sort_order: 4 },
    { url: "/images/private-shower/5.bathroom-sink.jpg", alt: "Bathroom sink", sort_order: 5 },
    { url: "/images/private-shower/6.ac.jpg", alt: "Air conditioning", sort_order: 6 },
    { url: "/images/private-shower/7.window-day.jpg", alt: "Window during the day", sort_order: 7 },
    { url: "/images/private-shower/8.window-night.jpg", alt: "Window at night", sort_order: 8 },
    { url: "/images/private-shower/9.refrigerator.jpg", alt: "Mini fridge", sort_order: 9 },
  ],
  "room-with-private-shower-and-toilet": [
    { url: "/images/private-toilet-and-shower/1.main.jpg", alt: "Private shower and toilet room - main view", sort_order: 1 },
    { url: "/images/private-toilet-and-shower/2.shower.jpg", alt: "Private shower", sort_order: 2 },
    { url: "/images/private-toilet-and-shower/3.sink.png", alt: "Bathroom sink", sort_order: 3 },
    { url: "/images/private-toilet-and-shower/4.toilet.jpg", alt: "Private toilet", sort_order: 4 },
    { url: "/images/private-toilet-and-shower/4.window.jpg", alt: "Window", sort_order: 5 },
    { url: "/images/private-toilet-and-shower/5.left-side.jpg", alt: "Left side of room", sort_order: 6 },
    { url: "/images/private-toilet-and-shower/6.left-side-cabinet-shelf.jpg", alt: "Cabinet and shelf", sort_order: 7 },
    { url: "/images/private-toilet-and-shower/7.refrigerator.jpg", alt: "Mini fridge", sort_order: 8 },
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
    for (const image of images) {
      const { error: imgError } = await supabase.from("room_images").insert({
        room_id: insertedRoom.id,
        url: image.url,
        alt: image.alt,
        sort_order: image.sort_order,
      });

      if (imgError) {
        console.error(`Failed to insert image for ${room.name}:`, imgError.message);
      }
    }
  }

  console.log("Seed complete!");
}

seed().catch(console.error);
