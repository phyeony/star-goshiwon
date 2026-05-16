import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { getAdminUserOrNull, isAuthConfigured } from "@/lib/supabase-server";

interface Props {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ searchParams }: Props) {
  const { next, error } = await searchParams;
  const configured = isAuthConfigured();
  const user = configured ? await getAdminUserOrNull() : null;
  if (user) redirect(next || "/admin");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-1">관리자 로그인</h1>
        <p className="text-sm text-gray-500 mb-6">
          일회용 로그인 링크를 이메일로 보내드립니다.
        </p>
        {!configured && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            인증이 설정되지 않았습니다. 환경 변수에 <code>SUPABASE_URL</code>과{" "}
            <code>SUPABASE_ANON_KEY</code>를 설정한 후 재시작해 주세요.
          </div>
        )}
        {error === "forbidden" && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            이 이메일은 관리자 페이지에 접근할 권한이 없습니다.
          </div>
        )}
        {error === "exchange_failed" && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            로그인 링크가 유효하지 않거나 만료되었습니다. 아래에서 새로 요청해 주세요.
          </div>
        )}
        {error === "oauth_failed" && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Google 로그인에 실패했습니다. 다시 시도하거나 매직 링크를 사용해 주세요.
          </div>
        )}
        <LoginForm next={next} disabled={!configured} />
      </div>
    </div>
  );
}
