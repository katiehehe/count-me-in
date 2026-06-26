import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Companion } from './Companion'

interface ChallengeTransitionProps {
  onStart: () => void
  onSkip: () => void
  busy?: boolean
}

/** The "Nice work. Now let's check if the idea really stuck." gateway screen. */
export function ChallengeTransition({ onStart, onSkip, busy }: ChallengeTransitionProps) {
  return (
    <div className="animate-fade-up mx-auto max-w-2xl px-4 py-10">
      <Card className="text-center">
        <div className="mx-auto mb-4 max-w-md text-left">
          <Companion message="Nice work finishing the lesson! Let's make sure the idea really stuck. 🐾" />
        </div>
        <h1 className="text-h2">Now let&apos;s check if the idea really stuck</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          A few quick reflection questions with your companion. This isn&apos;t a test — there&apos;s
          no pass or fail, and your lesson is already saved. Answer thoughtfully to earn fish.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <Button onClick={onStart} disabled={busy} size="lg">
            {busy ? 'Preparing…' : 'Start challenge →'}
          </Button>
          <Button variant="ghost" onClick={onSkip} disabled={busy}>
            Skip for now
          </Button>
        </div>
      </Card>
    </div>
  )
}
