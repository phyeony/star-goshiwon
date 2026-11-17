/**
 * Send one test "예약 요청 접수" 알림톡 to your own phone.
 *   pnpm dlx tsx scripts/test-alimtalk.ts 010-1234-5678
 * Reads SENDON_* from .env.local / .env. Run it from a machine whose IP is on
 * Sendon's whitelist.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { bookingReceivedVariables, sendAlimtalk } from "../lib/kakao-alimtalk";

const phone = process.argv[2];
if (!phone) {
  console.error("Usage: pnpm dlx tsx scripts/test-alimtalk.ts 010-1234-5678");
  process.exit(1);
}

const variables = bookingReceivedVariables({
  guest_name: "테스트",
  room_name: "일반실",
  move_in_date: new Date().toISOString().slice(0, 10),
  stay_months: 1,
  monthly_rate_krw: 300000,
});
console.log("Variables:", variables);

sendAlimtalk("ko_booking_received_v1", phone, variables, { ...process.env, NODE_ENV: "production" })
  .then((r) => {
    console.log(r);
    if (!r.ok) process.exit(1);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
