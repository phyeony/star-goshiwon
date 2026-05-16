"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminUserOrNull } from "@/lib/supabase-server";
import {
  createEmailTemplate,
  deleteEmailTemplate,
  updateEmailTemplate,
} from "@/lib/queries";
import { isValidSlug } from "@/lib/admin-email-templates";

export interface TemplateActionState {
  ok: boolean;
  error?: string;
}

interface TemplateFields {
  slug: string;
  label: string;
  description: string;
  subject: string;
  body: string;
  subject_ko: string;
  body_ko: string;
  sort_order: number;
}

type ExtractResult =
  | { kind: "fields"; fields: TemplateFields }
  | { kind: "error"; error: string };

function extractFields(formData: FormData): ExtractResult {
  const slug = String(formData.get("slug") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "");
  const subject_ko = String(formData.get("subject_ko") ?? "").trim();
  const body_ko = String(formData.get("body_ko") ?? "");
  const sortOrderRaw = String(formData.get("sort_order") ?? "0").trim();
  const sort_order = Number.isFinite(Number(sortOrderRaw)) ? Number(sortOrderRaw) : 0;

  if (!isValidSlug(slug)) {
    return { kind: "error", error: "Slug must be 1–64 chars: a–z, 0–9, underscore." };
  }
  if (label.length === 0) return { kind: "error", error: "Label is required." };
  if (subject.length === 0) return { kind: "error", error: "English subject is required." };
  if (body.length === 0) return { kind: "error", error: "English body is required." };

  return {
    kind: "fields",
    fields: { slug, label, description, subject, body, subject_ko, body_ko, sort_order },
  };
}

async function ensureAdmin(): Promise<TemplateActionState | null> {
  const user = await getAdminUserOrNull();
  if (!user) return { ok: false, error: "Not authorized." };
  return null;
}

export async function createTemplateAction(
  _prev: TemplateActionState,
  formData: FormData
): Promise<TemplateActionState> {
  const authErr = await ensureAdmin();
  if (authErr) return authErr;

  const result = extractFields(formData);
  if (result.kind === "error") return { ok: false, error: result.error };

  try {
    await createEmailTemplate(result.fields);
  } catch (err) {
    const msg = (err as { message?: string })?.message ?? "Failed to create template.";
    return { ok: false, error: msg };
  }

  revalidatePath("/admin/email-templates");
  redirect("/admin/email-templates");
}

export async function updateTemplateAction(
  id: string,
  _prev: TemplateActionState,
  formData: FormData
): Promise<TemplateActionState> {
  const authErr = await ensureAdmin();
  if (authErr) return authErr;

  const result = extractFields(formData);
  if (result.kind === "error") return { ok: false, error: result.error };

  try {
    await updateEmailTemplate(id, result.fields);
  } catch (err) {
    const msg = (err as { message?: string })?.message ?? "Failed to update template.";
    return { ok: false, error: msg };
  }

  revalidatePath("/admin/email-templates");
  revalidatePath(`/admin/email-templates/${id}/edit`);
  redirect("/admin/email-templates");
}

export async function deleteTemplateAction(id: string): Promise<void> {
  const authErr = await ensureAdmin();
  if (authErr) throw new Error(authErr.error);

  await deleteEmailTemplate(id);
  revalidatePath("/admin/email-templates");
  redirect("/admin/email-templates");
}
