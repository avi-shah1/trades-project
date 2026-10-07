"use client";

import { useEffect, useRef } from "react";

const BARS = 31;

/** Live level bars: accent while the customer talks, cyan while the trainee talks. */
export default function Waveform({
  getOut,
  getIn,
  speaking,
  accent,
}: {
  getOut: () => number;
  getIn: () => number;
  speaking: boolean;
  accent: string;
}) {
  const bars = useRef<(SVGRectElement | null)[]>([]);
  const latest = useRef({ getOut, getIn, speaking, accent });

  useEffect(() => {
    latest.current = { getOut, getIn, speaking, accent };
  });

  useEffect(() => {
    let raf = 0;
    let smooth = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      const t = (now - t0) / 1000;
      const { getOut, getIn, speaking, accent } = latest.current;
      const raw = Math.min(1, (speaking ? getOut() : getIn()) * 1.8);
      smooth += (raw - smooth) * (raw > smooth ? 0.5 : 0.15);
      const colour = speaking ? accent : "#29e3ff";
      bars.current.forEach((b, i) => {
        if (!b) return;
        const env = Math.sin((Math.PI * (i + 0.5)) / BARS);
        const wob = 0.35 + 0.65 * Math.abs(Math.sin(i * 0.55 + t * 7));
        const h = 3 + smooth * 34 * env * wob;
        b.setAttribute("height", String(h));
        b.setAttribute("y", String(20 - h / 2));
        b.setAttribute("fill", colour);
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <svg viewBox="0 0 186 40" className="h-10 w-full max-w-[16rem]" aria-hidden>
      {Array.from({ length: BARS }, (_, i) => (
        <rect
          key={i}
          ref={(el) => {
            bars.current[i] = el;
          }}
          x={i * 6}
          y="18.5"
          width="3.4"
          height="3"
          rx="1.7"
          fill="#29e3ff"
          opacity="0.9"
        />
      ))}
    </svg>
  );
}
