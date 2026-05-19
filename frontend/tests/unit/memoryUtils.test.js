import { describe, it, expect } from 'vitest'
import { buildRollingMemory } from '../../lib/memoryUtils.js'

describe('buildRollingMemory', () => {
  it('returns just the new advice when there is no prior memory', () => {
    expect(buildRollingMemory(null, 'Advice A')).toBe('Advice A')
  })

  it('appends new advice to existing memory', () => {
    expect(buildRollingMemory('Advice A', 'Advice B')).toBe('Advice A\nAdvice B')
  })

  it('keeps at most 3 entries — drops oldest when full', () => {
    const result = buildRollingMemory('A\nB\nC', 'D')
    const entries = result.split('\n')
    expect(entries).toHaveLength(3)
    expect(entries).toEqual(['B', 'C', 'D'])
  })

  it('treats an empty string the same as no prior memory', () => {
    expect(buildRollingMemory('', 'New Advice')).toBe('New Advice')
  })

  it('retains exactly 3 entries after four sequential updates', () => {
    let mem = null
    mem = buildRollingMemory(mem, 'First')
    mem = buildRollingMemory(mem, 'Second')
    mem = buildRollingMemory(mem, 'Third')
    mem = buildRollingMemory(mem, 'Fourth')
    const entries = mem.split('\n').filter(Boolean)
    expect(entries).toHaveLength(3)
    expect(entries).toEqual(['Second', 'Third', 'Fourth'])
  })
})
