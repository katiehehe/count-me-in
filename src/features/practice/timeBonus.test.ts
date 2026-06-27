import { describe, expect, it } from 'vitest'
import { MAX_TIME_BONUS, TAU_MS, timeBonusXp } from './timeBonus'

describe('timeBonusXp', () => {
  it('awards near max for an instant answer', () => {
    expect(timeBonusXp(0)).toBe(MAX_TIME_BONUS)
  })

  it('decays to 0 for a slow answer', () => {
    expect(timeBonusXp(60_000)).toBe(0)
  })

  it('never goes negative and is monotonically non-increasing in time', () => {
    let prev = Infinity
    for (let ms = 0; ms <= TAU_MS * 6; ms += 250) {
      const v = timeBonusXp(ms)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(prev)
      prev = v
    }
  })

  it('awards strictly less the longer it takes (in the meaningful range)', () => {
    expect(timeBonusXp(500)).toBeGreaterThan(timeBonusXp(TAU_MS))
    expect(timeBonusXp(TAU_MS)).toBeGreaterThan(timeBonusXp(TAU_MS * 3))
  })

  it('treats negative input as 0 (never above max)', () => {
    expect(timeBonusXp(-1000)).toBe(MAX_TIME_BONUS)
  })
})
