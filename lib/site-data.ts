export const siteConfig = {
  name: "Seoul Goshiwon by Star Goshiwon",
  tagline: "Your Comfortable Basecamp in Seoul",
  description:
    "Cheap, foreigner-friendly men's goshiwon in Seoul. Private rooms from $75/week (~₩110,000) with no big deposits and flexible stays. Easy access to Hongdae, Gangnam, and major universities.",
  email: "stargoshiwon.seoul@gmail.com",
  phone: "+82-10-1234-5678",
  whatsapp: "https://wa.me/message/7FRHDMTCDZPPF1",
  kakao: "https://pf.kakao.com/seoulstay",
  address: "64, Manyang-ro 12ga-gil, Dongjak-gu, Seoul, Republic of Korea",
  mapUrl: "https://www.google.com/maps/place/%EC%8A%A4%ED%83%80%EA%B3%A0%EC%8B%9C%EC%9B%90stargoshiwon/@37.5113087,126.9483812,17z/data=!3m1!4b1!4m10!3m9!1s0x357c9f6736793a2b:0x7f3263912b31aa4c!5m3!1s2026-05-10!4m1!1i2!8m2!3d37.5113087!4d126.9483812!16s%2Fg%2F11k3n5dk8k",
  naverMapUrl: "https://map.naver.com/p/entry/place/20857528?c=15.00,0,0,0,dh&placePath=/home",
  kakaoMapUrl: "https://map.kakao.com/?urlX=488593.9999999978&urlY=1114406.000000001&urlLevel=3&itemId=27473089&q=%EC%8A%A4%ED%83%80%EA%B3%A0%EC%8B%9C%ED%85%94&srcid=27473089&map_type=TYPE_MAP",
  coordinates: { lat: 37.5112885, lng: 126.948383 },
  responseTime: "24 hours",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
};

export const highlights = [
  { value: "$0", label: "Key Money Deposit" },
  { value: "$75", label: "From / Week" },
  { value: "15% Off", label: "Monthly Stay Discount" },
  { value: "English", label: "Speaking Management" },
];

export const amenities = [
  { icon: "wifi", label: "High-Speed WiFi" },
  { icon: "snowflake", label: "AC / Heating" },
  { icon: "utensils", label: "Shared Kitchen" },
  { icon: "shirt", label: "Laundry Room" },
  { icon: "window", label: "Outside-Facing Window" },
  { icon: "package", label: "Package Reception" },
  { icon: "fridge", label: "In-Room Mini Fridge" },
  { icon: "zap", label: "Utilities Included" },
];

export const faqs = [
  {
    question: "What is a goshiwon?",
    answer:
      "A goshiwon (고시원) is a type of affordable housing in Korea, originally designed for students preparing for exams. Today, they are popular among foreigners, digital nomads, and anyone looking for budget-friendly private rooms with flexible lease terms. Rooms are small but fully furnished, and common areas are shared.",
  },
  {
    question: "What documents do I need to check in?",
    answer:
      "Check-in is self check-in, so all document verification happens before you arrive. Send us clear photos of your passport and your valid Korean visa (or other proof of legal stay, such as a visa-free entry stamp). We verify these before approving your booking — no originals need to be presented on arrival.",
  },
  {
    question: "Is a deposit required?",
    answer:
      "Yes. A refundable $70 deposit (≈ ₩100,000) is prepaid via PayPal together with your first payment. We refund it via PayPal at the end of your stay if the room is left undamaged.",
  },
  {
    question: "What is included in the rent?",
    answer:
      "Rent includes utilities (electricity, water, gas, internet), basic food supplies (rice, kimchi, ramen), access to shared kitchen and laundry facilities. Every room comes with a bed, desk & chair, WiFi, mini fridge, AC/Heating, shelf & cabinet, and an outside-facing window. A bedding set is available for $15 USD, prepaid via PayPal with your booking.",
  },
  {
    question: "What is the minimum stay?",
    answer:
      "The minimum stay is 7 days (1 week). If you stay 4 weeks or longer, you get a 15% discount automatically applied to your rate. Towels are provided for monthly stays only.",
  },
  {
    question: "Can I see the room before booking?",
    answer:
      "Yes! We encourage room visits. Send us a booking request or contact us via WhatsApp to schedule a viewing. Walk-ins are also welcome during business hours (9 AM - 9 PM).",
  },
  // {
  //   question: "Is there a curfew or house rules?",
  //   answer:
  //     "There is no curfew. You have 24/7 access with your personal door code. We do ask that residents keep noise to a minimum between 10 PM and 8 AM, and maintain cleanliness in shared areas.",
  // },
  // {
  //   question: "How do I pay rent?",
  //   answer:
  //     "Monthly rent is paid via bank transfer to our Korean bank account at the beginning of each month. We can help you set up a Korean bank account if needed. Cash payment is also accepted.",
  // },
  {
    question: "Can I extend my stay?",
    answer:
      "Yes, you can extend your stay as long as the room is available. Just let us know at least one week before your current checkout date, and we will update your booking.",
  },
  // {
  //   question: "What is the cancellation policy?",
  //   answer:
  //     "Cancellations made 7 or more days before check-in receive a full deposit refund. Cancellations within 7 days of check-in forfeit 50% of the deposit. No-shows forfeit the full deposit.",
  // },
];

export const nearbyLocations = [
  { name: "Sangdo Station (Line 7)", distance: "5 min walk", type: "transit" },
  { name: "Noryangjin Station (Line 1 & 9)", distance: "10 min walk", type: "transit" },
  { name: "Sindaebang Station (Line 2)", distance: "12 min walk", type: "transit" },
  { name: "Seoul Express Bus Terminal", distance: "15 min by subway", type: "transit" },
  { name: "CU / GS25 Convenience Stores", distance: "1–2 min walk", type: "shop" },
  { name: "Noryangjin Fish Market", distance: "12 min walk", type: "shop" },
  { name: "Yongsan Electronics Market", distance: "20 min by subway", type: "shop" },
  { name: "Itaewon (shopping & dining)", distance: "20 min by subway", type: "shop" },
  { name: "Hongdae (nightlife & culture)", distance: "25 min by subway", type: "shop" },
  { name: "Gyeongbokgung Palace", distance: "30 min by subway", type: "explore" },
  { name: "Namsan Tower / N Seoul Tower", distance: "20 min by bus", type: "explore" },
  { name: "Han River Park (Dongjak)", distance: "15 min walk", type: "explore" },
  { name: "War Memorial of Korea", distance: "15 min by subway", type: "explore" },
  { name: "Bukchon Hanok Village", distance: "35 min by subway", type: "explore" },
  { name: "Myeongdong (shopping district)", distance: "25 min by subway", type: "explore" },
  { name: "Lotte World & Lotte Tower", distance: "30 min by subway", type: "explore" },
  { name: "Chung-Ang University (중앙대)", distance: "10 min by bus", type: "university" },
  { name: "Soongsil University (숭실대)", distance: "15 min walk", type: "university" },
  { name: "Seoul National University (서울대)", distance: "20 min by subway", type: "university" },
  { name: "Sogang University (서강대)", distance: "25 min by subway", type: "university" },
  { name: "Yonsei University (연세대)", distance: "30 min by subway", type: "university" },
];
