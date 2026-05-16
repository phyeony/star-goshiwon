import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
  process.exit(1);
}

console.log("SUPABASE_URL:", supabaseUrl);
console.log("Project ref:", new URL(supabaseUrl).hostname.split(".")[0]);

const supabase = createClient(supabaseUrl, serviceRoleKey);

(async () => {
  // 1. Sanity check: count rooms (we know this table exists & key works).
  const rooms = await supabase
    .from("rooms")
    .select("*", { count: "exact", head: true });
  console.log("rooms head-count:", { count: rooms.count, error: rooms.error });

  // 2. Count email_templates with head:true. If the table is missing entirely,
  //    we get a relation-does-not-exist error. If it exists but is empty (or
  //    RLS-hidden), count is 0 with no error.
  const tplHead = await supabase
    .from("email_templates")
    .select("*", { count: "exact", head: true });
  console.log("email_templates head-count:", {
    count: tplHead.count,
    error: tplHead.error,
  });

  // 3. Fetch actual rows.
  const tplRows = await supabase
    .from("email_templates")
    .select("id, slug, label, sort_order")
    .order("sort_order", { ascending: true });
  console.log("email_templates rows:", {
    length: tplRows.data?.length ?? 0,
    error: tplRows.error,
  });
  if (tplRows.data && tplRows.data.length > 0) {
    console.table(tplRows.data);
  }
})();
