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

## Step 5 - Debrief screen

No new prompt; renders the JSON from the Step 4 prompt (score bars, strength, fix, model response).

---

## User prompts log (chronological, verbatim)

1. > add a .gitignore for a Next.js project that ignores env files and node_modules
2. > git add -A && git commit -m "init" && git push -u origin main
3. > git branch -M main && git push -u origin main
4. > Build a mobile-first Next.js app, "Tradie Talk." (full brief in Step 0 above)
5. > Create a CLAUDE.md: one-page mobile-first app, no auth or DB, see @AGENTS.md, append every prompt I give you to PROMPTS.md, commit after each step. Also backfill PROMPTS.md with the prompts from this session so far.

## Step 6 - Polish

Added README with run notes; viewport and safe-area handling done in layout/page. No new prompts.
6. > what we also really care about is make the user experience futuristic and creative, we should do a voice agent (like elevenlabs - imma put the api key in soon) and create an animated person that is on the screen and is expressive. I want a strong branding and a memorable mascot. and polished animations

## Step 7 - Futuristic brand foundation

Brand: dark "hi-vis meets neon" look. Tokens: ink #070b14, hi-vis amber #ffc21a, cyan #29e3ff, magenta #ff3d8b, lime #7cff6b. Font Space Grotesk. Animated aurora + perspective grid backdrop, glass panels, shimmer wordmark. Mascot: **Hardy**, a hard-hat robot with a glowing visor face. Customers are expressive SVG people with mood-driven faces, audio-reactive mouths and a "Patience" meter.

## Step 8 - Mascot + home

Hardy the hard-hat robot (`components/Hardy.tsx`, pure SVG, blink loop, moods happy/wow/thinking/sad/cool), rotating coaching tips from Hardy, shimmer wordmark, glass scenario cards with accent glow, caller name and heat rating, staggered spring entrance (motion).

## Step 9 - Expressive animated customer + futuristic call screen

No new LLM prompt. `CustomerFace` is an SVG person (per-scenario look) driven by one rAF loop: mouth follows `getOutputVolume()`, brows/eyes/mouth lerp between moods (furious -> annoyed -> neutral -> relieved -> won over), blinking, gaze drift, head bob, tremble when furious, audio-reactive halo rings. A live "Customer patience" meter (keyword heuristic in `lib/patience.ts`) changes the customer's mood as the trainee acknowledges, owns and commits to a time. Live waveform, LIVE timer, glass transcript, type-instead keyboard. With no `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` the call runs in scripted **demo mode** so the UI can be explored offline.

## Step 10 - Animated debrief

No new prompt. Debrief now shows Hardy reacting to the total (cool / happy / thinking / sad), an animated score ring with count-up, staggered score bars, and Nailed it / Level up / Hardy's take cards. Loading state is Hardy "thinking" with a scanning bar.
7. > ok can you show me where the env file is so i can add in api stuff
8. > can you create the env local for me
9. > ok api keys in, can i do npm run dev now
10. > yes its in the background rn, stop it
11. > (pasted) Runtime Error: An unexpected Turbopack error occurred. Please see the output of `next dev` for more details.
12. > (pasted) Console Error: hydration mismatch caused by browser-extension attributes (`bis_skin_checked`)
13. > ok issue is it starts dialling but nothing ever loads after that

### Fix: stuck on "Dialling…"
Cause: the start effect's cleanup called `endSession()`; React StrictMode (dev) runs mount -> cleanup -> mount, which ended the call immediately while a ref guard prevented restarting. Removed the cleanup, added `onDisconnect` error messaging.
14. > ok no it looks like microphone is not working - when i messaged it work but apart from that it's not working

### Fix: microphone
Added an explicit `getUserMedia` pre-flight before `startSession` with specific messages (blocked / no device / in use). If the mic is unavailable the call starts in `textOnly` mode and the typing box opens.
15. > thing is it says that yes it is allowed the microphone - but still can't hear me. when i began the programme there was no "test mic works" at all

### Fix: mic check screen
New `MicCheck` step before every real call: live input-level meter (Web Audio analyser), "Hearing you" confirmation, input device picker (passed to ElevenLabs as `inputDeviceId`), and a "Skip, I'll type instead" text-only option. Replaces the earlier silent `getUserMedia` pre-flight.
16. > microphone working. but now elevenlabs voice not working: The call dropped. Check the agent ID, and that System prompt and First message overrides are enabled in the agent's Security tab.

### Fix: voice call dropping
Dev log only showed a generic LiveKit "error reading from signal stream" (default WebRTC transport). Forced `connectionType: "websocket"` and made the dropped-call message include ElevenLabs' actual disconnect reason/close code (also `console.warn`ed).
17. > The call dropped (the call was closed). Check the agent ID, and that System prompt and First message overrides are enabled in the agent's Security tab.

### Fix: call closed by our own side (`reason: 'user'`)
Root cause: `ConversationProvider` ends the session in its unmount cleanup; StrictMode's simulated unmount killed the session right after `startSession`. Now `startSession` runs on a `setTimeout(0)` that the effect cleanup cancels, so it starts after the simulated teardown.
