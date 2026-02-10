# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**study-eng-h** is a Korean-targeted English learning platform built with Next.js 16 (App Router), React 19, TypeScript, and PostgreSQL. The platform specializes in vocabulary acquisition through Korean→English quizzes with AI-powered level diagnosis, spaced repetition, pronunciation analysis, and gamification features.

**Core Features**:
- AI-powered CEFR level diagnosis (20-question adaptive test)
- Korean→English vocabulary quizzes with progressive hint system
- Spaced Repetition System (SRS) for vocabulary retention
- Pronunciation diagnosis with phoneme-level analysis
- Gamification: league system, daily streaks, badges
- Social authentication (Kakao OAuth via better-auth)

## Essential Commands

```bash
# Development
npm run dev              # Development server (http://localhost:3000)
npm run build            # Production build
npm run lint             # Linting

# Database
npx prisma generate      # Generate Prisma Client (custom output: lib/generated/prisma)
npx prisma migrate dev   # Run migrations
npx prisma studio        # Database GUI

# Type checking
npx tsc --noEmit        # Type check without emitting files

# Run TypeScript files
npx tsx <file.ts>       # Execute TypeScript directly
```

## Architecture

**FSD (Feature-Sliced Design)** - Strict unidirectional dependencies.
See `.claude/rules/architecture.md` and `docs/architecture/fsd-architecture-guidelines.md`.

**Layer Hierarchy** (top-down dependencies only):
```
app/ → pages/ → widgets/ → features/ → entities/ → shared/
```

**Path Alias**: `@/*` maps to project root

## Critical Patterns

### Database (CRITICAL)
```typescript
// ✅ ALWAYS use custom Prisma path
import prisma from "@/lib/db";
import { PrismaClient } from "@/lib/generated/prisma/client";

// ❌ NEVER use default location
import { PrismaClient } from "@prisma/client"; // Wrong!
```

### Barrel Exports (CRITICAL)
- `shared/lib/index.ts` is imported by client components
- NEVER add server-only exports (importing `@/lib/db` or Node.js modules) to this file
- Server-only utilities must be imported directly by path

### File Naming
- **Standard**: kebab-case for ALL files
- **Exceptions**: Next.js special files (`page.tsx`, `layout.tsx`, `route.ts`, `error.tsx`, `loading.tsx`)

## Before Any Work

### Documentation Tasks
When writing proposals, RFCs, or documentation:
1. Read `.claude/rules/documentation.md` for mandatory pre-flight checks
2. Follow frontmatter format from `docs/proposals/README.md`
3. Ensure all code examples follow `docs/conventions/code-style.md`

### Code Changes
1. Follow FSD architecture rules (`.claude/rules/architecture.md`)
2. Respect file naming conventions (`.claude/rules/code-style.md`)
3. Use correct Prisma imports (`.claude/rules/database.md`)

### Testing Workflow
Before committing:
- Type check: `npx tsc --noEmit`
- Lint: `npm run lint`
- Build: `npm run build` (for production readiness)

## Environment Variables

Required in `.env`:
```bash
DATABASE_URL=postgresql://...
NEXT_PUBLIC_KAKAO_CLIENT_ID=...
NEXT_PUBLIC_KAKAO_SECRET_KEY=...
```

## Documentation References

### Architecture & Conventions
- **FSD Architecture**: `docs/architecture/fsd-architecture-guidelines.md`
- **UI Structure**: `docs/architecture/ui-structure-guidelines.md`
- **Code Style**: `docs/conventions/code-style.md`
- **File Naming**: `docs/conventions/file-naming.md`

### Project Rules
All detailed rules are in `.claude/rules/`:
- `architecture.md` - FSD layers, dependencies, patterns
- `database.md` - Prisma setup, migrations, auth
- `code-style.md` - Naming, components, style rules
- `documentation.md` - Writing proposals and docs

### Feature Specs
- **Phase 1 Plan**: `docs/proposals/phase-1-implementation-plan.md`
- **All Proposals**: `docs/proposals/` directory

## Memory

Project-specific learnings and patterns are tracked in `.claude/memory/MEMORY.md`.
