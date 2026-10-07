import type { Scenario } from "./types";
import { RULES } from "./rules";
import { VOICES } from "./voices";


export const scenarios: Scenario[] = [
  {
    id: "leaky-pipe",
    title: "The Leak That Came Back",
    blurb: "Your plumber 'fixed' a leak last week. It's dripping through the ceiling again.",
    emoji: "🚰",
    customerName: "Dave",
    gender: "male",
    voiceId: VOICES.male[0].id,
    accent: "#29e3ff",
    heat: 2,
    startPatience: 28,
    look: { skin: "#e8b48f", hair: "#4a3426", style: "short" },
    firstMessage:
      "Hi, it's Dave. Your lads fixed my leak last Tuesday and it's already dripping through my kitchen ceiling again. What's going on?",
    customerPrompt: `${RULES}\n\nYou are Dave, a homeowner. A plumber from this business repaired a leaking pipe under your upstairs bathroom last Tuesday and charged $380. The leak has returned and is now staining your kitchen ceiling. You are angry about wasted money and worried about damage.`,
  },
  {
    id: "no-show",
    title: "The No-Show Sparky",
    blurb: "Your electrician never turned up and nobody called. You took a day off for this.",
    emoji: "⚡",
    customerName: "Priya",
    gender: "female",
    voiceId: VOICES.female[0].id,
    accent: "#ff3d8b",
    heat: 3,
    startPatience: 15,
    look: { skin: "#b9784f", hair: "#1c1416", style: "long" },
    firstMessage:
      "Hello, it's Priya. I took the whole day off work for your electrician and he never showed up. Nobody even called me. Where is he?",
    customerPrompt: `${RULES}\n\nYou are Priya, a customer who booked an electrician for a 9am-12pm window to install new power points. You took unpaid leave, waited until 2pm and heard nothing. You are furious and want an explanation, an apology and a firm new time.`,
  },
  {
    id: "quote-blowout",
    title: "The Quote Blowout",
    blurb: "The final invoice is $1,200 more than the quote. The customer wants answers.",
    emoji: "💸",
    customerName: "Mark",
    gender: "male",
    voiceId: VOICES.male[1].id,
    accent: "#ffc21a",
    heat: 1,
    startPatience: 40,
    look: { skin: "#f0c7a3", hair: "#8a8f98", style: "cap", beard: true },
    firstMessage:
      "Yeah, hi, it's Mark. I just got your invoice for the deck repair and it's twelve hundred dollars over the quote. Explain that to me.",
    customerPrompt: `${RULES}\n\nYou are Mark, a customer who was quoted $2,800 for a deck repair and has been invoiced $4,000. Nobody told you about extra costs before the work was done. You feel ripped off and are considering disputing the invoice. You will only calm down if the trainee explains clearly, owns the communication failure, and offers a fair way forward.`,
  },
];
