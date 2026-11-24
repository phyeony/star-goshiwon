"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { copyText } from "@/lib/copy-text";
import {
  formatKstDate,
  groupStatuses,
  kstDaysBetween,
  type FacebookGroup,
  type FacebookPost,
  type FacebookPostLogEntry,
  type GroupStatus,
} from "@/lib/facebook-posts";
import { canCopyImages, copyImage, saveImages } from "./facebook-image";

export interface FbPhoto {
  id: string;
  caption: string;
  thumb: string;
  /** Same-origin URL of the largest version, for copying / saving. */
  full: string;
  fileName: string;
}

async function call(payload: Record<string, unknown>): Promise<string | null> {
  const res = await fetch("/api/admin/facebook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.ok) return null;
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  return data.error ?? "저장하지 못했습니다.";
}

function useFlash() {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    if (!label) return;
    const t = setTimeout(() => setLabel(null), 2000);
    return () => clearTimeout(t);
  }, [label]);
  return [label, setLabel] as const;
}

const btn =
  "inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50";
const btnPrimary =
  "inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50";
const input =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";

export function FacebookAdmin({
  groups,
  posts,
  log,
  photos,
}: {
  groups: FacebookGroup[];
  posts: FacebookPost[];
  log: FacebookPostLogEntry[];
  photos: FbPhoto[];
}) {
  const statuses = useMemo(() => groupStatuses(groups, posts, log), [groups, posts, log]);
  const photoById = useMemo(() => new Map(photos.map((p) => [p.id, p])), [photos]);
  const done = statuses.filter((s) => s.postedThisWeek).length;

  return (
    <div className="space-y-10">
      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-gray-900">그룹</h2>
          {groups.length > 0 && (
            <p className={`text-sm font-medium ${done === groups.length ? "text-green-700" : "text-gray-600"}`}>
              이번 주 {done}/{groups.length} 그룹 게시
            </p>
          )}
        </div>
        <div className="mt-3 space-y-3">
          {statuses.length === 0 && (
            <p className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
              아직 그룹이 없습니다. 아래에서 페이스북 그룹 이름과 링크를 추가하세요.
            </p>
          )}
          {statuses.map((status) => (
            <GroupCard key={status.group.id} status={status} posts={posts} photoById={photoById} />
          ))}
        </div>
        <AddGroupForm />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">게시글</h2>
        <p className="mt-1 text-sm text-gray-500">
          가격이 바뀌면 여기서 글을 수정하세요. 그룹마다 아직 안 쓴 글, 그다음엔 가장 오래전에 쓴 글을 추천합니다.
        </p>
        <div className="mt-3 space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} photos={photos} photoById={photoById} />
          ))}
          <NewPost photos={photos} />
        </div>
      </section>
    </div>
  );
}

// ─── Groups ───

