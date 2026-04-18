---
name: Git commit/push workflow for Nvoyce
description: Which git commands trigger Vercel auto-deploy reliably vs which ones fail
type: feedback
---

Always use these exact git patterns for Nvoyce commits:

**Standard files (no special characters in path):**
```bash
git add path/to/file.ts
git commit -m "Description"
git push
```

**Files with brackets like `[id]` in path:**
```bash
git add ':(literal)app/dashboard/documents/[id]/page.tsx'
git commit -m "Description"
git push
```

**Why:** Git treats `[id]` as a glob pattern and silently skips the file unless `:(literal)` prefix is used. This was the cause of multiple "no changes to commit" failures.

**Vercel auto-deploy:** Vercel sometimes fails to auto-deploy due to flaky GitHub webhook on the nvoyceapp-web org. When it doesn't auto-deploy, go to Vercel → Deployments → ⋯ → Redeploy. The webhook was reconnected on April 10 2026 — if it breaks again, go to Vercel → Settings → Git → Disconnect and reconnect with "All repositories" access.

**How to apply:** Use `:(literal)` prefix any time a file path contains `[` or `]`. Always verify commit went through with `git log --oneline -1` after push.
