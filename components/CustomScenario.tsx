"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Hardy from "./Hardy";
import type { Scenario } from "@/lib/types";

const IDEAS = [
  "Roofer left tiles in my garden and it's still leaking",
  "Landlord furious: boiler broke again, no hot water for 3 days",
  "Builder finished the bathroom two weeks late and the grout is cracked",
];

// Minimal typing for the browser Web Speech API (Chrome / Edge / Safari).
type SpeechResultEvent = {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
};
type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function getRecognition(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, new () => Recognition>;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export default function CustomScenario({ onCreate }: { onCreate: (s: Scenario) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canDictate, setCanDictate] = useState(false);
  const rec = useRef<Recognition | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanDictate(getRecognition() !== null);
    return () => rec.current?.stop();
  }, []);

  const toggleDictation = () => {
    if (listening) {
      rec.current?.stop();
      return;
    }
    const SR = getRecognition();
    if (!SR) return;
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-AU";
    const base = text.trim() ? text.trim() + " " : "";
    let finalText = "";
    r.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interim += res[0].transcript;
      }
      setText((base + finalText + interim).slice(0, 800));
    };
    r.onerror = (e) => {
      if (e.error !== "no-speech" && e.error !== "aborted") {
        setError(
          e.error === "not-allowed"
            ? "Microphone is blocked for dictation. Allow it in the address bar, or just type."
            : `Dictation stopped (${e.error}). You can type instead.`,
        );
      }
    };
    r.onend = () => setListening(false);
    rec.current = r;
    setError(null);
    setListening(true);
    r.start();
  };

  const generate = async () => {
    rec.current?.stop();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't build that call.");
      onCreate(data as Scenario);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't build that call.");
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.75, type: "spring", stiffness: 160, damping: 18 }}
      className="rounded-3xl border border-dashed border-hivis/50 bg-hivis/5 p-4"
    >
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-4 text-left">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-hivis/15 text-4xl">✨</span>
        <span className="flex-1">
          <span className="block text-base font-bold text-hivis">Make your own call</span>
          <span className="mt-1 block text-sm leading-snug text-slate-300">
            Type or say any situation. Hardy builds the caller.
          </span>
        </span>
        <span className={`text-2xl text-hivis transition-transform ${open ? "rotate-90" : ""}`}>›</span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {busy ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <Hardy mood="thinking" size={90} />
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-cyan">Hardy is casting your caller…</p>
              </div>
            ) : (
              <div className="pt-4">
                <div className="relative">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value.slice(0, 800))}
                    rows={4}
                    placeholder="e.g. A customer whose air-con died in a heatwave right after we serviced it…"
                    className="glass w-full resize-none rounded-2xl p-3 pr-14 text-sm text-white outline-none placeholder:text-slate-500 focus:border-hivis"
                  />
                  {canDictate && (
                    <button
                      type="button"
                      onClick={toggleDictation}
                      aria-label={listening ? "Stop dictation" : "Dictate the scenario"}
                      className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full text-lg active:scale-90"
                      style={{
                        background: listening ? "#ff3d5a" : "rgba(255,255,255,0.1)",
                        boxShadow: listening ? "0 0 18px #ff3d5a" : undefined,
                        animation: listening ? "float 1s ease-in-out infinite" : undefined,
                      }}
                    >
                      {listening ? "■" : "🎙"}
                    </button>
                  )}
                </div>
                {listening && <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-magenta">Listening… tap ■ when done</p>}
                {!canDictate && (
                  <p className="mt-1 text-xs text-slate-500">Voice notes need Chrome, Edge or Safari. Typing works everywhere.</p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {IDEAS.map((idea) => (
                    <button
                      key={idea}
                      onClick={() => setText(idea)}
                      className="rounded-full border border-white/15 px-3 py-1 text-left text-xs text-slate-300 active:scale-95"
                    >
                      {idea}
                    </button>
                  ))}
                </div>

                {error && <p className="mt-3 rounded-xl bg-magenta/10 px-3 py-2 text-xs text-magenta">{error}</p>}

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  disabled={text.trim().length < 8}
                  onClick={generate}
                  className="mt-4 w-full rounded-full py-4 text-base font-bold text-ink disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg,#ffc21a,#ff9d00)", boxShadow: "0 0 24px rgba(255,194,26,0.4)" }}
                >
                  Build my call
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
