export function parseAdminAllowlist(): string[] {
  const raw = process.env.ADMIN_EMAIL || "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowlist = parseAdminAllowlist();
  if (allowlist.length === 0) return false;
  return allowlist.includes(email.trim().toLowerCase());
}
