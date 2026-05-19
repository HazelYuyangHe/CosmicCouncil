# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@docs/ARCHITECTURE.md

## Project

**AI Multi-Agent Dating Assistant** — CS7180 Project 3, Northeastern University.

A multi-agent system where specialized AI agents each contribute a distinct analytical perspective (astrology, behavioral analysis, user history) to collaboratively generate dating advice. An LLM-as-judge layer evaluates and synthesizes agent outputs before presenting a final response to the user.

---

## Current Project Status

Implementation order — check off before assuming something exists:

- [x] Base agent interface (`backend/agents/base.py` — `BaseAgent` ABC)
- [x] Core schemas (`backend/agents/schemas.py` — `UserContext`, `AgentOpinion`)
- [x] First agent (`backend/agents/astrology_agent.py` — stub, no real LLM call yet)
- [x] Agent unit tests (`backend/tests/agents/test_astrology_agent.py`)
- [ ] Settings / env loading (`pydantic-settings`)
- [ ] FastAPI app skeleton
- [ ] Orchestrator and remaining agents (`behavioral_agent`, `history_agent`)
- [ ] LLM-as-judge layer
- [ ] PostgreSQL models and persistence
- [ ] Frontend (React + TypeScript)
- [ ] CI/CD pipeline and monitoring integration

When a module referenced in this file does not exist yet, create it following the conventions below.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | Python 3.11, FastAPI |
| Agent Framework | LangGraph (planned for multi-agent orchestration) |
| LLM Provider | OpenAI GPT-4o (primary), Anthropic Claude (judge) |
| Frontend | React 18, TypeScript, Vite |
| Database | PostgreSQL (user profiles, history) + Redis (session cache) |
| Testing | pytest (backend), Vitest + React Testing Library (frontend) |
| Linting | Ruff + mypy (backend), ESLint + Prettier (frontend) |
| CI/CD | GitHub Actions (to be configured) |
| Monitoring | LangSmith (LLM tracing), Prometheus + Grafana (planned) |

---

## Intended Repository Structure

This is the target layout. Create new files under these paths as work progresses.

```
backend/
  agents/          # One module per agent (astrology, behavioral, history)
  judge/           # LLM-as-judge evaluation logic
  orchestrator/    # Agent dispatch and response synthesis
  api/             # FastAPI routers and schemas
  models/          # SQLAlchemy ORM models
  tests/           # pytest tests mirroring src structure
frontend/
  src/
    components/    # Reusable UI components
    features/      # Feature-scoped modules (chat, profile, results)
    hooks/         # Custom React hooks
    api/           # Typed API client (mirrors backend schemas)
docs/
  PRD.md
  ARCHITECTURE.md
.github/workflows/ # CI pipeline definitions
```

---

## Architecture Decisions

These are firm design decisions. Follow them when implementing any new component.

- **Each agent is stateless and independently callable.** Agents receive a `UserContext` payload and return a typed `AgentOpinion`. No agent holds session state.
- **The orchestrator owns the conversation graph.** It decides which agents to invoke, merges outputs, and passes them to the judge. Agents never call each other.
- **LLM-as-judge is a required step, not optional.** The judge scores each `AgentOpinion` on relevance, safety, and coherence before the final response is assembled. Never bypass it in production flows.
- **Frontend talks only to the FastAPI backend.** No direct LLM calls from the browser. API keys never leave the backend.
- **Async throughout the backend.** All FastAPI route handlers and agent calls must be `async def`. Use `httpx.AsyncClient` for any outbound HTTP. Note: `BaseAgent.run()` is currently synchronous — when real LLM calls are added, migrate it to `async def run(...)` and update all implementations.

---

## Coding Conventions

These conventions apply from the first line of code written.

### Python / Backend

