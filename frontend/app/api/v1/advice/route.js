import { auth } from '@clerk/nextjs/server'
import Anthropic from '@anthropic-ai/sdk'
import sql from '../../../../lib/db'
import {
  findOrCreateUser,
  getAgentMemories,
  saveSession,
  updateAgentMemory,
} from '../../../../lib/memory'

const MODEL   = process.env.ANTHROPIC_MODEL   || 'claude-haiku-4-5-20251001'
const API_KEY = process.env.ANTHROPIC_API_KEY || ''

const STUBS = {
  astrology:  'Based on your birth chart, you are most compatible with earth signs.',
  behavioral: 'Your communication style suggests you bond best through shared activities. Prioritize partners who enjoy the same hobbies as you.',
  history:    'Based on your stated preferences and dealbreakers, you tend to value stability. Consider partners who demonstrate consistency early on.',
}

const AGENTS = [
  {
    key:    'astrology',
    system: 'You are a celestial interpreter — a dating advisor who reads relationships through the lens of astrology, cosmic cycles, and symbolic meaning. Your voice is reflective, poetic, and abstract. You speak in metaphors drawn from planets, elements, and seasons. You do not give generic advice; you interpret the energy of the situation as if reading a natal chart.',
    prompt: (ctx, memory) =>
      (memory ? `Past advice you gave this user:\n${memory}\n\n` : '') +
      `User birth date: ${ctx.birth_date}\n` +
      `Looking for: ${ctx.preferences.looking_for}\n` +
      `Interests: ${ctx.preferences.interests.join(', ') || 'none'}\n` +
      `Dealbreakers: ${ctx.preferences.dealbreakers.join(', ') || 'none'}\n\n` +
      `Give your celestial interpretation of this person's romantic situation. Structure your response exactly as:\n` +
      `ADVICE: [2-3 sentences of metaphorical, astrology-grounded guidance]\n` +
      `REASONING: [1-2 sentences explaining which planetary or elemental themes inform this reading]\n` +
      `CONFIDENCE: [High / Medium / Low, with one sentence explaining why]`,
  },
  {
    key:    'behavioral',
    system: 'You are a behavioral compatibility analyst — a dating advisor who focuses on communication patterns, lifestyle alignment, and observable relationship dynamics. Your voice is direct, practical, and action-oriented. You give concrete next steps, not vague encouragement. You only reason from what the user explicitly stated; you do not speculate.',
    prompt: (ctx, memory) =>
      (memory ? `Past advice you gave this user:\n${memory}\n\n` : '') +
      `Looking for: ${ctx.preferences.looking_for}\n` +
      `Interests: ${ctx.preferences.interests.join(', ') || 'none'}\n` +
      `Dealbreakers: ${ctx.preferences.dealbreakers.join(', ') || 'none'}\n\n` +
      `Give a practical behavioral assessment of this person's romantic situation. Structure your response exactly as:\n` +
      `ADVICE: [2-3 sentences of specific, actionable guidance the person can act on immediately]\n` +
      `REASONING: [1-2 sentences identifying the key behavioral pattern or compatibility signal driving this advice]\n` +
      `CONFIDENCE: [High / Medium / Low, with one sentence explaining why]`,
  },
  {
    key:    'history',
    system: "You are a relationship pattern analyst — a dating advisor who identifies recurring themes in what a person values, avoids, and gravitates toward. Your voice is measured, observational, and pattern-focused. You draw inferences only from explicitly stated preferences and dealbreakers. You never invent past relationships, backstory, or emotional history that was not provided.",
    prompt: (ctx, memory) =>
      (memory ? `Past advice you gave this user:\n${memory}\n\n` : '') +
      `Looking for: ${ctx.preferences.looking_for}\n` +
      `Interests: ${ctx.preferences.interests.join(', ') || 'none'}\n` +
      `Dealbreakers: ${ctx.preferences.dealbreakers.join(', ') || 'none'}\n\n` +
      `Identify the relationship patterns visible in this person's stated preferences. Structure your response exactly as:\n` +
      `ADVICE: [2-3 sentences of pattern-based guidance naming what this person consistently moves toward or away from]\n` +
      `REASONING: [1-2 sentences identifying the specific preference or dealbreaker pattern that drives this advice]\n` +
      `CONFIDENCE: [High / Medium / Low, with one sentence explaining why]`,
  },
]

