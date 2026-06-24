import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { useAuth } from '../features/auth/AuthProvider'
import { ArrangementBoard } from '../features/simulation/ArrangementBoard'

const previewItems = [
  { id: 'gold', label: 'Gold', color: '#fbbf24' },
  { id: 'silver', label: 'Silver', color: '#94a3b8' },
  { id: 'bronze', label: 'Bronze', color: '#d97706' },
]

export function LandingPage() {
  const { user } = useAuth()

  return (
    <div>
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-3 inline-block rounded-full bg-brand-100 px-4 py-1 text-sm font-semibold text-brand-700">
            Contest counting &amp; probability
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Learn by doing,{' '}
            <span className="bg-gradient-to-r from-brand-500 to-accent-500 bg-clip-text text-transparent">
              not watching
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Count Me In teaches contest math through interactive puzzles — drag, arrange, discover
            permutations, and build intuition before formulas.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to={user ? '/course' : '/login'}>
              <Button size="lg">Start learning →</Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="secondary">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-20">
        <h2 className="mb-2 text-center text-2xl font-bold text-slate-900">Try it right now</h2>
        <p className="mb-8 text-center text-slate-600">
          Three distinct trophies, one shelf — how many orderings can you find?
        </p>
        <Card>
          <ArrangementBoard items={previewItems} targetCount={6} goalCount={6} standalone />
        </Card>
        <p className="mt-6 text-center text-sm text-slate-500">
          No videos, no lectures — just puzzles that turn into intuition.
        </p>
      </section>
    </div>
  )
}
