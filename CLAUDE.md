# Tradie Talk

One-page, mobile-first Next.js app for practising trade complaint calls. No auth, no DB.

See @AGENTS.md for Next.js version notes.

## Rules
- Keep it a single page (`app/page.tsx` state machine: home -> call -> debrief). The only extra route is `app/api/score`.
- Design mobile-first; no auth and no database.
- Append every prompt the user gives you to `PROMPTS.md`.
- Commit after each step.

## Env
`NEXT_PUBLIC_ELEVENLABS_AGENT_ID`, `ANTHROPIC_API_KEY` in `.env.local` (see `.env.example`).