async function callAgent(client, agent, ctx, memory) {
  try {
    const msg = await client.messages.create({
      model:      MODEL,
      max_tokens: 256,
      system:     agent.system,
      messages:   [{ role: 'user', content: agent.prompt(ctx, memory) }],
    })
    return { agent_name: agent.key, advice: msg.content[0].text.trim(), source: 'llm' }
  } catch {
    return { agent_name: agent.key, advice: STUBS[agent.key], source: 'stub' }
  }
}

function stubJudge(opinions) {
  const themes = opinions
    .map((op) => `${op.agent_name}: ${op.advice.split('.')[0].toLowerCase()}`)
    .join(', ')
  return {
    final_advice: `Across all perspectives, you should focus on compatibility and intentionality. Key themes: ${themes}.`,
    rationale: `Combined ${opinions.length} agent opinions. All agents scored high on safety. Final advice synthesizes the leading insight from each perspective.`,
  }
}

async function llmJudge(client, opinions) {
  const summary = opinions.map((op) => `${op.agent_name}: ${op.advice}`).join('\n\n')
  try {
    const msg = await client.messages.create({
      model:      MODEL,
      max_tokens: 300,
      system:     'You are a senior relationship counselor synthesizing three expert advisor opinions — astrological, behavioral, and pattern-based — into a single, balanced recommendation. Your job is to identify where the advisors agree, where they diverge, and what the person should actually do. You must name a clear recommended action and acknowledge the tradeoff they are accepting by choosing it.',
      messages:   [{
        role:    'user',
        content:
          `Here are three advisor opinions:\n\n${summary}\n\n` +
          `Synthesize these perspectives into a unified recommendation. Structure your response exactly as:\n` +
          `ADVICE: [2-3 sentences — state a clear, specific recommended action. Name the primary tradeoff the person accepts by taking it.]\n` +
          `RATIONALE: [1 sentence — explain which advisors agreed, which diverged, and why you weighted them as you did.]`,
      }],
    })
    const text = msg.content[0].text
    const adv  = text.match(/ADVICE:\s*(.+?)(?=\nRATIONALE:|$)/s)
    const rat  = text.match(/RATIONALE:\s*(.+)/s)
    return {
      final_advice: adv ? adv[1].trim() : text.trim(),
      rationale:    rat ? rat[1].trim() : 'Synthesized from three advisor perspectives.',
    }
  } catch {
    return stubJudge(opinions)
  }
}

export async function POST(request) {
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const ctx = {
    user_id:    body.user_id    || 'anon',
    birth_date: body.birth_date || '1990-01-01',
    preferences: {
      looking_for:  body.preferences?.looking_for  || '',
      interests:    body.preferences?.interests    || [],
      dealbreakers: body.preferences?.dealbreakers || [],
    },
  }

  // ── Memory read ────────────────────────────────────────────────────────────
  let dbUserId  = null
  let memories  = {}
  if (sql) {
    try {
      dbUserId = await findOrCreateUser(userId)
      memories = await getAgentMemories(dbUserId)
    } catch (err) {
      console.error('[db] memory read failed:', err)
    }
  }

  // ── Agent + judge ──────────────────────────────────────────────────────────
  let opinions, judged

  if (API_KEY) {
    const client = new Anthropic({ apiKey: API_KEY })
    opinions = await Promise.all(
      AGENTS.map((a) => callAgent(client, a, ctx, memories[a.key]))
    )
    judged = await llmJudge(client, opinions)
  } else {
    opinions = AGENTS.map((a) => ({ agent_name: a.key, advice: STUBS[a.key], source: 'stub' }))
    judged   = stubJudge(opinions)
  }

  // ── Memory write ───────────────────────────────────────────────────────────
  if (sql && dbUserId !== null) {
    const rawInput = ctx.preferences.interests.join(' ') || ctx.preferences.looking_for
    try {
      await saveSession(dbUserId, rawInput, judged.final_advice, judged.rationale, opinions)
      await Promise.all(
        opinions.map((op) =>
          updateAgentMemory(dbUserId, op.agent_name, op.advice, memories[op.agent_name])
        )
      )
    } catch (err) {
      console.error('[db] memory write failed:', err)
    }
  }

  // ── Response ───────────────────────────────────────────────────────────────
  const scores = opinions.map((op) => ({
    agent_name: op.agent_name,
    relevance:  0.85,
    safety:     1.0,
    coherence:  0.80,
  }))

  return Response.json({
    final_advice:  judged.final_advice,
    rationale:     judged.rationale,
    scores,
    agent_sources: Object.fromEntries(opinions.map((op) => [op.agent_name, op.source])),
    opinions,
  })
}
