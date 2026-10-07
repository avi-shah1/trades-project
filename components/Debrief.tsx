"use client";

import { useCallback, useEffect, useState } from "react";
import { animate, motion } from "motion/react";
import Hardy, { type HardyMood } from "./Hardy";
import type { Message, Scenario, ScoreResult, Scores } from "@/lib/types";

const LABELS: Record<keyof Scores, string> = {
  acknowledge: "Acknowledge",
  empathise: "Empathise",
  ownership: "Ownership",
  solution: "Solution",
  timeline: "Timeline",
};

const barColor = (n: number) => (n >= 4 ? "#7cff6b" : n === 3 ? "#ffc21a" : "#ff3d5a");

function verdict(total: number): { title: string; mood: HardyMood } {
  if (total >= 21) return { title: "Call legend", mood: "cool" };
  if (total >= 16) return { title: "Solid tradie", mood: "happy" };
  if (total >= 11) return { title: "Getting there", mood: "thinking" };
  return { title: "Rough call", mood: "sad" };
}

function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const c = animate(0, to, { duration: 1.2, ease: "easeOut", onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [to]);
  return <>{n}</>;
}

const rise = (i: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.5 + i * 0.12, type: "spring" as const, stiffness: 140, damping: 18 },
});

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
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <Hardy mood="sad" size={130} />
        <p className="glass rounded-2xl p-4 text-sm text-magenta">{error}</p>
        <button
          onClick={score}
          className="w-full rounded-full bg-hivis py-4 font-bold text-ink active:scale-95"
        >
          Try again
        </button>
        <button onClick={onRestart} className="font-mono text-xs uppercase tracking-widest text-slate-400">
          Back to calls
        </button>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5">
        <div className="relative">
          <div className="absolute inset-0 -z-10 scale-150 animate-pulse rounded-full bg-cyan/25 blur-3xl" />
          <Hardy mood="thinking" size={150} />
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-cyan">Hardy is reviewing your call…</p>
        <div className="h-1 w-48 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full w-1/3 rounded-full bg-cyan"
            animate={{ x: ["-100%", "300%"] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
    );
  }

  const keys = Object.keys(LABELS) as (keyof Scores)[];
  const total = keys.reduce((sum, k) => sum + result.scores[k], 0);
  const max = keys.length * 5;
  const { title, mood } = verdict(total);
  const R = 52;
  const C = 2 * Math.PI * R;

  return (
    <div className="flex flex-col gap-4 pb-4">
      <header className="flex flex-col items-center text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-slate-400">{scenario.title}</p>
        <div className="relative mt-3 flex h-40 w-40 items-center justify-center">
          <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
            <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
            <motion.circle
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke="#ffc21a"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: C * (1 - total / max) }}
              transition={{ duration: 1.3, ease: "easeOut" }}
              style={{ filter: "drop-shadow(0 0 8px rgba(255,194,26,0.8))" }}
            />
          </svg>
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 160, damping: 10, delay: 0.2 }}
          >
            <Hardy mood={mood} size={92} float={false} />
          </motion.div>
        </div>
        <h1 className="shimmer-text mt-3 text-4xl font-bold uppercase">{title}</h1>
        <p className="font-mono text-sm text-slate-300">
          <span className="text-hivis">
            <CountUp to={total} />
          </span>
          /{max} points
        </p>
      </header>

      <motion.section {...rise(0)} className="glass space-y-3 rounded-3xl p-4">
        {keys.map((k, i) => (
          <div key={k}>
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-white">{LABELS[k]}</span>
              <span className="font-mono text-slate-300">{result.scores[k]}/5</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(result.scores[k] / 5) * 100}%` }}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                style={{ background: barColor(result.scores[k]), boxShadow: `0 0 10px ${barColor(result.scores[k])}` }}
              />
            </div>
          </div>
        ))}
      </motion.section>

      <motion.section {...rise(1)} className="rounded-3xl border border-lime/40 bg-lime/10 p-4">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-lime">★ Nailed it</h2>
        <p className="mt-1 text-sm text-white">{result.strength}</p>
      </motion.section>

      <motion.section {...rise(2)} className="rounded-3xl border border-hivis/40 bg-hivis/10 p-4">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-hivis">⚡ Level up</h2>
        <p className="mt-1 text-sm text-white">{result.fix}</p>
      </motion.section>

      <motion.section
        {...rise(3)}
        className="relative overflow-hidden rounded-3xl border border-cyan/40 bg-cyan/10 p-4"
      >
        <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan">Hardy&apos;s take · what you could have said</h2>
        <p className="mt-2 text-base italic leading-relaxed text-white">&ldquo;{result.modelResponse}&rdquo;</p>
      </motion.section>

      <motion.button
        {...rise(4)}
        whileTap={{ scale: 0.96 }}
        onClick={onRestart}
        className="mb-[env(safe-area-inset-bottom)] rounded-full py-4 text-base font-bold text-ink"
        style={{ background: "linear-gradient(135deg,#ffc21a,#ff9d00)", boxShadow: "0 0 28px rgba(255,194,26,0.5)" }}
      >
        Take another call
      </motion.button>
    </div>
  );
}