function GroupCard({
  status,
  posts,
  photoById,
}: {
  status: GroupStatus;
  posts: FacebookPost[];
  photoById: Map<string, FbPhoto>;
}) {
  const router = useRouter();
  const { group, last, postedThisWeek, suggestedPostId } = status;
  const [postId, setPostId] = useState(suggestedPostId ?? "");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleOf = (id: string | null) => posts.find((p) => p.id === id)?.title ?? "삭제된 글";
  const post = posts.find((p) => p.id === postId) ?? null;

  useEffect(() => setPostId(suggestedPostId ?? ""), [suggestedPostId]);

  async function run(payload: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    const err = await call(payload);
    setBusy(false);
    if (err) setError(err);
    else router.refresh();
    return !err;
  }

  if (editing) {
    return (
      <GroupForm
        group={group}
        onDone={() => setEditing(false)}
        onDelete={async () => {
          if (confirm(`'${group.name}' 그룹과 게시 기록을 삭제할까요?`)) await run({ action: "delete_group", id: group.id });
        }}
      />
    );
  }

  const days = last ? kstDaysBetween(last.posted_at) : null;

  return (
    <div className={`rounded-xl border bg-white p-4 ${postedThisWeek ? "border-green-200" : "border-gray-200"}`}>
      <div className="flex items-start gap-3">
        <span
          aria-label={postedThisWeek ? "이번 주 게시함" : "이번 주 아직 안 함"}
          className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            postedThisWeek ? "bg-green-600 text-white" : "border-2 border-gray-300 text-transparent"
          }`}
        >
          ✓
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <a
              href={group.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-indigo-700 underline decoration-indigo-200 underline-offset-2 hover:decoration-indigo-600"
            >
              {group.name} ↗
            </a>
            <button type="button" onClick={() => setEditing(true)} className="text-xs text-gray-400 hover:text-gray-600">
              수정
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            {last ? (
              <>
                마지막 게시: {formatKstDate(last.posted_at)} ·{" "}
                {days === 0 ? "오늘" : `${days}일 전`} · {titleOf(last.post_id)}
              </>
            ) : (
              "아직 게시 기록 없음"
            )}
          </p>
          {group.notes && <p className="mt-1 text-xs text-gray-500 whitespace-pre-wrap">{group.notes}</p>}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {postedThisWeek && last ? (
              <>
                <span className="text-sm font-medium text-green-700">이번 주 게시 완료</span>
                <button
                  type="button"
                  disabled={busy}
                  className="text-xs text-gray-400 underline hover:text-gray-600"
                  onClick={() => run({ action: "undo_log", id: last.id })}
                >
                  취소
                </button>
              </>
            ) : (
              <>
                <select value={postId} onChange={(e) => setPostId(e.target.value)} className="max-w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm">
                  {posts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id === suggestedPostId ? `추천: ${p.title}` : p.title}
                    </option>
                  ))}
                </select>
                <button type="button" className={btn} onClick={() => setOpen((v) => !v)}>
                  {open ? "닫기" : "글·사진 보기"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className={btnPrimary}
                  onClick={async () => {
                    if (await run({ action: "log_post", group_id: group.id, post_id: postId || null })) setOpen(false);
                  }}
                >
                  게시함 ✓
                </button>
              </>
            )}
          </div>
          {open && !postedThisWeek && post && (
            <div className="mt-3 rounded-lg bg-gray-50 p-3">
              <PostTools post={post} photoById={photoById} groupUrl={group.url} />
            </div>
          )}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}

function AddGroupForm() {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" className={`${btn} mt-3`} onClick={() => setOpen(true)}>
        + 그룹 추가
      </button>
    );
  }
  return (
    <div className="mt-3">
      <GroupForm onDone={() => setOpen(false)} />
    </div>
  );
}

function GroupForm({
  group,
  onDone,
  onDelete,
}: {
  group?: FacebookGroup;
  onDone: () => void;
  onDelete?: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(group?.name ?? "");
  const [url, setUrl] = useState(group?.url ?? "");
  const [notes, setNotes] = useState(group?.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await call({ action: group ? "update_group" : "add_group", id: group?.id, name, url, notes });
    setBusy(false);
    if (err) return setError(err);
    router.refresh();
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-2 rounded-xl border border-indigo-200 bg-white p-4">
      <input className={input} placeholder="그룹 이름 (예: Foreigners in Seoul)" value={name} onChange={(e) => setName(e.target.value)} />
      <input className={input} placeholder="https://www.facebook.com/groups/..." value={url} onChange={(e) => setUrl(e.target.value)} inputMode="url" />
      <input className={input} placeholder="메모 (예: 금요일만 홍보 가능)" value={notes} onChange={(e) => setNotes(e.target.value)} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className={btnPrimary}>
          저장
        </button>
        <button type="button" className={btn} onClick={onDone}>
          취소
        </button>
        {onDelete && (
          <button type="button" className="ml-auto text-sm text-red-600 hover:text-red-700" onClick={onDelete}>
            그룹 삭제
          </button>
        )}
      </div>
    </form>
  );
}

// ─── Copy / save tools ───

function PostTools({
  post,
  photoById,
  groupUrl,
}: {
  post: FacebookPost;
  photoById: Map<string, FbPhoto>;
  groupUrl?: string;
}) {
  const [flash, setFlash] = useFlash();
  const [imageCopy, setImageCopy] = useState(false);
  const [saving, setSaving] = useState(false);
  const photos = post.photo_ids.map((id) => photoById.get(id)).filter((p): p is FbPhoto => !!p);

  useEffect(() => setImageCopy(canCopyImages()), []);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {groupUrl && (
          <a href={groupUrl} target="_blank" rel="noopener noreferrer" className={btn}>
            1. 그룹 열기 ↗
          </a>
        )}
        <button
          type="button"
          className={btnPrimary}
          onClick={async () => setFlash((await copyText(post.body)) ? "글 복사됨" : "복사 실패")}
        >
          {groupUrl ? "2. 글 복사" : "글 복사"}
        </button>
        {photos.length > 0 && (
          <button
            type="button"
            disabled={saving}
            className={btn}
            onClick={async () => {
              setSaving(true);
              try {
                await saveImages(photos.map((p) => ({ url: p.full, name: p.fileName })));
              } catch {
                setFlash("사진을 가져오지 못했습니다");
              }
              setSaving(false);
            }}
          >
            {saving ? "준비 중…" : `사진 ${photos.length}장 저장`}
          </button>
        )}
        {flash && <span className="self-center text-sm text-green-700">{flash}</span>}
      </div>
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {photos.map((p) => (
            <div key={p.id} className="w-28">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.thumb} alt={p.caption} className="h-28 w-28 rounded-lg object-cover" />
              {imageCopy && (
                <button
                  type="button"
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white py-1 text-xs text-gray-700 hover:bg-gray-50"
                  onClick={async () => setFlash((await copyImage(p.full)) ? "사진 복사됨: 붙여넣기 하세요" : "사진 복사 실패")}
                >
                  사진 복사
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-500">
        컴퓨터: &lsquo;사진 복사&rsquo; 후 페이스북 글쓰기 창에 Ctrl/Cmd+V (한 장씩).
        휴대폰: &lsquo;사진 저장&rsquo;으로 사진 앱에 저장한 뒤 페이스북 앱에서 첨부.
      </p>
    </div>
  );
}

// ─── Posts ───

function PostCard({
  post,
  photos,
  photoById,
}: {
  post: FacebookPost;
  photos: FbPhoto[];
  photoById: Map<string, FbPhoto>;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <PostForm
        post={post}
        photos={photos}
        onDone={() => setEditing(false)}
        onDelete={async () => {
          if (!confirm(`'${post.title}' 글을 삭제할까요?`)) return;
          const err = await call({ action: "delete_post", id: post.id });
          if (err) alert(err);
          else router.refresh();
        }}
      />
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-gray-900">{post.title}</h3>
        <button type="button" onClick={() => setEditing(true)} className="text-xs text-gray-400 hover:text-gray-600">
          수정
        </button>
      </div>
      <p className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap text-sm text-gray-700">{post.body}</p>
      <div className="mt-3">
        <PostTools post={post} photoById={photoById} />
      </div>
    </div>
  );
}

function NewPost({ photos }: { photos: FbPhoto[] }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" className={btn} onClick={() => setOpen(true)}>
        + 새 글
      </button>
    );
  }
  return <PostForm photos={photos} onDone={() => setOpen(false)} />;
}

function PostForm({
  post,
  photos,
  onDone,
  onDelete,
}: {
  post?: FacebookPost;
  photos: FbPhoto[];
  onDone: () => void;
  onDelete?: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(post?.title ?? "");
  const [body, setBody] = useState(post?.body ?? "");
  const [photoIds, setPhotoIds] = useState<string[]>(post?.photo_ids ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setPhotoIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await call({ action: "save_post", id: post?.id, title, body, photo_ids: photoIds });
    setBusy(false);
    if (err) return setError(err);
    router.refresh();
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-indigo-200 bg-white p-4">
      <input className={input} placeholder="제목 (관리용, 게시되지 않음)" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className={`${input} min-h-[220px]`} placeholder="게시할 글" value={body} onChange={(e) => setBody(e.target.value)} />
      <div>
        <p className="text-sm font-medium text-gray-700">사진 (누른 순서대로 첨부, {photoIds.length}장 선택)</p>
        <div className="mt-2 grid max-h-72 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6">
          {photos.map((p) => {
            const index = photoIds.indexOf(p.id);
            return (
              <button
                key={p.id}
                type="button"
                title={p.caption}
                onClick={() => toggle(p.id)}
                className={`relative aspect-square overflow-hidden rounded-lg border-2 ${index >= 0 ? "border-indigo-600" : "border-transparent"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.thumb} alt={p.caption} className="h-full w-full object-cover" loading="lazy" />
                {index >= 0 && (
                  <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className={btnPrimary}>
          저장
        </button>
        <button type="button" className={btn} onClick={onDone}>
          취소
        </button>
        {onDelete && (
          <button type="button" className="ml-auto text-sm text-red-600 hover:text-red-700" onClick={onDelete}>
            글 삭제
          </button>
        )}
      </div>
    </form>
  );
}
