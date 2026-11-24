import { NextRequest, NextResponse } from "next/server";
import { getAdminUserOrNull } from "@/lib/supabase-server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { normalizeGroupUrl } from "@/lib/facebook-posts";

// One endpoint for the 페이스북 홍보 admin page. Body: { action, ...fields }.
//   add_group / update_group / delete_group
//   save_post (id optional: create or update) / delete_post
//   log_post (group_id, post_id) / undo_log (id)

const UUID = /^[0-9a-f-]{36}$/i;

function str(v: unknown, max = 10_000): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function uuid(v: unknown): string | null {
  return typeof v === "string" && UUID.test(v) ? v : null;
}

function bad(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(req: NextRequest) {
  if (!(await getAdminUserOrNull())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const supabase = getSupabaseServiceClient();
  const action = str(body.action, 40);

  try {
    switch (action) {
      case "add_group":
      case "update_group": {
        const name = str(body.name, 200);
        const url = normalizeGroupUrl(str(body.url, 1000));
        if (!name) return bad("그룹 이름을 입력하세요.");
        if (!url) return bad("facebook.com 링크를 입력하세요.");
        const fields = { name, url, notes: str(body.notes, 2000) };
        if (action === "add_group") {
          const { error } = await supabase.from("facebook_groups").insert(fields);
          if (error) throw error;
        } else {
          const id = uuid(body.id);
          if (!id) return bad("id is required");
          const { error } = await supabase.from("facebook_groups").update(fields).eq("id", id);
          if (error) throw error;
        }
        break;
      }
      case "delete_group": {
        const id = uuid(body.id);
        if (!id) return bad("id is required");
        const { error } = await supabase.from("facebook_groups").delete().eq("id", id);
        if (error) throw error;
        break;
      }
      case "save_post": {
        const title = str(body.title, 200);
        const text = str(body.body, 20_000);
        if (!title || !text) return bad("제목과 내용을 입력하세요.");
        const photoIds = Array.isArray(body.photo_ids)
          ? body.photo_ids.map(uuid).filter((v): v is string => !!v).slice(0, 10)
          : [];
        const fields = { title, body: text, photo_ids: photoIds };
        const id = uuid(body.id);
        if (id) {
          const { error } = await supabase.from("facebook_posts").update(fields).eq("id", id);
          if (error) throw error;
        } else {
          const { data: last } = await supabase
            .from("facebook_posts")
            .select("sort_order")
            .order("sort_order", { ascending: false })
            .limit(1);
          const sort_order = ((last?.[0]?.sort_order as number | undefined) ?? 0) + 1;
          const { error } = await supabase.from("facebook_posts").insert({ ...fields, sort_order });
          if (error) throw error;
        }
        break;
      }
      case "delete_post": {
        const id = uuid(body.id);
        if (!id) return bad("id is required");
        const { error } = await supabase.from("facebook_posts").delete().eq("id", id);
        if (error) throw error;
        break;
      }
      case "log_post": {
        const groupId = uuid(body.group_id);
        if (!groupId) return bad("group_id is required");
        const { error } = await supabase
          .from("facebook_post_log")
          .insert({ group_id: groupId, post_id: uuid(body.post_id) });
        if (error) throw error;
        break;
      }
      case "undo_log": {
        const id = uuid(body.id);
        if (!id) return bad("id is required");
        const { error } = await supabase.from("facebook_post_log").delete().eq("id", id);
        if (error) throw error;
        break;
      }
      default:
        return bad("unknown action");
    }
  } catch (err) {
    console.error("[admin/facebook]", action, err);
    return NextResponse.json({ error: "저장하지 못했습니다." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
