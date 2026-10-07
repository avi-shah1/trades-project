import type { Message } from "./types";

export type MoodName = "furious" | "annoyed" | "neutral" | "relieved" | "happy";

// Each category counts once per trainee message. Keyword heuristics drive the
// on-screen "patience" meter and the customer's face; the real scoring is /api/score.
const RULES: { re: RegExp; delta: number }[] = [
  { re: /\b(sorry|apolog)/i, delta: 12 },
  { re: /\b(understand|frustrat|annoy|upset|must be|not (ok|okay|good enough)|hear you)/i, delta: 10 },
  { re: /\b(my fault|our fault|on us|on me|i('| a)?m going to|i will|i'll|we will|we'll|take responsibility|own (this|it))/i, delta: 10 },
  { re: /\b(tomorrow|today|tonight|this (morning|afternoon|evening)|within|by \d|\d+ ?(am|pm|hours?|minutes?|mins?))/i, delta: 9 },
  { re: /\b(fix|sort|refund|discount|credit|come back|reschedule|replace|redo|re-do|free of charge|no charge|on the house)/i, delta: 8 },
  { re: /\b(but|however|policy|not our|your fault|calm down|can'?t|cannot|unfortunately|nothing (i|we) can|not my)/i, delta: -10 },
];

export function computePatience(messages: Message[], start: number): number {
  let p = start;
  for (const m of messages) {
    if (m.role !== "trainee") continue;
    for (const r of RULES) if (r.re.test(m.text)) p += r.delta;
    p = Math.max(0, Math.min(100, p));
  }
  return p;
}

export function moodFor(patience: number): MoodName {
  if (patience < 25) return "furious";
  if (patience < 45) return "annoyed";
  if (patience < 65) return "neutral";
  if (patience < 85) return "relieved";
  return "happy";
}

export const MOOD_LABEL: Record<MoodName, string> = {
  furious: "Furious",
  annoyed: "Annoyed",
  neutral: "Listening",
  relieved: "Softening",
  happy: "Won over",
};
