# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**study-eng-h** is a Korean-targeted English learning platform built with Next.js 16 (App Router), React 19, TypeScript, and PostgreSQL. The platform specializes in vocabulary acquisition through Korean→English quizzes with AI-powered level diagnosis, spaced repetition, pronunciation analysis, and gamification features.

**Core Features**:
- AI-powered CEFR level diagnosis (20-question adaptive test)
- Korean→English vocabulary quizzes with progressive hint system
- Spaced Repetition System (SRS) for vocabulary retention
- Pronunciation diagnosis with phoneme-level analysis
- Gamification: league system, daily streaks, badges
- Social authentication (Kakao OAuth via better-auth)

## Development Commands

### Essential Commands

```bash
# Development server (http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint
```

### Database Commands

```bash
# Generate Prisma Client (custom output: lib/generated/prisma)
npx prisma generate

# Run database migrations
npx prisma migrate dev

# View database in Prisma Studio
npx prisma studio

# Seed quiz data
npx tsx prisma/seed-quiz.ts

# Add context hints to existing quiz questions
npx tsx prisma/add-context-hints.ts
```

### TypeScript Commands

```bash
# Type checking without emitting
npx tsc --noEmit

# Run TypeScript files directly
npx tsx <file.ts>
```

## Architecture & Code Organization

### Feature-Sliced Design (FSD) Structure

This project follows **Feature-Sliced Design (FSD)** methodology with strict unidirectional dependency rules. See `docs/architecture/fsd-architecture-guidelines.md` for comprehensive details.

**Layer Hierarchy** (top-down dependencies only):
```
app/          → Application entry, providers, global layout
pages/        → Logical page compositions (distinct from Next.js routes)
widgets/      → Large UI compositions combining features/entities
features/     → Business user scenarios (auth, quiz, diagnosis)
entities/     → Domain models (user, question) - NO cross-entity imports
shared/       → Framework-agnostic utilities, UI kit, hooks
```

**Critical FSD Rules**:
1. **Unidirectional Flow**: Upper layers can only import from lower layers
2. **Slice Isolation**: Slices within the same layer cannot import each other
3. **Public API**: All slices must expose functionality via `index.ts` barrel exports
4. **Entity Independence**: Entities cannot import other entities

**Current Implementation Mapping**:
- `app/` → Next.js App Router (routes) + FSD app layer (providers)
- `features/diagnosis/`, `features/quiz/` → FSD feature slices
- `shared/ui/`, `shared/lib/`, `shared/utils/` → FSD shared layer
- `views/login/`, `views/main/` → FSD page-level compositions

### File Naming Convention

**Standard**: **kebab-case** for ALL files (see `docs/conventions/file-naming.md`)

```typescript
// ✅ Correct
// File: repository-list.tsx
export default function RepositoryList() {}

// File: use-repositories.ts
export function useRepositories() {}

// ❌ Incorrect
// File: RepositoryList.tsx (PascalCase)
// File: repositoryList.tsx (camelCase)
```

**Next.js Exceptions**: `page.tsx`, `layout.tsx`, `route.ts`, `error.tsx`, `loading.tsx`

**Hooks Pattern**: `use-[feature].ts`
**Components Pattern**: `[feature]-[type].tsx`

### Database Architecture

**Prisma Configuration**:
- **Custom Output Path**: `lib/generated/prisma` (not default `node_modules/.prisma/client`)
- **Adapter**: PostgreSQL via `@prisma/adapter-pg`
- **Connection**: Uses `PrismaPg` adapter with `DATABASE_URL` from environment

**Import Pattern**:
```typescript
// ✅ Always import from custom path
import prisma from "@/lib/db";
import { PrismaClient } from "@/lib/generated/prisma/client";

// ❌ Never import from default location
import { PrismaClient } from "@prisma/client"; // Wrong!
```

**Key Schema Models**:
- **User**: Core user with email/OAuth authentication
- **UserProfile**: Learning progress (CEFR level, XP, weakness areas JSON)
- **QuizQuestion**: Korean hint + English answer with context hints
- **QuizOption**: 4-choice options with isCorrect flag
- **UserQuizAttempt**: Tracks answer correctness, time spent, hint level
- **LevelDiagnosis**: AI diagnosis results with CEFR level mapping
- **WeaknessArea**: Category-based accuracy tracking

### Authentication System

**Stack**: better-auth v1.4.18 with Prisma adapter

**Configuration** (`lib/auth.ts`):
```typescript
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  socialProviders: {
    kakao: {
      clientId: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID,
      clientSecret: process.env.NEXT_PUBLIC_KAKAO_SECRET_KEY,
    }
  }
});
```

**API Routes**: `app/api/auth/[...all]/route.ts` handles all auth endpoints
**Required Models**: User, Account, Session, Verification (as defined in schema.prisma)

### Path Aliases

**Root Alias**: `@/*` maps to project root

```typescript
// All paths resolve from project root
import prisma from "@/lib/db";
import { QuizQuestion } from "@/features/quiz/types";
import { Button } from "@/shared/ui/button";
```

## Key Implementation Patterns

### Quiz Progressive Hint System

Located in `features/quiz/`, implements three-level hint disclosure:

