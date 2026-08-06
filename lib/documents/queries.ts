import { getSupabaseServiceClient } from "../supabase";
import type { DocumentTemplate, DocumentTemplateUpsert } from "../types";
import type { DocumentLang, DocumentType } from "./types";

export async function getDocumentTemplates(): Promise<DocumentTemplate[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("document_templates")
    .select("*")
    .order("type")
    .order("lang");
  if (error) throw error;
  return (data ?? []) as DocumentTemplate[];
}

export async function getDocumentTemplate(
  type: DocumentType,
  lang: DocumentLang
): Promise<DocumentTemplate | null> {
  // The 영문병기 variant is composed in code from the ko and en documents, so
  // no row can exist for it — skip the round-trip and let the caller fall back
  // to the built-in document.
  if (lang === "bi") return null;

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("document_templates")
    .select("*")
    .eq("type", type)
    .eq("lang", lang)
    .maybeSingle();
  if (error) throw error;
  return (data as DocumentTemplate | null) ?? null;
}

/** Upserts on the (type, lang) unique constraint — one template per slot. */
export async function upsertDocumentTemplate(
  input: DocumentTemplateUpsert
): Promise<DocumentTemplate> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("document_templates")
    .upsert(
      { ...input, updated_at: new Date().toISOString() },
      { onConflict: "type,lang" }
    )
    .select()
    .single();
  if (error) throw error;
  return data as DocumentTemplate;
}

/** Deleting a template reverts that slot to the built-in document. */
export async function deleteDocumentTemplate(
  type: DocumentType,
  lang: DocumentLang
): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase
    .from("document_templates")
    .delete()
    .eq("type", type)
    .eq("lang", lang);
  if (error) throw error;
}
