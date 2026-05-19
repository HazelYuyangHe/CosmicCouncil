import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.mock calls are hoisted before imports — these intercept the route's dependencies.
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

// Provide a null sql client so the route's DB guard (if (sql) {...}) skips all DB ops.
vi.mock('../../lib/db.js', () => ({ default: null }))

vi.mock('../../lib/memory.js', () => ({
  findOrCreateUser:  vi.fn().mockResolvedValue(1),
  getAgentMemories:  vi.fn().mockResolvedValue({}),
  saveSession:       vi.fn().mockResolvedValue(1),
  updateAgentMemory: vi.fn().mockResolvedValue(undefined),
}))

import { auth } from '@clerk/nextjs/server'
import { POST } from '../../app/api/v1/advice/route.js'

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRequest(body) {
  return new Request('http://localhost/api/v1/advice', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
}

const VALID_BODY = {
  user_id:    'test-user',
  birth_date: '1990-01-01',
  preferences: {
    looking_for:  'relationship-advice',
    interests:    ['I am unsure about my relationship.'],
    dealbreakers: [],
  },
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('POST /api/v1/advice — auth guard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when the user is not signed in', async () => {
    auth.mockResolvedValue({ userId: null })

    const res  = await POST(makeRequest(VALID_BODY))
    const data = await res.json()

    expect(res.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 400 for a malformed JSON body', async () => {
    auth.mockResolvedValue({ userId: 'user_abc' })

    const req = new Request('http://localhost/api/v1/advice', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    'not valid json',
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })
})

describe('POST /api/v1/advice — stub mode (no ANTHROPIC_API_KEY)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    auth.mockResolvedValue({ userId: 'user_abc123' })
  })

  it('returns HTTP 200 with the correct response shape', async () => {
    const res  = await POST(makeRequest(VALID_BODY))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toHaveProperty('opinions')
    expect(data).toHaveProperty('final_advice')
    expect(data).toHaveProperty('rationale')
    expect(data).toHaveProperty('scores')
    expect(data).toHaveProperty('agent_sources')
  })

  it('returns exactly three opinions — one per agent', async () => {
    const res  = await POST(makeRequest(VALID_BODY))
    const data = await res.json()

    expect(data.opinions).toHaveLength(3)
    expect(data.opinions.map((o) => o.agent_name).sort()).toEqual([
      'astrology',
      'behavioral',
      'history',
    ])
  })

  it('all stub opinions have source="stub" and non-empty advice', async () => {
    const res  = await POST(makeRequest(VALID_BODY))
    const data = await res.json()

    data.opinions.forEach((op) => {
      expect(op.source).toBe('stub')
      expect(op.advice.length).toBeGreaterThan(0)
    })
  })
})
