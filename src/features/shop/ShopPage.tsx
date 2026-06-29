import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { generatePipImage, isPipImageConfigured, PipImageError } from '../../firebase/pipImageClient'
import { useAuth } from '../auth/AuthProvider'
import { PipAvatar } from '../challenge/PipAvatar'
import { PipCat } from '../challenge/PipCat'
import {
  buyAiPip,
  buyStreakFreezeToken,
  equipCosmetic,
  purchaseCosmetic,
  setCustomPip,
} from '../progress/progressStore'
import { levelFromXp } from '../progress/xpLevels'
import {
  AI_PIP_COSMETIC_ID,
  AI_PIP_COST,
  COSMETICS,
  spendableBalance,
  STREAK_FREEZE_COST,
} from '../progress/xpWallet'

const AI_ERROR_MESSAGES: Record<string, string> = {
  rejected: "Let's try a different idea — keep it about a cute, friendly cat!",
  signin_required: 'Sign in with Google to design an AI Pip.',
  not_configured: 'AI Pip design isn’t available just yet — check back soon!',
  failed: 'Something went wrong making your Pip. Please try again.',
}

/**
 * Pip's Shop — the single XP sink. Spend the SPENDABLE balance
 * (lifetime XP − spent) on streak-freeze tokens and Pip cosmetics. Lifetime XP,
 * levels, and the leaderboard are never affected by spending.
 */
