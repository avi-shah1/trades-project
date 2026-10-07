# PROMPTS

A log of prompts used to build Tradie Talk and prompts used by the app itself.

## Step 0 - Brief (user)

> Build a mobile-first Next.js app, "Tradie Talk." Home screen: 3 trade complaint scenarios as cards. Tapping one opens a call screen using @elevenlabs/react useConversation with agent ID from env. Show a customer avatar that animates while isSpeaking, a live transcript, and an end-call button. On end, POST the transcript to /api/score, which calls the Anthropic API and returns JSON: scores (1-5) for acknowledge, empathise, ownership, solution, timeline; one strength; one fix; and a model response to the customer's worst moment. Show a clean debrief screen with these. Keep it to one page, no auth or DB. Log prompts in PROMPTS.md and commit after each step.

## Step 1 - Scaffold

Scaffolded with `create-next-app` (TypeScript, Tailwind, App Router), added `@elevenlabs/react` and `@anthropic-ai/sdk`, `.env.example`, and this file.

## Step 2 - Home + scenarios

Three scenario cards (leaky pipe, no-show electrician, quote blowout). Each scenario carries a `customerPrompt` sent to the ElevenLabs agent as a prompt override. Shared rules prompt (in `lib/scenarios.ts`):

> You are playing a customer phoning a trade business to complain. The person you are speaking to is a trainee tradie handling the call. Stay in character at all times. Speak naturally and briefly (1-3 sentences per turn). Start frustrated. Soften only if the trainee genuinely acknowledges your frustration, takes ownership, and offers a concrete solution with a clear timeline; if they are defensive, vague or make excuses, get more irritated. Never coach the trainee or break character. If the issue is clearly resolved, wrap up the call politely.
