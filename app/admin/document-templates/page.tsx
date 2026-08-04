import { getDocumentTemplates } from "@/lib/documents/queries";
import {
  DocumentTemplateEditor,
  type SlotDescriptor,
} from "@/components/admin/document-template-editor";

export const dynamic = "force-dynamic";

const SLOTS: SlotDescriptor[] = [
  {
    type: "letter",
    lang: "ko",
    label: "체류 확인서 (한국어)",
    builtInTitle: "체류(숙소) 확인서",
  },
  {
    type: "letter",
    lang: "en",
    label: "체류 확인서 (English)",
    builtInTitle: "Accommodation (Residence) Confirmation",
  },
  {
    type: "contract",
    lang: "ko",
    label: "이용 계약서 (한국어)",
    builtInTitle: "숙소 이용 계약서",
  },
  {
    type: "contract",
    lang: "en",
    label: "이용 계약서 (English)",
    builtInTitle: "Accommodation Agreement",
  },
];

export default async function DocumentTemplatesPage() {
  const templates = await getDocumentTemplates();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          문서 양식
        </h1>
        <p className="text-sm text-gray-600 mt-2 max-w-3xl">
          체류 확인서와 이용 계약서의 양식을 관리합니다. 양식을 등록하지 않으면
          기본 양식으로 발급되며, 등록한 양식을 삭제하면 언제든 기본 양식으로
          되돌아갑니다. 게스트 정보는 발급할 때 입력하며 저장되지 않습니다.
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 mb-8 max-w-3xl">
        계약서 양식을 직접 올리는 경우, 단기 숙박을 주택임대차계약으로 표기하지
        않도록 주의하세요. &lsquo;본 계약은 주택임대차보호법상의 임대차계약이
        아닙니다&rsquo;에 해당하는 조항을 포함하는 것을 권장합니다. 저장 시
        자동으로 확인하여 안내합니다.
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {SLOTS.map((slot) => (
          <DocumentTemplateEditor
            key={`${slot.type}-${slot.lang}`}
            slot={slot}
            template={
              templates.find(
                (t) => t.type === slot.type && t.lang === slot.lang
              ) ?? null
            }
          />
        ))}
      </div>
    </div>
  );
}