export function ShopPage() {
  const { user, profile, refreshProfile } = useAuth()
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<string>('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiBusy, setAiBusy] = useState(false)
  const [aiMsg, setAiMsg] = useState('')

  if (!user) return null

  const balance = spendableBalance(profile)
  const tokens = profile?.streakFreezeTokens ?? 0
  const equippedId = profile?.equippedCosmetic ?? 'default'
  const owned = new Set(['default', ...(profile?.unlockedCosmetics ?? [])])
  const { level, rank } = levelFromXp(profile?.companionXp ?? 0)

  const isAnon = user.isAnonymous
  const aiConfigured = isPipImageConfigured()
  const ownsAiPip = owned.has(AI_PIP_COSMETIC_ID)
  const gensLeft = profile?.customPipGensLeft ?? 0
  const customUrl = profile?.customPipUrl ?? null
  const aiEquipped = equippedId === AI_PIP_COSMETIC_ID

  async function handleBuyAiPip() {
    if (!user) return
    setBusy('ai')
    const ok = await buyAiPip(user.uid)
    await refreshProfile()
    setMsg(ok ? 'AI Pip unlocked — describe your dream cat below! ✨' : 'Not enough XP for the AI Pip yet.')
    setBusy(null)
  }

  async function handleGenerate() {
    if (!user || !aiPrompt.trim()) return
    setAiBusy(true)
    setAiMsg('')
    try {
      const { url } = await generatePipImage(aiPrompt.trim())
      const ok = await setCustomPip(user.uid, url, aiPrompt.trim())
      await refreshProfile()
      setAiMsg(ok ? '✨ Meet your new Pip!' : 'No generations left — buy again for more.')
    } catch (err) {
      const code = err instanceof PipImageError ? err.code : 'failed'
      setAiMsg(AI_ERROR_MESSAGES[code] ?? AI_ERROR_MESSAGES.failed)
    } finally {
      setAiBusy(false)
    }
  }

  async function handleEquipAiPip() {
    if (!user) return
    setBusy('ai-equip')
    await equipCosmetic(user.uid, AI_PIP_COSMETIC_ID)
    await refreshProfile()
    setBusy(null)
  }

  async function buyToken() {
    if (!user) return
    setBusy('token')
    const ok = await buyStreakFreezeToken(user.uid)
    await refreshProfile()
    setMsg(ok ? 'Got a streak freeze! 🧊' : 'Not enough XP for a streak freeze yet.')
    setBusy(null)
  }

  async function buy(id: string) {
    if (!user) return
    setBusy(id)
    const ok = await purchaseCosmetic(user.uid, id)
    await refreshProfile()
    setMsg(ok ? 'Unlocked! Tap Equip to wear it.' : 'Not enough XP for that one yet.')
    setBusy(null)
  }

  async function equip(id: string) {
    if (!user) return
    setBusy(id)
    await equipCosmetic(user.uid, id)
    await refreshProfile()
    setMsg('Looking good, Pip!')
    setBusy(null)
  }

  return (
    <div className="animate-fade-up mx-auto max-w-3xl px-4 py-8">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-slate-900">
            Pip&apos;s Shop
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Spend XP on streak insurance and a fresh look for Pip.
          </p>
        </div>
        <Link to="/course" className="shrink-0 text-sm font-medium text-brand-600 hover:text-brand-700">
          ← Course
        </Link>
      </div>

      <Card className="mb-5 flex flex-wrap items-center justify-between gap-4 border-lavender-200 bg-lavender-50/70">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-lavender-600">
            Spendable balance
          </div>
          <div className="mt-0.5 text-3xl font-bold text-lavender-700">⭐ {balance}</div>
        </div>
        <div className="text-right text-sm text-slate-600">
          <div>
            Level <span className="font-bold text-slate-800">{level}</span> · {rank}
          </div>
          <div className="text-xs text-slate-500">
            Lifetime {profile?.companionXp ?? 0} XP · spending never lowers it
          </div>
        </div>
      </Card>

      {msg && (
        <div className="mb-5 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-medium text-brand-700">
          {msg}
        </div>
      )}

      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-3xl leading-none">🧊</span>
            <div>
              <h2 className="font-semibold text-slate-900">Streak Freeze</h2>
              <p className="mt-0.5 max-w-md text-sm text-slate-600">
                Miss a day and one token is spent automatically to save your streak. You hold{' '}
                <span className="font-bold text-slate-800">{tokens}</span>.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={buyToken}
            disabled={busy !== null || balance < STREAK_FREEZE_COST}
          >
            {busy === 'token' ? 'Buying…' : `Buy · ⭐ ${STREAK_FREEZE_COST}`}
          </Button>
        </div>
      </Card>

      {/* Premium: design your own Pip with AI. */}
      <Card className="mb-6 border-2 border-lavender-300 bg-gradient-to-br from-lavender-50 to-blush-50">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-3xl leading-none">✨</span>
            <div>
              <h2 className="font-semibold text-slate-900">
                Design your own Pip with AI{' '}
                <span className="rounded-full bg-lavender-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-lavender-700">
                  Premium
                </span>
              </h2>
              <p className="mt-0.5 max-w-md text-sm text-slate-600">
                Describe a cat and we&apos;ll generate a one-of-a-kind Pip just for you. The top-tier
                reward — {AI_PIP_COST} XP for a few custom designs.
              </p>
            </div>
          </div>
          {ownsAiPip && (
            <div className="shrink-0 rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold text-lavender-700">
              {gensLeft} generation{gensLeft === 1 ? '' : 's'} left
            </div>
          )}
        </div>

        {isAnon ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Designing an AI Pip is for signed-in accounts.{' '}
            <Link to="/login" className="font-semibold underline underline-offset-2">
              Sign in
            </Link>{' '}
            to create yours (demo progress isn&apos;t saved).
          </p>
        ) : !ownsAiPip ? (
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-sm text-slate-500">
              {aiConfigured ? 'Unlock to start designing.' : 'Coming soon — not configured yet.'}
            </span>
            <Button
              onClick={handleBuyAiPip}
              disabled={busy !== null || balance < AI_PIP_COST || !aiConfigured}
            >
              {busy === 'ai' ? 'Unlocking…' : `Unlock · ⭐ ${AI_PIP_COST}`}
            </Button>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-4 sm:flex-row">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white shadow-soft">
                {customUrl ? (
                  <PipAvatar imageUrl={customUrl} className="h-24 w-24" />
                ) : (
                  <span className="text-sm text-slate-400">no Pip yet</span>
                )}
              </div>
              {customUrl &&
                (aiEquipped ? (
                  <span className="rounded-full bg-lime-100 px-2.5 py-0.5 text-xs font-semibold text-lime-700">
                    ✓ Equipped
                  </span>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleEquipAiPip}
                    disabled={busy !== null}
                  >
                    Use my AI Pip
                  </Button>
                ))}
            </div>
            <div className="flex-1">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                maxLength={300}
                rows={3}
                placeholder="e.g. an astronaut cat floating among the stars"
                disabled={aiBusy || gensLeft <= 0 || !aiConfigured}
                className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-lavender-400 focus:outline-none focus:ring-1 focus:ring-lavender-300 disabled:bg-slate-50"
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500" aria-live="polite">
                  {aiMsg ||
                    (gensLeft > 0
                      ? `Keep it cute and friendly — ${gensLeft} left.`
                      : 'Out of generations — buy again below for more.')}
                </span>
                {gensLeft > 0 ? (
                  <Button
                    onClick={handleGenerate}
                    disabled={aiBusy || !aiPrompt.trim() || !aiConfigured}
                  >
                    {aiBusy ? 'Creating…' : customUrl ? 'Try another' : 'Generate'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleBuyAiPip}
                    disabled={busy !== null || balance < AI_PIP_COST}
                  >
                    {busy === 'ai' ? 'Buying…' : `Refill · ⭐ ${AI_PIP_COST}`}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      <h2 className="mb-3 font-serif text-lg font-semibold text-slate-900">Pip Cosmetics</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {COSMETICS.map((c) => {
          const isOwned = owned.has(c.id)
          const isEquipped = equippedId === c.id
          const affordable = balance >= c.cost
          return (
            <Card key={c.id} className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blush-100">
                <PipCat mood="happy" theme={c.theme} hat={c.hat} className="h-16 w-16" />
              </div>
              <div className="mt-2 font-semibold text-slate-900">{c.label}</div>
              <div className="mb-3 mt-0.5 text-xs text-slate-500">{c.blurb}</div>
              <div className="mt-auto w-full">
                {isEquipped ? (
                  <span className="block rounded-lg bg-lime-100 px-3 py-1.5 text-sm font-semibold text-lime-700">
                    ✓ Equipped
                  </span>
                ) : isOwned ? (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => equip(c.id)}
                    disabled={busy !== null}
                  >
                    {busy === c.id ? '…' : 'Equip'}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => buy(c.id)}
                    disabled={busy !== null || !affordable}
                  >
                    {busy === c.id ? 'Buying…' : `⭐ ${c.cost}`}
                  </Button>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
