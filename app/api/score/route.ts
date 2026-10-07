import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import type { Message, ScoreResult } from "@/lib/types";

const MODEL = "claude-sonnet-5-5";

const SYSTEM_PROMPT = `You are an expert customer-service coach for trade businesses (plumbers, electricians, builders). You will be given a transcript of a practice call in which a trainee tradie handles a customer complaint. The customer is an AI role-player; the trainee is the person being assessed.

Score ONLY the trainee's lines, from 1 (poor) to 5 (excellent), on:
- acknowledge: did they clearly acknowledge the problem and the customer's frustration?
- empathise: did they show genuine understanding and warmth, not scripted sympathy?
- ownership: did they take responsibility rather than deflect or blame?
- solution: did they offer a concrete, sensible fix or next step?
- timeline: did they give a specific time or deadline for the fix?

Then give:
- strength: ONE specific thing the trainee did well, referencing what they said.
- fix: ONE specific, actionable thing to improve.
- modelResponse: identify the trainee's worst moment in the call and write what an excellent tradie would say to the customer at that point. Speak directly to the customer, 2-4 sentences, natural spoken language.

If the trainee said little or nothing, score low and say so. Be honest, not flattering.

Respond with ONLY a JSON object, no markdown, in exactly this shape:
{"scores":{"acknowledge":1-5,"empathise":1-5,"ownership":1-5,"solution":1-5,"timeline":1-5},"strength":"...","fix":"...","modelResponse":"..."}`;

const SCORE_KEYS = ["acknowledge", "empathise", "ownership", "solution", "timeline"] as const;

function isMessageArray(v: unknown): v is Message[] {
  return (
    Array.isArray(v) &&
    v.every(
      (m) =>
        m &&
        (m.role === "customer" || m.role === "trainee") &&
        typeof m.text === "string",
    )
  );
}

function parseResult(raw: string): ScoreResult {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in model output");
  const data = JSON.parse(raw.slice(start, end + 1));

  const scores = {} as ScoreResult["scores"];
  for (const key of SCORE_KEYS) {
    const n = Math.round(Number(data?.scores?.[key]));
    if (!Number.isFinite(n)) throw new Error(`Bad score: ${key}`);
    scores[key] = Math.min(5, Math.max(1, n));
  }
  for (const key of ["strength", "fix", "modelResponse"] as const) {
    if (typeof data[key] !== "string" || !data[key].trim()) {
      throw new Error(`Bad field: ${key}`);
    }
  }
  return {
    scores,
    strength: data.strength,
    fix: data.fix,
    modelResponse: data.modelResponse,
  };
}

export async function POST(req: Request) {
  let body: { scenario?: { title?: unknown; blurb?: unknown }; transcript?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isMessageArray(body.transcript)) {
    return NextResponse.json({ error: "Invalid transcript" }, { status: 400 });
  }
  const transcript = body.transcript;
  if (!transcript.some((m) => m.role === "trainee" && m.text.trim())) {
    return NextResponse.json(
      { error: "The trainee didn't say anything, so there's nothing to score." },
      { status: 422 },
    );
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Server is missing ANTHROPIC_API_KEY" },
      { status: 500 },
    );
  }

  const title = typeof body.scenario?.title === "string" ? body.scenario.title.slice(0, 120) : "";
  const blurb = typeof body.scenario?.blurb === "string" ? body.scenario.blurb.slice(0, 400) : "";
  const text = transcript
    .map((m) => `${m.role === "trainee" ? "TRAINEE" : "CUSTOMER"}: ${m.text}`)
    .join("\n");
  const userContent = `Scenario: ${title ? `${title} - ${blurb}` : "Customer complaint"}\n\nTranscript:\n${text}`;

  try {
    const client = new Anthropic();
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    });
    const raw = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("");
    return NextResponse.json(parseResult(raw));
  } catch (err) {
    console.error("Scoring failed:", err);
    return NextResponse.json(
      { error: "Couldn't score this call. Please try again." },
      { status: 502 },
    );
  }
}
