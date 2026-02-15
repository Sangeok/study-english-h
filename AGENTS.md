# Repository Guidelines

## Project Structure & Module Organization
This repository is a Next.js 16 + TypeScript app using App Router and an FSD-style structure.

- `app/`: routes, layouts, and API handlers (`app/api/**/route.ts`)
- `views/`, `widgets/`, `features/`, `entities/`, `shared/`: feature-sliced UI and domain layers
- `lib/`: app-level services (`auth.ts`, `db.ts`) and generated Prisma client under `lib/generated/prisma/`
- `prisma/`: schema, migrations, data files, and seed/migration scripts
- `public/`: static assets
- `docs/`: architecture, conventions, specs, and decision records

Prefer imports through each slice's `index.ts` public API when available.

## Build, Test, and Development Commands
- `npm run dev`: start local development server at `http://localhost:3000`
- `npm run build`: create production build (also catches many type/runtime issues)
- `npm run start`: run the built app
- `npm run lint`: run ESLint (`eslint-config-next` + TypeScript rules)
- `npx tsc --noEmit`: explicit type-check pass
- `npx prisma migrate dev`: apply local DB migrations

## Coding Style & Naming Conventions
- Language: TypeScript (`strict: true`) with React 19.
- Follow existing style: 2-space indentation, double quotes, semicolons.
- File names use `kebab-case` (for example, `quiz-navigation.tsx`, `use-daily-quiz.ts`).
- React components use `PascalCase`; hooks start with `use*`.
- Keep Next.js reserved filenames unchanged (`page.tsx`, `layout.tsx`, `route.ts`).
- Use alias imports via `@/*` from `tsconfig.json`.

## Testing Guidelines
No dedicated automated test runner is currently configured in `package.json`.

Before opening a PR, run:
1. `npm run lint`
2. `npm run build`
3. Manual checks for impacted flows (especially `/diagnosis`, `/quiz`, `/flashcard`, and auth routes)

If you add automated tests, use `*.test.ts`/`*.test.tsx` naming and colocate with the feature or in `__tests__/`.

## Commit & Pull Request Guidelines
Current history follows a simple type prefix format such as:
- `feat : kakao login`
- `refactor : diagnosis`

Use small, scoped commits by feature/slice. PRs should include:
- clear summary of behavior changes
- affected routes/APIs and DB migration notes
- screenshots or short recordings for UI changes
- linked issue/task and verification steps performed

## Security & Configuration Tips
- Keep secrets in `.env`; do not commit credentials.
- Required environment variables include at least `DATABASE_URL`, `NEXT_PUBLIC_KAKAO_CLIENT_ID`, and `NEXT_PUBLIC_KAKAO_SECRET_KEY`.
