"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import Hardy from "./Hardy";

export type MicChoice = { deviceId?: string; textOnly: boolean };

type Phase = "asking" | "ready" | "failed";

function explain(e: unknown): string {
  const name = e instanceof DOMException ? e.name : "";
  if (name === "NotAllowedError")
    return "Microphone is blocked. Click the lock icon in the address bar, set Microphone to Allow, then reload.";
  if (name === "NotFoundError") return "No microphone found. Plug one in or pick another device.";
  if (name === "NotReadableError")
    return "That microphone is in use by another app (Teams, Zoom, Discord…). Close it or pick another device.";
  return "Couldn't open the microphone.";
}

/** Pre-call mic test: live level meter + input device picker. */
export default function MicCheck({
  customerName,
  onContinue,
}: {
  customerName: string;
  onContinue: (choice: MicChoice) => void;
}) {
  const [phase, setPhase] = useState<Phase>("asking");
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string>("");
  const [label, setLabel] = useState("");
  const [heard, setHeard] = useState(false);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhase("asking");
    setError(null);
    setHeard(false);

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: deviceId ? { deviceId: { exact: deviceId } } : true,
        });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());

        const all = await navigator.mediaDevices.enumerateDevices();
        setDevices(all.filter((d) => d.kind === "audioinput"));
        const track = stream.getAudioTracks()[0];
        setLabel(track?.label ?? "");
        if (!deviceId) setDeviceId(track?.getSettings().deviceId ?? "");

        ctx = new AudioContext();
        if (ctx.state === "suspended") await ctx.resume();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        ctx.createMediaStreamSource(stream).connect(analyser);
        const buf = new Float32Array(analyser.fftSize);
        let loud = 0;
        let smooth = 0;
        setPhase("ready");

        const loop = () => {
          analyser.getFloatTimeDomainData(buf);
          let sum = 0;
          for (const v of buf) sum += v * v;
          const level = Math.min(1, Math.sqrt(sum / buf.length) * 9);
          smooth += (level - smooth) * (level > smooth ? 0.6 : 0.15);
          if (bar.current) bar.current.style.transform = `scaleX(${Math.max(0.02, smooth)})`;
          loud = level > 0.12 ? loud + 1 : Math.max(0, loud - 0.5);
          if (loud > 4) setHeard(true);
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      } catch (e) {
        if (cancelled) return;
        setError(explain(e));
        setPhase("failed");
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      ctx?.close();
    };
  }, [deviceId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-1 flex-col items-center justify-center gap-5 text-center"
    >
      <Hardy mood={heard ? "happy" : phase === "failed" ? "sad" : "wow"} size={120} />
      <div>
        <h2 className="text-2xl font-bold text-white">Mic check</h2>
        <p className="mt-1 text-sm text-slate-300">
          {phase === "failed"
            ? "Hardy can't hear you yet."
            : heard
              ? "Loud and clear. Ready to talk to " + customerName + "?"
              : "Say something, like “hello, Tradie Talk”. The bar should jump."}
        </p>
      </div>

      {error && <p className="glass w-full rounded-2xl p-3 text-sm text-magenta">{error}</p>}

      <div className="glass w-full rounded-2xl p-4 text-left">
        <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-widest text-slate-400">
          <span>Input level</span>
          <span className={heard ? "text-lime" : ""}>{heard ? "✓ Hearing you" : "Waiting for sound…"}</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
          <div
            ref={bar}
            className="h-full origin-left rounded-full"
            style={{
              transform: "scaleX(0.02)",
              background: "linear-gradient(90deg,#29e3ff,#7cff6b)",
              boxShadow: "0 0 12px rgba(41,227,255,0.7)",
            }}
          />
        </div>

        {devices.length > 0 && (
          <label className="mt-4 block font-mono text-[11px] uppercase tracking-widest text-slate-400">
            Microphone
            <select
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-ink px-3 py-2 text-sm normal-case tracking-normal text-white"
            >
              {devices.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId}>
                  {d.label || `Microphone ${i + 1}`}
                </option>
              ))}
            </select>
          </label>
        )}
        {label && <p className="mt-2 truncate text-xs text-slate-500">Using: {label}</p>}
      </div>

      <div className="flex w-full flex-col gap-2">
        <motion.button
          whileTap={{ scale: 0.96 }}
          disabled={phase !== "ready"}
          onClick={() => onContinue({ deviceId: deviceId || undefined, textOnly: false })}
          className="rounded-full py-4 text-base font-bold text-ink disabled:opacity-40"
          style={{
            background: heard ? "linear-gradient(135deg,#7cff6b,#29e3ff)" : "linear-gradient(135deg,#ffc21a,#ff9d00)",
            boxShadow: "0 0 28px rgba(124,255,107,0.35)",
          }}
        >
          {heard ? "Start the call" : "Start anyway"}
        </motion.button>
        <button
          onClick={() => onContinue({ textOnly: true })}
          className="py-2 font-mono text-xs uppercase tracking-widest text-slate-400 underline-offset-4 hover:underline"
        >
          Skip, I&apos;ll type instead
        </button>
      </div>
    </motion.div>
  );
}