- Type-annotate all function signatures. Use `pydantic.BaseModel` for all request/response schemas.
- All agents must implement the `BaseAgent` abstract interface (to be defined in `backend/agents/base.py`). Use `astrology_agent.py` as the reference implementation once it exists.
- Name agent modules by perspective: `astrology_agent.py`, `behavioral_agent.py`, `history_agent.py`.
- Use `structlog` for all logging — no bare `print()` or `logging.basicConfig`.
- Load environment variables via `pydantic-settings`; never hardcode API keys or model names.
- LLM prompt templates belong in `backend/agents/<name>/prompts.py`, not inline in logic.

### TypeScript / Frontend

- All API response types will be generated from the backend OpenAPI schema via `npm run generate-types`. Do not hand-write types that duplicate backend schemas.
- Never use `any`. Use `unknown` and narrow with type guards when necessary.
- Feature state belongs in feature-scoped Zustand stores, not in component state.
- Chat and advice display components should be pure (no side effects, no direct API calls).

---

## Testing Strategy (TDD)

Write the test before the implementation. PRs should not introduce logic without a corresponding test.

### Backend

```bash
cd backend
pip install -r requirements-dev.txt

# Run all tests
pytest

# Run a single test
pytest tests/agents/test_astrology_agent.py::test_returns_opinion_for_valid_context

# Run with coverage
pytest --cov=. --cov-report=term-missing

# Type check
mypy .

# Lint
ruff check .
```

- Unit-test each agent in isolation by mocking the LLM call (`pytest-mock` or `respx`).
- Integration-test the orchestrator end-to-end with a real (test-tier) LLM call, guarded by `@pytest.mark.integration`.
- Judge evaluation tests must assert on structured output fields (`score`, `rationale`), not raw LLM strings.

### Frontend (Next.js — actual current state)

```bash
cd frontend
npm install

# Run dev server
npm run dev

# Unit + integration tests (Vitest, no secrets needed)
npm test

# Watch mode
npm run test:watch

# Coverage report (html + terminal)
npm run test:coverage

# E2E tests (Playwright — starts dev server automatically)
npm run test:e2e

# E2E with interactive UI
npm run test:e2e:ui

# One-time Playwright browser install
npx playwright install --with-deps chromium
```

Test files:
- `tests/unit/memoryUtils.test.js` — pure rolling-memory helper (5 tests)
- `tests/integration/advice.test.js` — POST /api/v1/advice: auth guard, stub mode, response shape (5 tests)
- `tests/e2e/homepage.spec.js` — Playwright happy-path: page load, form, advisor cards, 401 flow (5 tests)

Integration tests mock Clerk, Neon, and Anthropic — run with no env vars, always in stub mode.

---

## Do's and Don'ts

**Do:**
- Keep agent logic pure: given the same `UserContext`, an agent must return the same shape of `AgentOpinion`. Control determinism at the LLM call level via `temperature`.
- Log LLM inputs and outputs to LangSmith on every agent invocation, including in dev.
- Version prompt templates with a `PROMPT_VERSION` constant so regressions are traceable.
- Plan for a Prometheus counter on every agent invocation and judge evaluation (implement when monitoring is wired up).

**Don't:**
- Don't add a new agent without also adding it to the orchestrator's agent registry and writing a unit test.
- Don't change `UserContext` or `AgentOpinion` schemas without updating all affected tests and (once it exists) the frontend generated types.
- Don't use `gpt-3.5-turbo` for the judge — it must use the model specified in `settings.JUDGE_MODEL`.
- Don't merge directly to `main`. All changes go through a PR; once CI is configured, it must pass.
- Don't store raw PII (names, photos, contact info) in logs or LangSmith traces.

---

## CI/CD

GitHub Actions workflow at `.github/workflows/ci.yml` runs on every push and pull_request.

Steps (all run with `working-directory: frontend`):
1. `npm ci` — install from lock file
2. `npm test` — Vitest unit + integration (no secrets needed)
3. `npm run test:coverage` — coverage report
4. `npm run build` — Next.js production build (requires `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` secret)
5. `npx playwright install --with-deps chromium` — install browser
6. `npm run test:e2e` — Playwright against production build via `npm start`
7. `npm audit --audit-level=high` — security audit (`continue-on-error: true`)

