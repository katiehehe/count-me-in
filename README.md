# Count Me In

**Subject:** Contest counting and probability — permutations, combinations, and probability intuition for competitions.

Count Me In is a Brilliant-style learn-by-doing app. Learners discover math through interactive puzzles, visual manipulation, and instant feedback — not passive videos or multiple-choice drills.

## Deployed link

**Live:** [https://count-me-in-2cdc6.web.app](https://count-me-in-2cdc6.web.app) (Firebase Hosting)

## Quick start

```bash
npm install
cp .env.example .env   # add Firebase credentials
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Environment variables

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | App ID |
| `VITE_AI_ENABLED` | Always `false` for Phase 1 |

### Firebase setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Google** and **Anonymous** sign-in under Authentication
3. Create a Firestore database (production mode is fine; add rules below)
4. Register a web app and copy config into `.env`

**Firestore rules (development):**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Architecture

```
src/
├── app/              # Router + App shell
├── components/       # Shared UI (Button, Card, ProgressBar, …)
├── content/          # Course + lesson data (typed, data-driven)
├── features/
│   ├── auth/         # Firebase Auth provider + login
│   ├── course/       # Course path, lesson locking
│   ├── lesson/       # Lesson engine + step renderers
│   ├── progress/     # Firestore persistence, streaks, mastery
│   └── simulation/   # Arrangement board, factorial discovery, math
├── firebase/         # Client init + types
└── pages/            # Landing, profile
```

### Content model

Lessons are defined as typed data in `src/content/`. Each lesson has steps with a `type` field (`intro`, `arrangement`, `connection`, `tree`, `multiple-choice`, `numeric-question`, `factorial-discovery`, `completion`). The `StepRenderer` dispatches to the correct interactive component — add new lessons by adding data, not rewriting the player. Mastery is scored across the whole lesson: the fraction of graded questions (`multiple-choice` + `numeric-question`) answered correctly on the first attempt maps to a red / yellow / green tier.

### Lesson engine

- **LessonRenderer** — progress bar, step navigation, Firestore autosave
- **StepRenderer** — type-based dispatch to step components
- **ArrangementBoard** — drag/tap to swap distinct objects, tracks unique orderings
- **FactorialDiscovery** — tap-to-reveal counting principle, introduces n! naturally

## Phase 1 (shipped)

- Firebase Auth (Google + anonymous demo)
- Course path with sequential lesson locking
- Lesson 1: **Arranging Distinct Objects** (permutations + factorials)
- Draggable arrangement interaction
- Instant feedback with misconception-specific messages
- Progress persistence (step index, answers, attempts)
- Streaks and mastery tracking
- Mobile-responsive UI
- No AI features

## Phase 2 (not implemented)

- AI targeted hints grounded in lesson state
- Generated practice problems (AI proposes, app verifies)

Set `VITE_AI_ENABLED=false` to keep AI off.

## Phase 3 (not implemented)

- Spaced repetition for missed concepts
- Retrieval practice scheduling
- Mastery-gated next-lesson recommendations

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm test` | Run unit tests |
| `npm run preview` | Preview production build |

## Known limitations

- Lessons 2–4 are visible on the course path but locked (no steps yet)
- Deployment requires your own Firebase project and Vercel account
- Anonymous auth users should set a display name on first visit

## License

MIT
