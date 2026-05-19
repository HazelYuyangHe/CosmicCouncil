---
name: update-claude-md
description: Inspect the current project state and update CLAUDE.md with accurate architecture, data flow, memory system, deployment, and testing documentation.
---

# update-claude-md

Keeps CLAUDE.md in sync with the actual state of the codebase. Run after significant structural changes: new routes, new libraries, auth changes, database schema changes, or dependency updates.

## Process

### 1. Inspect current state

Read these files before writing anything:
- `frontend/app/api/v1/advice/route.js` — core API and agent logic
- `frontend/app/layout.js` — ClerkProvider wrapping
- `frontend/middleware.js` — auth middleware
- `frontend/lib/db.js` — Neon database client
- `frontend/lib/memory.js` — memory helpers
- `frontend/schema.sql` — database schema
- `frontend/package.json` — dependencies

### 2. Update CLAUDE.md

Append or update only the sections below. Do not rewrite unrelated existing content. If a section already exists, update it in place rather than appending a duplicate.

---

#### Architecture Overview

Describe the current components:
- **Frontend**: Next.js App Router (`frontend/app/`)
- **API**: `/api/v1/advice` — POST route handler with 3 agents + judge
- **Auth**: Clerk (`ClerkProvider` in layout, `clerkMiddleware` in `middleware.js`, `auth()` in route)
- **Database**: Neon PostgreSQL via `@neondatabase/serverless` (HTTP, no persistent TCP)
- **Memory**: per-user per-agent rolling summary in `agent_memory` table

---

#### Data Flow

Describe the request lifecycle in one pass:

```
User submits situation
→ page.js POST /api/v1/advice
→ auth() — 401 if not signed in
→ findOrCreateUser(clerkUserId) → dbUserId
→ getAgentMemories(dbUserId) → { astrology, behavioral, history }
→ 3 agents run in parallel (LLM or stub), each receives past memory in prompt
→ llmJudge synthesizes opinions into final_advice + rationale
→ saveSession() → advice_sessions + agent_opinions rows
→ updateAgentMemory() → upsert rolling last-3 per agent
→ JSON response: { opinions, final_advice, rationale, scores, agent_sources }
```

---

#### Memory System

- **Schema**: `agent_memory(user_id, agent_name, memory_summary, last_updated_at)` — unique per `(user_id, agent_name)`
- **Rolling window**: last 3 advice texts stored as newline-separated string
- **Prompt injection**: prepended as `"Past advice you gave this user:\n<summary>\n\n"` before each agent's current prompt
- **Graceful degradation**: if `DATABASE_URL` is not set, DB operations are skipped; app still works without memory

---

#### Deployment

Required environment variables (set in Vercel dashboard and local `.env.local`):

| Variable | Source |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API Keys |
| `CLERK_SECRET_KEY` | Clerk dashboard → API Keys |
| `ANTHROPIC_API_KEY` | Anthropic console |
| `DATABASE_URL` | Neon dashboard → Connection string (Node.js format) |

Steps:
1. Create Neon project → run `schema.sql` in Neon SQL editor
2. Create Clerk application → copy keys
3. Deploy: set Vercel root directory to `frontend/`
4. Add all env vars in Vercel project settings

---

#### Testing Strategy

Current state — no automated test suite yet.

Manual verification checklist:
- [ ] Sign in via Clerk; confirm `UserButton` appears top-right
- [ ] Submit a situation; confirm 3 advisor cards populate with advice
- [ ] Submit a second time; confirm agent prompts include past memory (visible in Anthropic traces)
- [ ] Sign out; POST `/api/v1/advice` directly → expect `401 Unauthorized`
- [ ] DB check: `SELECT * FROM advice_sessions ORDER BY created_at DESC LIMIT 5` in Neon SQL editor
- [ ] DB check: `SELECT * FROM agent_memory` — confirm `memory_summary` accumulates across sessions

---

### 3. Add or refresh timestamp

Ensure the last line of CLAUDE.md is:
```
<!-- Last updated: YYYY-MM-DD -->
```
Replace any existing timestamp. Use today's date.

## Constraints
- Preserve all existing CLAUDE.md content not covered by the sections above
- Do not delete the existing Project, Tech Stack, or Coding Conventions sections
- Keep additions concise — this is a reference document, not a tutorial
- If a section is already accurate, leave it unchanged