1. **Level 0 (Hidden)**: Only Korean hint visible
2. **Level 1 (Context)**: + `contextHintKo` (situational description)
3. **Level 2 (Full)**: + Full sentence with blank

**Database Tracking**: `UserQuizAttempt.hintLevel` records which hints were used per attempt

### Level Diagnosis Algorithm

**Flow** (20 questions → CEFR level):
1. User answers 20 mixed-difficulty questions
2. Calculate total score (0-100)
3. Map to CEFR: A1 (0-20), A2 (21-40), B1 (41-60), B2 (61-80), C1 (81-95), C2 (96-100)
4. Identify weakness areas (categories with <60% accuracy)
5. Store in `LevelDiagnosis` + `WeaknessArea[]`

**Weakness Areas**: Stored as JSON array in `UserProfile.weaknessAreas` for quick access

### Global State Management

**Provider**: React Query v5 (`@tanstack/react-query`)

**Setup** (`shared/ui/query-provider.tsx`):
```typescript
export function QueryProvider({ children }) {
  const [queryClient] = useState(() => new QueryClient());
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

**Root Layout**: Wraps entire app in `app/layout.tsx`

### API Route Patterns

**Structure**: `app/api/[feature]/[action]/route.ts`

**Examples**:
- `app/api/auth/[...all]/route.ts` → better-auth handler
- `app/api/diagnosis/start/route.ts` → Start new diagnosis
- `app/api/diagnosis/submit/route.ts` → Submit diagnosis answers
- `app/api/quiz/[questionId]/route.ts` → Get specific quiz question

**Convention**: Export named HTTP method handlers (`GET`, `POST`, `PUT`, `DELETE`)

## Development Guidelines

### Adding New Features (FSD Compliance)

1. **Identify Layer**: Is this app config, page composition, widget, feature, entity, or shared?
2. **Create Slice**: `features/[feature-name]/` or `entities/[entity-name]/`
3. **Organize Segments**:
   ```
   features/my-feature/
   ├── ui/              # React components
   ├── model/           # State management, hooks
   ├── api/             # API client functions
   ├── lib/             # Feature-specific utilities
   ├── types/           # TypeScript types
   └── index.ts         # Public API exports
   ```
4. **Respect Dependencies**: Only import from same layer or below
5. **Use kebab-case**: All files except Next.js conventions

### Database Schema Changes

1. Modify `prisma/schema.prisma`
2. Generate migration: `npx prisma migrate dev --name descriptive_name`
3. Regenerate client: `npx prisma generate` (outputs to `lib/generated/prisma`)
4. Update TypeScript imports if types changed
5. Create seed script if new data needed: `prisma/seed-[feature].ts`

### Adding Quiz Questions

**Method 1**: Direct SQL via migration
**Method 2**: Seed script with tsx:
```typescript
// prisma/seed-quiz.ts
import prisma from "../lib/db";

await prisma.quizQuestion.create({
  data: {
    koreanHint: "사과",
    contextHintKo: "빨간 과일",
    englishWord: "apple",
    sentence: "I ate an _____ for breakfast.",
    difficulty: "A1",
    category: "daily",
    options: {
      create: [
        { text: "apple", isCorrect: true, order: 1 },
        { text: "orange", isCorrect: false, order: 2 },
        // ...
      ]
    }
  }
});
```

Run: `npx tsx prisma/seed-quiz.ts`

### Component Development

**Location**: Follow FSD - `features/[feature]/ui/` or `shared/ui/`
**Naming**: kebab-case files, PascalCase component names
**Exports**: Via slice `index.ts` for features, direct for shared

```typescript
// shared/ui/button.tsx
export function Button({ children, ...props }: ButtonProps) {
  return <button {...props}>{children}</button>;
}

// features/quiz/ui/quiz-card.tsx
export default function QuizCard({ question }: QuizCardProps) {
  // Implementation
}

// features/quiz/index.ts
export { default as QuizCard } from "./ui/quiz-card";
```

## Testing Workflow

**Type Safety**: Always run `npx tsc --noEmit` before committing
**Database Changes**: Test migrations in development first
**Linting**: Run `npm run lint` to catch issues
**Build Verification**: `npm run build` ensures production readiness

## Environment Variables

Required in `.env`:
```bash
DATABASE_URL=postgresql://...
NEXT_PUBLIC_KAKAO_CLIENT_ID=...
NEXT_PUBLIC_KAKAO_SECRET_KEY=...
```

## Important Notes

1. **Never import Prisma from default location** - use `@/lib/db` and `@/lib/generated/prisma/client`
2. **Respect FSD layers** - upper layers only import from lower layers
3. **Use kebab-case** - except Next.js special files
4. **Public API exports** - all feature/entity slices must expose via `index.ts`
5. **Database migrations** - always create migration before deploying schema changes
6. **Progressive hints** - track `hintLevel` in `UserQuizAttempt` for learning analytics

## Documentation References

- **FSD Architecture**: `docs/architecture/fsd-architecture-guidelines.md`
- **File Naming**: `docs/conventions/file-naming.md`
- **Phase 1 Plan**: `docs/proposals/phase-1-implementation-plan.md`
- **Quiz Hint System**: `docs/proposals/quiz-progressive-hint-system.md`
- **Feature Specs**: `docs/proposals/` directory
