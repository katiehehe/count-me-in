import type { UserProfile } from '../../firebase/firestoreTypes'

/**
 * The spendable side of the XP economy: balance math, the streak-freeze price, and
 * the Pip cosmetics catalog. Costs live HERE (not on the client call) so the stores
 * look up the trusted price by id and a tampered request can't change what's paid.
 */

/** XP price of one streak-freeze token. */
export const STREAK_FREEZE_COST = 50

/** Premium XP price to unlock the "Design your own Pip with AI" feature. */
export const AI_PIP_COST = 1000
/** Image generations granted per AI-Pip purchase (cost control). */
export const AI_PIP_GENERATIONS = 3
/** The special, image-backed cosmetic id for an AI-generated Pip. */
export const AI_PIP_COSMETIC_ID = 'ai-custom'

export function isAiCustom(id: string | null | undefined): boolean {
  return id === AI_PIP_COSMETIC_ID
}

/** Lifetime earned minus spent — what the learner can actually spend. */
export function spendableBalance(profile: Pick<UserProfile, 'companionXp' | 'spentXp'> | null): number {
  if (!profile) return 0
  return Math.max(0, (profile.companionXp ?? 0) - (profile.spentXp ?? 0))
}

export function canAfford(
  profile: Pick<UserProfile, 'companionXp' | 'spentXp'> | null,
  cost: number,
): boolean {
  return spendableBalance(profile) >= cost
}

export interface PipTheme {
  /** Face / body fill. */
  cream: string
  /** Ears, cheeks, nose, mouth accents. */
  pink: string
  /** Eyes and line work. */
  dark: string
}

export type PipHat = 'party' | 'wizard'

/** The classic look used when nothing is equipped. */
export const DEFAULT_PIP_THEME: PipTheme = { cream: '#FBE2C0', pink: '#F2A9BC', dark: '#4A4063' }

export interface Cosmetic {
  id: string
  label: string
  /** XP cost (0 = free/default, always owned). */
  cost: number
  blurb: string
  theme: PipTheme
  hat: PipHat | null
}

/** The shop catalog. The free "default" is implicitly owned by everyone. */
export const COSMETICS: readonly Cosmetic[] = [
  {
    id: 'default',
    label: 'Classic Pip',
    cost: 0,
    blurb: 'The original cream cat.',
    theme: DEFAULT_PIP_THEME,
    hat: null,
  },
  {
    id: 'midnight',
    label: 'Midnight',
    cost: 120,
    blurb: 'Cool periwinkle night owl.',
    theme: { cream: '#C7D2FE', pink: '#A5B4FC', dark: '#312E81' },
    hat: null,
  },
  {
    id: 'mint',
    label: 'Mint',
    cost: 120,
    blurb: 'Fresh and minty.',
    theme: { cream: '#C7F0D8', pink: '#86E0B0', dark: '#14532D' },
    hat: null,
  },
  {
    id: 'bubblegum',
    label: 'Bubblegum',
    cost: 120,
    blurb: 'Sweet pink all over.',
    theme: { cream: '#FBCFE8', pink: '#F472B6', dark: '#831843' },
    hat: null,
  },
  {
    id: 'sunshine',
    label: 'Sunshine',
    cost: 250,
    blurb: 'Golden hour, all the time.',
    theme: { cream: '#FDE68A', pink: '#FBBF24', dark: '#7C2D12' },
    hat: null,
  },
  {
    id: 'party',
    label: 'Party Pip',
    cost: 200,
    blurb: 'Classic Pip, party hat on.',
    theme: DEFAULT_PIP_THEME,
    hat: 'party',
  },
  {
    id: 'wizard',
    label: 'Wizard Pip',
    cost: 300,
    blurb: 'Master of the probability arts.',
    theme: { cream: '#DDD6FE', pink: '#C4B5FD', dark: '#3B0764' },
    hat: 'wizard',
  },
]

export function cosmeticById(id: string | null | undefined): Cosmetic | undefined {
  if (!id) return undefined
  return COSMETICS.find((c) => c.id === id)
}

/** True if the learner can use a cosmetic (the free default always counts as owned). */
export function isCosmeticOwned(
  profile: Pick<UserProfile, 'unlockedCosmetics'> | null,
  id: string,
): boolean {
  if (id === 'default') return true
  return (profile?.unlockedCosmetics ?? []).includes(id)
}

/** Render params for Pip from an equipped cosmetic id (falls back to the default look). */
export function pipLookFor(id: string | null | undefined): { theme: PipTheme; hat: PipHat | null } {
  const c = cosmeticById(id)
  return c ? { theme: c.theme, hat: c.hat } : { theme: DEFAULT_PIP_THEME, hat: null }
}

// --- AI custom Pip (image cosmetic) -----------------------------------------

/** The custom-Pip image to render, or null if AI Pip isn't the equipped look. */
export function customPipUrlFor(
  profile: Pick<UserProfile, 'equippedCosmetic' | 'customPipUrl'> | null,
): string | null {
  if (!profile || !isAiCustom(profile.equippedCosmetic)) return null
  return profile.customPipUrl ?? null
}

/** Fields to write when buying the AI Pip (refills generations); null if unaffordable. */
export function computeBuyAiPip(
  profile: Pick<UserProfile, 'companionXp' | 'spentXp' | 'unlockedCosmetics'> | null,
): { spentXp: number; unlockedCosmetics: string[]; customPipGensLeft: number } | null {
  if (!canAfford(profile, AI_PIP_COST)) return null
  const already = isCosmeticOwned(profile, AI_PIP_COSMETIC_ID)
  return {
    spentXp: (profile?.spentXp ?? 0) + AI_PIP_COST,
    unlockedCosmetics: already
      ? profile?.unlockedCosmetics ?? []
      : [...(profile?.unlockedCosmetics ?? []), AI_PIP_COSMETIC_ID],
    customPipGensLeft: AI_PIP_GENERATIONS,
  }
}

/** Fields to write when applying a generated Pip (decrements + equips); null if out of generations. */
export function computeSetCustomPip(
  profile: Pick<UserProfile, 'customPipGensLeft'> | null,
  url: string,
  prompt: string,
): {
  customPipUrl: string
  customPipPrompt: string
  customPipGensLeft: number
  equippedCosmetic: string
} | null {
  const gens = profile?.customPipGensLeft ?? 0
  if (gens <= 0) return null
  return {
    customPipUrl: url,
    customPipPrompt: prompt,
    customPipGensLeft: gens - 1,
    equippedCosmetic: AI_PIP_COSMETIC_ID,
  }
}
