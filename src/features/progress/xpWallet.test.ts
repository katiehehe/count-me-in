import { describe, expect, it } from 'vitest'
import {
  AI_PIP_COSMETIC_ID,
  AI_PIP_COST,
  AI_PIP_GENERATIONS,
  canAfford,
  computeBuyAiPip,
  computeSetCustomPip,
  cosmeticById,
  COSMETICS,
  customPipUrlFor,
  DEFAULT_PIP_THEME,
  isCosmeticOwned,
  pipLookFor,
  spendableBalance,
  STREAK_FREEZE_COST,
} from './xpWallet'

describe('spendableBalance / canAfford', () => {
  it('is lifetime minus spent, floored at 0', () => {
    expect(spendableBalance({ companionXp: 100, spentXp: 30 })).toBe(70)
    expect(spendableBalance({ companionXp: 100 })).toBe(100)
    expect(spendableBalance({ companionXp: 10, spentXp: 50 })).toBe(0)
    expect(spendableBalance(null)).toBe(0)
  })

  it('gates affordability', () => {
    expect(canAfford({ companionXp: 60 }, STREAK_FREEZE_COST)).toBe(true)
    expect(canAfford({ companionXp: 40 }, STREAK_FREEZE_COST)).toBe(false)
    expect(canAfford({ companionXp: 100, spentXp: 80 }, STREAK_FREEZE_COST)).toBe(false)
  })
})

describe('cosmetics catalog', () => {
  it('has a free default and unique ids', () => {
    const def = cosmeticById('default')
    expect(def?.cost).toBe(0)
    const ids = COSMETICS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(COSMETICS.every((c) => c.cost >= 0)).toBe(true)
  })

  it('treats default as always owned and others by unlock list', () => {
    expect(isCosmeticOwned(null, 'default')).toBe(true)
    expect(isCosmeticOwned({ unlockedCosmetics: [] }, 'wizard')).toBe(false)
    expect(isCosmeticOwned({ unlockedCosmetics: ['wizard'] }, 'wizard')).toBe(true)
  })

  it('resolves a Pip look, falling back to the default', () => {
    expect(pipLookFor(null)).toEqual({ theme: DEFAULT_PIP_THEME, hat: null })
    expect(pipLookFor('nope')).toEqual({ theme: DEFAULT_PIP_THEME, hat: null })
    const wiz = pipLookFor('wizard')
    expect(wiz.hat).toBe('wizard')
    expect(wiz.theme).not.toEqual(DEFAULT_PIP_THEME)
  })

  it('keeps the AI Pip out of the SVG cosmetics grid', () => {
    expect(cosmeticById(AI_PIP_COSMETIC_ID)).toBeUndefined()
    expect(COSMETICS.some((c) => c.id === AI_PIP_COSMETIC_ID)).toBe(false)
  })
})

describe('AI custom Pip', () => {
  it('prices the AI Pip as the premium top sink', () => {
    expect(AI_PIP_COST).toBe(1000)
    expect(AI_PIP_COST).toBeGreaterThan(Math.max(...COSMETICS.map((c) => c.cost)))
    expect(canAfford({ companionXp: AI_PIP_COST }, AI_PIP_COST)).toBe(true)
    expect(canAfford({ companionXp: AI_PIP_COST - 1 }, AI_PIP_COST)).toBe(false)
  })

  it('buyAiPip spends, unlocks ai-custom, and grants generations', () => {
    const r = computeBuyAiPip({ companionXp: 1200, spentXp: 0, unlockedCosmetics: [] })
    expect(r).toEqual({
      spentXp: AI_PIP_COST,
      unlockedCosmetics: [AI_PIP_COSMETIC_ID],
      customPipGensLeft: AI_PIP_GENERATIONS,
    })
  })

  it('buyAiPip rejects an unaffordable balance', () => {
    expect(computeBuyAiPip({ companionXp: 500, spentXp: 0 })).toBeNull()
    expect(computeBuyAiPip({ companionXp: 1200, spentXp: 300 })).toBeNull()
  })

  it('re-buying refills generations without duplicating ownership', () => {
    const r = computeBuyAiPip({
      companionXp: 5000,
      spentXp: 1000,
      unlockedCosmetics: [AI_PIP_COSMETIC_ID],
    })
    expect(r?.unlockedCosmetics).toEqual([AI_PIP_COSMETIC_ID])
    expect(r?.customPipGensLeft).toBe(AI_PIP_GENERATIONS)
  })

  it('setCustomPip stores, decrements, and equips ai-custom', () => {
    const r = computeSetCustomPip({ customPipGensLeft: 3 }, 'https://x/pip.png', 'a ninja cat')
    expect(r).toEqual({
      customPipUrl: 'https://x/pip.png',
      customPipPrompt: 'a ninja cat',
      customPipGensLeft: 2,
      equippedCosmetic: AI_PIP_COSMETIC_ID,
    })
  })

  it('setCustomPip is blocked with no generations left', () => {
    expect(computeSetCustomPip({ customPipGensLeft: 0 }, 'u', 'p')).toBeNull()
    expect(computeSetCustomPip(null, 'u', 'p')).toBeNull()
  })

  it('customPipUrlFor only returns the image when ai-custom is equipped', () => {
    expect(
      customPipUrlFor({ equippedCosmetic: AI_PIP_COSMETIC_ID, customPipUrl: 'https://x/p.png' }),
    ).toBe('https://x/p.png')
    expect(customPipUrlFor({ equippedCosmetic: 'wizard', customPipUrl: 'https://x/p.png' })).toBeNull()
    expect(customPipUrlFor({ equippedCosmetic: AI_PIP_COSMETIC_ID, customPipUrl: null })).toBeNull()
    expect(customPipUrlFor(null)).toBeNull()
  })
})
