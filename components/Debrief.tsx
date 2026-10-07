"use client";

import { useCallback, useEffect, useState } from "react";
import type { Message, Scenario, ScoreResult, Scores } from "@/lib/types";

const LABELS: Record<keyof Scores, string> = {
  acknowledge: "Acknowledge",
  empathise: "Empathise",
  ownership: "Ownership",
  solution: "Solution",
  timeline: "Timeline",
};

function barColor(n: number) {
  if (n >= 4) return "bg-emerald-500";
  if (n === 3) return "bg-amber-400";
  return "bg-red-500";
}

export default function Debrief({
  scenario,
  transcript,
  onRestart,
}: {
  scenario: Scenario;
  transcript: Message[];
  onRestart: () => void;
}) {
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const score = useCallback(async () => {
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: scenario.id, transcript }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scoring failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scoring failed");
    }
  }, [scenario.id, transcript]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    score();
  }, [score]);

  if (error) {
    return (
      <div className="flex flex-1 flex-col justify-center gap-4 text-center">
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
        <button
          onClick={score}
          className="rounded-full bg-slate-900 py-4 font-semibold text-white active:scale-[0.98]"
        >
          Try again
        </button>
        <button onClick={onRestart} className="text-sm text-slate-500 underline">
          Back to scenarios
        </button>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-slate-500">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
        <p>Reviewing your call…</p>
      </div>
    );
  }

  const keys = Object.keys(LABELS) as (keyof Scores)[];
  const total = keys.reduce((sum, k) => sum + result.scores[k], 0);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-sm text-slate-500">{scenario.title}</p>
        <h1 className="text-2xl font-bold text-slate-900">
          Debrief{" "}
          <span className="text-amber-600">
            {total}/{keys.length * 5}
          </span>
        </h1>
      </header>

      <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        {keys.map((k) => (
          <div key={k}>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-slate-800">{LABELS[k]}</span>
              <span className="text-slate-500">{result.scores[k]}/5</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-slate-100">
              <div
                className={`h-2 rounded-full ${barColor(result.scores[k])}`}
                style={{ width: `${(result.scores[k] / 5) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl bg-emerald-50 p-4">
        <h2 className="text-sm font-semibold text-emerald-800">Strength</h2>
        <p className="mt-1 text-sm text-emerald-900">{result.strength}</p>
      </section>

      <section className="rounded-2xl bg-amber-50 p-4">
        <h2 className="text-sm font-semibold text-amber-800">One thing to fix</h2>
        <p className="mt-1 text-sm text-amber-900">{result.fix}</p>
      </section>

      <section className="rounded-2xl bg-slate-900 p-4 text-white">
        <h2 className="text-sm font-semibold text-amber-300">
          What you could have said
        </h2>
        <p className="mt-1 text-sm italic">&ldquo;{result.modelResponse}&rdquo;</p>
      </section>

      <button
        onClick={onRestart}
        className="mb-[env(safe-area-inset-bottom)] rounded-full bg-amber-500 py-4 font-semibold text-white active:scale-[0.98]"
      >
        Try another call
      </button>
    </div>
  );
}
