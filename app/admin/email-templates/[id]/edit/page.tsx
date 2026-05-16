import Link from "next/link";
import { notFound } from "next/navigation";
import { EmailTemplateForm } from "@/components/admin/email-template-form";
import { getEmailTemplateById } from "@/lib/queries";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditEmailTemplatePage({ params }: Props) {
  const { id } = await params;
  const template = await getEmailTemplateById(id);
  if (!template) notFound();

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/email-templates"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← 템플릿 목록으로
        </Link>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-2">
          수정: {template.label}
        </h1>
      </div>
      <EmailTemplateForm template={template} />
    </div>
  );
}
