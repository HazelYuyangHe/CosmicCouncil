import sql from './db'
import { buildRollingMemory } from './memoryUtils'

// Returns the internal users.id for this Clerk user, creating the row if needed.
export async function findOrCreateUser(clerkUserId) {
  const existing = await sql`
    SELECT id FROM users WHERE clerk_user_id = ${clerkUserId}
  `
  if (existing.length > 0) return existing[0].id

  const [created] = await sql`
    INSERT INTO users (clerk_user_id) VALUES (${clerkUserId})
    RETURNING id
  `
  return created.id
}

// Returns { astrology: '...', behavioral: '...', history: '...' }
// Missing agents return undefined (no prior memory).
export async function getAgentMemories(userId) {
  const rows = await sql`
    SELECT agent_name, memory_summary
    FROM agent_memory
    WHERE user_id = ${userId}
  `
  return Object.fromEntries(rows.map((r) => [r.agent_name, r.memory_summary]))
}

// Persists the session and all agent opinions. Returns the new session id.
export async function saveSession(userId, rawInput, finalAdvice, rationale, opinions) {
  const [session] = await sql`
    INSERT INTO advice_sessions (user_id, raw_input, final_advice, rationale)
    VALUES (${userId}, ${rawInput}, ${finalAdvice}, ${rationale})
    RETURNING id
  `

  for (const op of opinions) {
    await sql`
      INSERT INTO agent_opinions (session_id, agent_name, advice, source)
      VALUES (${session.id}, ${op.agent_name}, ${op.advice}, ${op.source})
    `
  }

  return session.id
}

// Upserts agent_memory with a rolling summary of the last 3 advice texts.
export async function updateAgentMemory(userId, agentName, newAdvice, existingMemory) {
  const updated = buildRollingMemory(existingMemory, newAdvice)

  await sql`
    INSERT INTO agent_memory (user_id, agent_name, memory_summary, last_updated_at)
    VALUES (${userId}, ${agentName}, ${updated}, NOW())
    ON CONFLICT (user_id, agent_name)
    DO UPDATE SET memory_summary = ${updated}, last_updated_at = NOW()
  `
}
