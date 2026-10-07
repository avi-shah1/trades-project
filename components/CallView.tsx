"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useSpring, useTransform } from "motion/react";
import CustomerFace from "./CustomerFace";
import Waveform from "./Waveform";
import { MOOD_LABEL, moodFor } from "@/lib/patience";
import type { Message, Scenario } from "@/lib/types";

export type CallStatus = "connecting" | "live" | "error";

export type MicControl = {
  mode: "push" | "open";
  talking: boolean;
  onTalkingChange: (v: boolean) => void;
  onModeChange: (m: "push" | "open") => void;
};

export default function CallView({
  scenario,
  messages,
  status,
  error,
  notice,
  typing,
  onTypingChange,
  mic,
  isSpeaking,
  patience,
  getOutLevel,
  getInLevel,
  onSend,
  onEnd,
  onBack,
  demo,
}: {
  scenario: Scenario;
  messages: Message[];
  status: CallStatus;
  error: string | null;
  notice: string | null;
  typing: boolean;
  onTypingChange: (v: boolean) => void;
  mic?: MicControl;
  isSpeaking: boolean;
  patience: number;
  getOutLevel: () => number;
  getInLevel: () => number;
  onSend: (text: string) => void;
  onEnd: () => void;
  onBack: () => void;
  demo: boolean;
}) {
  const [seconds, setSeconds] = useState(0);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const mood = moodFor(patience);

  const spring = useSpring(patience, { stiffness: 90, damping: 18 });
  useEffect(() => {
    spring.set(patience);
  }, [patience, spring]);
  const width = useTransform(spring, (v) => `${v}%`);
  const shown = useTransform(spring, (v) => Math.round(v));

  useEffect(() => {
    if (status !== "live") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const statusText =
    status === "connecting"
      ? "Dialling…"
      : isSpeaking
        ? `${scenario.customerName} is talking`
        : mic?.mode === "push"
          ? mic.talking
            ? "Talking… release to send"
            : "Hold the button to talk"
          : "Your turn - speak up";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="flex min-h-[calc(100dvh-3rem)] flex-1 flex-col"
    >
      {/* top bar */}
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-widest">
        <button onClick={onBack} className="glass rounded-full px-3 py-1.5 text-slate-300 active:scale-95">
          ‹ Hang up
        </button>
        <span className="flex items-center gap-2 text-slate-300">
          <span
            className="h-2 w-2 rounded-full"
            style={{
              background: status === "live" ? "#ff3d3d" : "#ffc21a",
              boxShadow: `0 0 10px ${status === "live" ? "#ff3d3d" : "#ffc21a"}`,
              animation: "float 1.2s ease-in-out infinite",
            }}
          />
          {status === "live" ? `LIVE ${clock}` : status === "error" ? "FAILED" : "CONNECTING"}
        </span>
      </div>

      {/* stage */}
      <div className="relative mt-3 flex flex-col items-center">
        <motion.div
          className="absolute top-6 h-56 w-56 rounded-full blur-3xl"
          animate={{ opacity: isSpeaking ? 0.55 : 0.25, scale: isSpeaking ? 1.15 : 1 }}
          transition={{ duration: 0.5 }}
          style={{ background: scenario.accent }}
        />
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 14 }}
          className="relative h-60 w-60"
        >
          <CustomerFace
            look={scenario.look}
            accent={scenario.accent}
            mood={mood}
            getLevel={getOutLevel}
            speaking={isSpeaking}
          />
        </motion.div>
        <p className="mt-1 text-lg font-bold text-white">{scenario.customerName}</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={statusText}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="font-mono text-xs uppercase tracking-widest"
            style={{ color: isSpeaking ? scenario.accent : "#29e3ff" }}
          >
            {statusText}
          </motion.p>
        </AnimatePresence>
        <div className="mt-2">
          <Waveform getOut={getOutLevel} getIn={getInLevel} speaking={isSpeaking} accent={scenario.accent} />
        </div>
      </div>

      {/* patience meter */}
      <div className="glass mt-3 rounded-2xl px-4 py-3">
        <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-widest text-slate-400">
          <span>Customer patience</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={mood}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="text-white"
            >
              {MOOD_LABEL[mood]} · <motion.span>{shown}</motion.span>
            </motion.span>
          </AnimatePresence>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full"
            style={{
              width,
              background: "linear-gradient(90deg,#ff3d3d,#ffc21a 55%,#7cff6b)",
              boxShadow: "0 0 14px rgba(255,194,26,0.6)",
            }}
          />
        </div>
      </div>

      {demo && (
        <p className="mt-3 rounded-xl border border-hivis/40 bg-hivis/10 px-3 py-2 text-xs text-hivis">
          Demo mode: add <code>NEXT_PUBLIC_ELEVENLABS_AGENT_ID</code> to <code>.env.local</code> for live voice.
          Type your replies below.
        </p>
      )}
      {notice && (
        <p className="mt-3 rounded-xl border border-hivis/40 bg-hivis/10 px-3 py-2 text-xs text-hivis">{notice}</p>
      )}
      {error && (
        <p className="mt-3 rounded-xl border border-magenta/40 bg-magenta/10 px-3 py-2 text-xs text-magenta">{error}</p>
      )}

      {/* transcript */}
      <div className="glass mt-3 min-h-24 flex-1 space-y-2 overflow-y-auto rounded-2xl p-3" style={{ maxHeight: "22dvh" }}>
        {messages.length === 0 && (
          <p className="text-center text-xs text-slate-500">Live transcript appears here.</p>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${m.role === "trainee" ? "justify-end" : "justify-start"}`}
            >
              <p
                className="max-w-[85%] rounded-2xl px-3 py-2 text-sm"
                style={
                  m.role === "trainee"
                    ? { background: "rgba(41,227,255,0.16)", border: "1px solid rgba(41,227,255,0.4)" }
                    : { background: `${scenario.accent}1f`, border: `1px solid ${scenario.accent}55` }
                }
              >
                {m.text}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* controls */}
      <div className="pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        {typing && (
          <form onSubmit={submit} className="mb-3 flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type your reply…"
              className="glass min-w-0 flex-1 rounded-full px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan"
            />
            <button className="rounded-full bg-cyan px-5 text-sm font-bold text-ink active:scale-95">Send</button>
          </form>
        )}
        {mic && (
          <div className="mb-3 flex flex-col items-center gap-2">
            {mic.mode === "push" && <TalkButton talking={mic.talking} setTalking={mic.onTalkingChange} accent={scenario.accent} />}
            <button
              onClick={() => mic.onModeChange(mic.mode === "push" ? "open" : "push")}
              className="font-mono text-[11px] uppercase tracking-widest text-slate-400 underline-offset-4 hover:underline"
            >
              {mic.mode === "push" ? "Switch to open mic (headphones)" : "Switch to push-to-talk"}
            </button>
          </div>
        )}
        <div className="flex items-center gap-3">
          {!demo && (
            <button
              onClick={() => onTypingChange(!typing)}
              className="glass rounded-full px-5 py-4 text-sm font-semibold text-slate-200 active:scale-95"
              aria-pressed={typing}
            >
              ⌨
            </button>
          )}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onEnd}
            disabled={status === "connecting"}
            className="flex-1 rounded-full py-4 text-base font-bold text-white disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg,#ff3d3d,#ff3d8b)",
              boxShadow: "0 0 28px rgba(255,61,90,0.55)",
            }}
          >
            End call &amp; get my score
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/** Walkie-talkie button: hold to talk, or tap once to latch on and tap again to stop. Spacebar works too. */
function TalkButton({
  talking,
  setTalking,
  accent,
}: {
  talking: boolean;
  setTalking: (v: boolean) => void;
  accent: string;
}) {
  const downAt = useRef(0);
  const latched = useRef(false);

  const press = useCallback(() => {
    if (latched.current) {
      latched.current = false;
      setTalking(false);
      return;
    }
    downAt.current = Date.now();
    setTalking(true);
  }, [setTalking]);

  const release = useCallback(() => {
    if (latched.current) return;
    if (Date.now() - downAt.current < 250) latched.current = true; // quick tap = latch on
    else setTalking(false);
  }, [setTalking]);

  useEffect(() => {
    const typingTarget = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA");
    };
    const down = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat || typingTarget(e)) return;
      e.preventDefault();
      press();
    };
    const up = (e: KeyboardEvent) => {
      if (e.code !== "Space" || typingTarget(e)) return;
      e.preventDefault();
      release();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [press, release]);

  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        press();
      }}
      onPointerUp={release}
      onPointerCancel={() => {
        latched.current = false;
        setTalking(false);
      }}
      onContextMenu={(e) => e.preventDefault()}
      aria-pressed={talking}
      className="relative flex h-20 w-full touch-none select-none items-center justify-center rounded-full text-base font-bold uppercase tracking-widest transition-colors"
      style={{
        background: talking ? "linear-gradient(135deg,#29e3ff,#7cff6b)" : "rgba(255,255,255,0.08)",
        color: talking ? "#070b14" : "#e8ecf6",
        border: `2px solid ${talking ? "#29e3ff" : accent}`,
        boxShadow: talking ? "0 0 36px rgba(41,227,255,0.7)" : `0 0 18px ${accent}44`,
        transform: talking ? "scale(0.98)" : undefined,
      }}
    >
      {talking && <span className="absolute inset-0 animate-ping rounded-full border-2 border-cyan opacity-40" />}
      <span className="relative">{talking ? "🎙 Talking… (release to send)" : "🎙 Hold to talk (or Space)"}</span>
    </button>
  );
}
