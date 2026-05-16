import Link from "next/link";
import { getEmailTemplates } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EmailTemplatesPage() {
  const templates = await getEmailTemplates();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          이메일 템플릿
        </h1>
        <Link
          href="/admin/email-templates/new"
          className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          새 템플릿
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500">
          등록된 템플릿이 없습니다. 이메일 작성 도구에서 사용할 템플릿을 만들어 보세요.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-bold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">이름</th>
                <th className="px-4 py-3">슬러그</th>
                <th className="px-4 py-3">제목</th>
                <th className="px-4 py-3 w-24">정렬</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-900">{t.label}</td>
                  <td className="px-4 py-3">
                    <code className="text-xs text-gray-600">{t.slug}</code>
                  </td>
                  <td className="px-4 py-3 text-gray-700 truncate max-w-md">
                    {t.subject}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{t.sort_order}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/email-templates/${t.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      수정
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
