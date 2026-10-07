# PROMPTS

A log of prompts used to build Tradie Talk and prompts used by the app itself.

## Step 0 - Brief (user)

> Build a mobile-first Next.js app, "Tradie Talk." Home screen: 3 trade complaint scenarios as cards. Tapping one opens a call screen using @elevenlabs/react useConversation with agent ID from env. Show a customer avatar that animates while isSpeaking, a live transcript, and an end-call button. On end, POST the transcript to /api/score, which calls the Anthropic API and returns JSON: scores (1-5) for acknowledge, empathise, ownership, solution, timeline; one strength; one fix; and a model response to the customer's worst moment. Show a clean debrief screen with these. Keep it to one page, no auth or DB. Log prompts in PROMPTS.md and commit after each step.

## Step 1 - Scaffold

Scaffolded with `create-next-app` (TypeScript, Tailwind, App Router), added `@elevenlabs/react` and `@anthropic-ai/sdk`, `.env.example`, and this file.

## Step 2 - Home + scenarios

Three scenario cards (leaky pipe, no-show electrician, quote blowout). Each scenario carries a `customerPrompt` sent to the ElevenLabs agent as a prompt override. Shared rules prompt (in `lib/scenarios.ts`):

> You are playing a customer phoning a trade business to complain. The person you are speaking to is a trainee tradie handling the call. Stay in character at all times. Speak naturally and briefly (1-3 sentences per turn). Start frustrated. Soften only if the trainee genuinely acknowledges your frustration, takes ownership, and offers a concrete solution with a clear timeline; if they are defensive, vague or make excuses, get more irritated. Never coach the trainee or break character. If the issue is clearly resolved, wrap up the call politely.

## Step 3 - Call screen

No new LLM prompt; the scenario `customerPrompt` and `firstMessage` are sent to ElevenLabs as `overrides.agent` on `startSession`. Requires "System prompt" and "First message" overrides enabled in the agent's Security tab.

## Step 4 - Score API (`app/api/score/route.ts`, model `claude-sonnet-5-5`)

System prompt:

> You are an expert customer-service coach for trade businesses (plumbers, electricians, builders). You will be given a transcript of a practice call in which a trainee tradie handles a customer complaint. The customer is an AI role-player; the trainee is the person being assessed.
>
> Score ONLY the trainee's lines, from 1 (poor) to 5 (excellent), on:
> - acknowledge: did they clearly acknowledge the problem and the customer's frustration?
> - empathise: did they show genuine understanding and warmth, not scripted sympathy?
> - ownership: did they take responsibility rather than deflect or blame?
> - solution: did they offer a concrete, sensible fix or next step?
> - timeline: did they give a specific time or deadline for the fix?
>
> Then give:
> - strength: ONE specific thing the trainee did well, referencing what they said.
> - fix: ONE specific, actionable thing to improve.
> - modelResponse: identify the trainee's worst moment in the call and write what an excellent tradie would say to the customer at that point. Speak directly to the customer, 2-4 sentences, natural spoken language.
>
> If the trainee said little or nothing, score low and say so. Be honest, not flattering.
>
> Respond with ONLY a JSON object, no markdown, in exactly this shape:
> {"scores":{"acknowledge":1-5,"empathise":1-5,"ownership":1-5,"solution":1-5,"timeline":1-5},"strength":"...","fix":"...","modelResponse":"..."}

User message: `Scenario: <title - blurb>` followed by the `TRAINEE:` / `CUSTOMER:` transcript.
