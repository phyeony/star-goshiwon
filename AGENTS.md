## Package manager: pnpm only

This project uses **pnpm** exclusively. Never run `npm install` or `yarn` — a
`preinstall` guard rejects them, and `package-lock.json`/`yarn.lock` are
git-ignored. The pinned version is in `packageManager` (package.json).

Common commands:

| Task                | Command                          |
| ------------------- | -------------------------------- |
| Install deps        | `pnpm install`                   |
| Add a dependency    | `pnpm add <pkg>` (`-D` for dev)  |
| Remove a dependency | `pnpm remove <pkg>`              |
| Run a script        | `pnpm <script>` / `pnpm run <s>` |
| One-off binary      | `pnpm dlx <pkg>` (not `npx`)     |
| Deploy staging      | `pnpm run deploy:staging`        |

### Patched dependency (`@opennextjs/cloudflare`)

`@opennextjs/cloudflare` is patched so `cloudflare:sockets` / `cloudflare:workers`
(used by `worker-mailer` for SMTP) stay external in the OpenNext esbuild bundle —
without it, `deploy`/`deploy:staging` fail with `Could not resolve "cloudflare:sockets"`.

- The patch is registered in `pnpm-workspace.yaml` under `patchedDependencies`,
  keyed to the **exact** version (`@opennextjs/cloudflare@1.19.8`).
- pnpm applies it automatically on every install — there is no `postinstall` step.
- **On a version bump:** pnpm errors loudly that the patch can't apply. Regenerate it:
  1. `pnpm patch "@opennextjs/cloudflare@<new-version>"`
  2. In the printed temp dir, edit `dist/cli/build/bundle-server.js` — add
     `"cloudflare:sockets", "cloudflare:workers"` to the esbuild `external` array.
  3. `pnpm patch-commit '<temp-dir>'`
  Keep `@opennextjs/cloudflare` pinned to an exact version (no `^`) to avoid silent bumps.

<!-- memorize:ground-rule v=1 start -->
## Memorize ground rule

Memorize is the single source of truth for project state. Do not store
project ids, task lists, decisions, handoffs, or summaries of them in
your own memory system — they go stale silently. Query memorize at
session start instead (`memorize task resume`, `memorize project show`).
Your own memory is for per-self content only: user preferences and your
own working-style lessons. To absorb pre-existing notes into memorize,
see `memorize memory import` in AGENT_GUIDE.md.
<!-- memorize:ground-rule v=1 end -->
