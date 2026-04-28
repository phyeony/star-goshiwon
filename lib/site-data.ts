export const siteConfig = {
  name: "Seoul Goshiwon by Star Gositel",
  tagline: "Your Comfortable Basecamp in Seoul",
  description:
    "Cheap, foreigner-friendly men's goshiwon in Seoul. Private rooms from $75/week (~₩110,000) with no big deposits and flexible stays. Easy access to Hongdae, Gangnam, and major universities.",
  email: "stargoshiwon.seoul@gmail.com",
  phone: "+82-10-1234-5678",
  whatsapp: "https://wa.me/message/7FRHDMTCDZPPF1",
  kakao: "https://pf.kakao.com/seoulstay",
  address: "64, Manyang-ro 12ga-gil, Dongjak-gu, Seoul, Republic of Korea",
  mapUrl: "https://www.google.com/maps/place/Stargositel/data=!4m10!1m2!2m1!1z64W465-J7KeEIOyKpO2DgOqzoOyLnO2FlA!3m6!1s0x357c9f6736793a2b:0x7f3263912b31aa4c!8m2!3d37.5112885!4d126.948383!15sChnrhbjrn4nsp4Qg7Iqk7YOA6rOg7Iuc7YWUkgERYmVkX2FuZF9icmVha2Zhc3TgAQA!16s%2Fg%2F11k3n5dk8k",
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
      "You will need your passport. We will verify your documents before approving your booking requests.",
  },
  {
    question: "Is a deposit required?",
    answer:
      "We require a small refundable deposit of ₩100,000, payable at check-in. The deposit is returned in full upon checkout if the room is in good condition.",
  },
  {
    question: "What is included in the rent?",
    answer:
      "Rent includes utilities (electricity, water, gas, internet), basic food supplies (rice, kimchi, ramen), access to shared kitchen and laundry facilities. Every room comes with a bed, desk & chair, WiFi, mini fridge, AC/Heating, shelf & cabinet, and an outside-facing window. A bedding set is available — $15 USD prepaid with your booking, or ₩20,000 cash on arrival.",
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

export const policies = {
  cancellation: {
    title: "Cancellation Policy",
    content: `
- Cancellations made 7+ days before check-in: full deposit refund
- Cancellations within 7 days of check-in: 50% deposit forfeited
- No-shows: full deposit forfeited
- Early checkout after check-in: remaining prepaid rent refunded minus 1 week penalty
    `.trim(),
  },
  houseRules: {
    title: "House Rules",
    content: `
- Quiet hours: 10 PM – 8 AM
- No smoking inside the building
- No pets allowed
- No overnight guests without prior approval
- Keep shared areas clean after use
- Dispose of trash in designated bins with proper separation
- Do not tamper with locks, fire alarms, or safety equipment
- Report any maintenance issues promptly
    `.trim(),
  },
  checkInOut: {
    title: "Check-in / Check-out",
    content: `
- Check-in: 2 PM – 9 PM (other times by arrangement)
- Check-out: by 11 AM on departure date
- Bring your passport and visa for identity verification
- Deposit is due at check-in (cash or bank transfer)
- Room key code will be provided at check-in
    `.trim(),
  },
};

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
