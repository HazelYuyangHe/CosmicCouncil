// Pure helper: builds a rolling memory summary.
// Keeps at most 3 newline-separated entries; oldest entry is dropped when full.
export function buildRollingMemory(existingMemory, newAdvice) {
  const past = existingMemory ? existingMemory.split('\n').filter(Boolean) : []
  return [...past, newAdvice].slice(-3).join('\n')
}
