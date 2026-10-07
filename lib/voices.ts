// ElevenLabs premade voices (available on every account).
export const VOICES = {
  male: [
    { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh" },
    { id: "pNInz6obpgDQGcFmaJgB", name: "Adam" },
    { id: "ErXwobaYiN019PkySvjV", name: "Antoni" },
  ],
  female: [
    { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel" },
    { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah" },
    { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi" },
  ],
} as const;

export type Gender = keyof typeof VOICES;

/** Stable voice for a caller: same name always gets the same voice. */
export function pickVoice(gender: Gender, seed: string): string {
  const list = VOICES[gender];
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return list[h % list.length].id;
}
