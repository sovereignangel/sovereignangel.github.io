# Superpowers Development Methodology

Use when implementing any feature, bug fix, or refactoring in this codebase. This is the disciplined development workflow from obra/superpowers, adapted for the Thesis Engine.

## The 5 Phases

### Phase 1: Brainstorming
Before touching code, understand the requirement:
- What exactly needs to change? Which files are affected?
- What are the edge cases? (empty state, error state, loading state)
- Does this touch the reward function? If so, check `lib/reward.ts` and `REWARD_FUNCTION_ROADMAP.md`
- Does this need a new Firestore collection? Follow `lib/firestore/` patterns
- Does this affect the Telegram bot? Check `app/api/telegram/webhook/route.ts`

### Phase 2: Design Review
Present the design in digestible chunks:
- Component tree: what renders what, what props flow where
- Data flow: Firestore → hook → component → updateField → save → recompute reward
- For new collections: type in `lib/types/`, module in `lib/firestore/`, hook in `hooks/`
- For new views: follow the View + Dial pattern (read-only panel + input sidebar)

### Phase 3: Planning
Break work into bite-sized tasks (2-5 minutes each):
- Each task has: exact file path, what to change, how to verify
- Tasks ordered by dependency (types first, then firestore, then hooks, then components)
- Maximum 3 files per task

### Phase 4: TDD Execution
For each task, follow red-green-refactor:
1. **RED**: Write a failing test for the desired behavior
2. **GREEN**: Write the minimal code to make it pass
3. **REFACTOR**: Clean up while keeping tests green
4. **COMMIT**: Commit after each green cycle

### Phase 5: Code Review
Two-stage review before declaring done:
1. **Spec compliance**: Does the implementation match the design from Phase 2?
2. **Code quality**: Armstrong brand compliance, TypeScript strict, no `any` types

## Project-Specific Rules

### Armstrong Brand (ALWAYS enforce)
- Colors: burgundy `#7c2d2d`, ink `#2a2522`, paper `#faf8f4`, cream `#f5f1ea`
- Headers: `font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy`
- Corners: `rounded-sm` ONLY (never rounded-full or rounded-lg)
- Spacing: `gap-3` cards, `p-3` padding, `gap-1` tight groups
- NEVER use: text-blue-*, bg-neutral-*, rounded-full, text-sm, text-lg

### Data Flow (ALWAYS follow)
- Use `useDailyLog()` for daily log state — never fetch separately
- Use `updateField()` for updates — handles save + reward recomputation
- Date format: YYYY-MM-DD
- Firestore paths: `users/{uid}/collection/{id}`
- Types: import from `@/lib/types` (barrel), not individual files
- Firestore: import from `@/lib/firestore` (barrel), not individual files

### Testing
- Use Vitest + @testing-library/react
- Test files: colocate with source (`Foo.tsx` → `Foo.test.tsx`)
- Run: `npm test` before committing
- Build: `npm run build` must pass (TypeScript strict mode)
