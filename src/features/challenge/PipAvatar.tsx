import { useAuth } from '../auth/AuthProvider'
import { customPipUrlFor, pipLookFor } from '../progress/xpWallet'
import { PipCat, type PipMood } from './PipCat'

interface PipAvatarProps {
  mood?: PipMood
  className?: string
  /** Force a specific image (e.g. a shop preview); overrides the equipped look. */
  imageUrl?: string | null
}

/**
 * Renders the learner's current Pip: an AI-generated IMAGE when the `ai-custom`
 * cosmetic is equipped (or a preview `imageUrl` is passed), otherwise the SVG
 * {@link PipCat} with the equipped theme/hat. The static image ignores `mood`.
 * One wrapper so every Pip surface stays consistent.
 */
export function PipAvatar({ mood = 'happy', className = '', imageUrl }: PipAvatarProps) {
  const { profile } = useAuth()
  const src = imageUrl !== undefined ? imageUrl : customPipUrlFor(profile)

  if (src) {
    return <img src={src} alt="Your custom Pip" className={`rounded-full object-cover ${className}`} />
  }

  const look = pipLookFor(profile?.equippedCosmetic)
  return <PipCat mood={mood} theme={look.theme} hat={look.hat} className={className} />
}
