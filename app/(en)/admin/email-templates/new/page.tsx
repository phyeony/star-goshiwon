import Link from "next/link";
import { EmailTemplateForm } from "@/components/admin/email-template-form";

export const dynamic = "force-dynamic";

export default function NewEmailTemplatePage() {
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
          새 이메일 템플릿
        </h1>
      </div>
      <EmailTemplateForm />
    </div>
  );
}
