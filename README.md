# Tradie Talk

Practise handling trade complaint calls. Pick a scenario, talk to an AI customer (ElevenLabs), then get a scored debrief (Anthropic).

## Setup
1. `cp .env.example .env.local` and fill in:
   - `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` - an ElevenLabs agent with **System prompt** and **First message** overrides enabled (Agent > Security).
   - `ANTHROPIC_API_KEY`
2. `npm install`
3. `npm run dev` and open http://localhost:3000 (use a phone-sized viewport; microphone access is required).
