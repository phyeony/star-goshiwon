"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AVAILABLE_VARS,
  substitute,
} from "@/lib/admin-email-templates";
import { wrapEmailHtml, textToEmailHtml } from "@/lib/email-html";
import { siteConfig } from "@/lib/site-data";
import type { EmailTemplate } from "@/lib/types";
import {
  createTemplateAction,
  updateTemplateAction,
  deleteTemplateAction,
  type TemplateActionState,
} from "@/app/admin/email-templates/actions";

const initialState: TemplateActionState = { ok: false };

const SAMPLE_VARS: Record<string, string> = {
  guest_name: "Hyeonyoung Park",
  guest_email: "guest@example.com",
  room_name: "Private Shower Room",
  check_in_date: "2026-06-01",
  check_out_date: "2026-06-15",
  guest_count: "1",
  total_usd: "$420",
  deposit_usd: "$70",
  site_url: siteConfig.url,
  site_email: siteConfig.email,
  response_time: "24 hours",
};

type Locale = "en" | "ko";

export function EmailTemplateForm({ template }: { template?: EmailTemplate }) {
  const isEditing = Boolean(template);
  const router = useRouter();
  const [deleting, startDelete] = useTransition();

  const [label, setLabel] = useState(template?.label ?? "");
  const [slug, setSlug] = useState(template?.slug ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [subject, setSubject] = useState(template?.subject ?? "");
  const [body, setBody] = useState(template?.body ?? "");
  const [subjectKo, setSubjectKo] = useState(template?.subject_ko ?? "");
  const [bodyKo, setBodyKo] = useState(template?.body_ko ?? "");
  const [sortOrder, setSortOrder] = useState<number>(template?.sort_order ?? 0);
  const [locale, setLocale] = useState<Locale>("en");

  const action = isEditing
    ? updateTemplateAction.bind(null, template!.id)
    : createTemplateAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  function handleDelete() {
    if (!template) return;
    if (
      !window.confirm(
        `템플릿 "${template.label}"을(를) 삭제하시겠습니까? 복구할 수 없습니다.`
      )
    ) {
      return;
    }
    startDelete(async () => {
      try {
        await deleteTemplateAction(template.id);
      } catch (err) {
        alert((err as Error).message);
      }
    });
  }

  const previewSource = useMemo(() => {
    if (locale === "ko") {
      if (!subjectKo && !bodyKo) {
        return {
          subject: "",
          body: "",
          emptyHint:
            "아직 한국어 버전이 없습니다. 왼쪽의 한국어 제목/본문 입력란을 채우면 미리보기에서 확인할 수 있습니다.",
        };
      }
      return {
        subject: substitute(subjectKo, SAMPLE_VARS),
        body: substitute(bodyKo, SAMPLE_VARS),
        emptyHint: "",
      };
    }
    return {
      subject: substitute(subject, SAMPLE_VARS),
      body: substitute(body, SAMPLE_VARS),
      emptyHint: "",
    };
  }, [locale, subject, body, subjectKo, bodyKo]);

  const previewHtml = useMemo(
    () => wrapEmailHtml(textToEmailHtml(previewSource.body)),
    [previewSource.body]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6 rounded-xl border border-gray-200 bg-white px-4 py-3">
        <div className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">편집 중:</span>{" "}
          {locale === "en" ? "영어 버전" : "한국어 버전"}
          <span className="ml-2 text-xs text-gray-400">
            (편집기와 미리보기에 모두 적용됩니다)
          </span>
        </div>
        <LocaleToggle value={locale} onChange={setLocale} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <form action={formAction} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                이름
              </label>
              <input
                name="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                required
                className="block w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                슬러그
              </label>
              <input
                name="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                pattern="[a-z0-9_]+"
                title="영문 소문자, 숫자, 밑줄만 사용 가능합니다"
                className="block w-full border border-gray-300 rounded-lg p-3 text-sm font-mono focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                감사 로그에 사용됩니다. 영문 소문자, 숫자, 밑줄만 가능합니다.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              설명
            </label>
            <input
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="block w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* English section — kept in DOM so FormData always carries its value */}
          <section
            className={`space-y-4 rounded-xl border border-gray-200 p-4 bg-white ${
              locale === "en" ? "" : "hidden"
            }`}
          >
            <h3 className="text-sm font-bold text-gray-700 uppercase">
              영어 본문
            </h3>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                제목 (Subject)
              </label>
              <input
                name="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="block w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                본문 (Body)
              </label>
              <textarea
                name="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                rows={18}
                className="block w-full border border-gray-300 rounded-lg p-3 text-sm font-mono focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </section>

          {/* Korean section — same kept-in-DOM treatment */}
          <section
            className={`space-y-4 rounded-xl border border-gray-200 p-4 bg-white ${
              locale === "ko" ? "" : "hidden"
            }`}
          >
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-bold text-gray-700 uppercase">
                한국어 본문
              </h3>
              <span className="text-xs text-gray-500">선택 입력</span>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                제목
              </label>
              <input
                name="subject_ko"
                value={subjectKo}
                onChange={(e) => setSubjectKo(e.target.value)}
                className="block w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                본문
              </label>
              <textarea
                name="body_ko"
                value={bodyKo}
                onChange={(e) => setBodyKo(e.target.value)}
                rows={18}
                className="block w-full border border-gray-300 rounded-lg p-3 text-sm font-mono focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </section>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              정렬 순서
            </label>
            <input
              name="sort_order"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="block w-32 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              숫자가 작을수록 작성 도구의 드롭다운에서 위쪽에 표시됩니다.
            </p>
          </div>

          <details className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-700">
              사용 가능한 변수 ({AVAILABLE_VARS.length}개)
            </summary>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {AVAILABLE_VARS.map((v) => (
                <div key={v.name}>
                  <code className="text-indigo-700">{`{{${v.name}}}`}</code>
                  <span className="ml-2 text-gray-600">{v.description}</span>
                </div>
              ))}
            </div>
          </details>

          {state.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending || deleting}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {pending
                ? "저장 중..."
                : isEditing
                  ? "변경 사항 저장"
                  : "템플릿 만들기"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/email-templates")}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
            >
              취소
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={pending || deleting}
                className="ml-auto px-4 py-2 rounded-lg text-sm font-medium text-red-700 bg-white border border-red-300 hover:bg-red-50 disabled:opacity-50"
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            )}
          </div>
        </form>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-700 uppercase">
                미리보기 ({locale === "en" ? "영어" : "한국어"})
              </h3>
            </div>

            {previewSource.emptyHint ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {previewSource.emptyHint}
              </div>
            ) : (
              <>
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase">
                    제목
                  </div>
                  <div className="mt-1 text-sm font-medium text-gray-900 break-words">
                    {previewSource.subject || (
                      <span className="text-gray-400">(비어 있음)</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase mb-1">
                    본문
                  </div>
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                    <iframe
                      title="이메일 미리보기"
                      srcDoc={`<!doctype html><html><body style="margin:0;padding:16px;background:#f9fafb;">${previewHtml}</body></html>`}
                      sandbox=""
                      className="w-full"
                      style={{ height: 640, border: 0, background: "white" }}
                    />
                  </div>
                </div>
              </>
            )}

            <p className="text-xs text-gray-500">
              미리보기는 샘플 데이터({SAMPLE_VARS.guest_name},{" "}
              {SAMPLE_VARS.room_name}, {SAMPLE_VARS.check_in_date} →{" "}
              {SAMPLE_VARS.check_out_date})를 사용합니다. 실제 발송 시에는 해당 예약의 값으로 치환됩니다.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function LocaleToggle({
  value,
  onChange,
}: {
  value: Locale;
  onChange: (v: Locale) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-gray-300 bg-gray-50 p-0.5 text-xs font-medium">
      <button
        type="button"
        onClick={() => onChange("en")}
        className={`px-3 py-1 rounded ${
          value === "en" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
        }`}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => onChange("ko")}
        className={`px-3 py-1 rounded ${
          value === "ko" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
        }`}
      >
        한국어
      </button>
    </div>
  );
}