GitHub secrets required: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`.
`ANTHROPIC_API_KEY` and `DATABASE_URL` are intentionally omitted — app runs in stub/no-DB mode in CI.

---

## Architecture Overview

Current actual implementation (Next.js monolith, no separate Python backend in production):

| Component | Technology | Location |
|---|---|---|
| Frontend + API | Next.js 14 App Router | `frontend/app/` |
| Auth | Clerk (`@clerk/nextjs`) | `layout.js`, `middleware.js`, `auth()` in route |
| LLM agents + judge | Anthropic SDK (`@anthropic-ai/sdk`) | `app/api/v1/advice/route.js` |
| Database client | Neon serverless (`@neondatabase/serverless`) | `lib/db.js` |
| Memory helpers | Plain JS | `lib/memory.js`, `lib/memoryUtils.js` |

The Python `backend/` directory remains in the repo as a reference implementation but is not deployed.

---

## Data Flow

```
User submits situation (page.js)
→ POST /api/v1/advice
→ auth() — 401 if not signed in
→ findOrCreateUser(clerkUserId) → dbUserId   [skipped if DATABASE_URL unset]
→ getAgentMemories(dbUserId) → { astrology, behavioral, history }
→ 3 agents run in parallel via Promise.all
    each agent prompt = "Past advice you gave this user:\n<memory>\n\n" + current input
    LLM path: Anthropic claude-haiku-4-5-20251001 (if ANTHROPIC_API_KEY set)
    Stub path: hardcoded advice strings (if no API key)
→ llmJudge synthesizes → { final_advice, rationale }
→ saveSession() → advice_sessions + agent_opinions rows
→ updateAgentMemory() → upsert rolling last-3 per agent
→ Response: { opinions, final_advice, rationale, scores, agent_sources }
```

---

## Memory System

Per-user, per-agent memory stored in Neon PostgreSQL.

**Schema:** `agent_memory(user_id, agent_name, memory_summary, last_updated_at)` — `UNIQUE(user_id, agent_name)`

**Rolling window:** `buildRollingMemory(existingMemory, newAdvice)` in `lib/memoryUtils.js` keeps the last 3 advice texts as a newline-separated string. Oldest entry is dropped when the window is full.

**Prompt injection:** Each agent receives memory prepended as:
```
Past advice you gave this user:
<memory_summary>

<current prompt>
```

**Graceful degradation:** `lib/db.js` exports `null` when `DATABASE_URL` is not set. All DB operations are guarded by `if (sql) { ... }` — the app works fully without a database (no memory, stub or LLM advice still returned).

---

## Deployment

### Environment variables

| Variable | Required | Source |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk dashboard → API Keys |
| `CLERK_SECRET_KEY` | Yes | Clerk dashboard → API Keys |
| `ANTHROPIC_API_KEY` | No (stubs if absent) | Anthropic console |
| `DATABASE_URL` | No (no memory if absent) | Neon dashboard → Connection string |
| `ANTHROPIC_MODEL` | No (defaults to `claude-haiku-4-5-20251001`) | — |

### Steps

1. **Neon**: Create project → open SQL Editor → paste and run `frontend/schema.sql`
2. **Clerk**: Create application → copy publishable key and secret key
3. **Vercel**: Import repo, set root directory to `frontend/`, add all env vars
4. Local dev: create `frontend/.env.local` with the same variables

---

## Security Review

A security assessment was performed using the custom `.claude/agents/security-reviewer.md` agent.

Areas evaluated:
- Dependency scanning (`npm audit` in CI)
- Authentication enforcement (Clerk `auth()`, middleware posture)
- API route protection (rate limiting, input validation, identity trust boundary)
- OWASP Top 10 awareness (A07 Broken Auth, A02 Data Exposure, A03 Injection, A05 Misconfiguration)
- Security definition of done (acceptance criteria checklist)

Overall risk level: **Medium**. See README for full summary.

<!-- Last updated: 2026-04-21 -->
