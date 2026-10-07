"use client";

import { useEffect, useRef } from "react";
import type { Look } from "@/lib/types";
import type { MoodName } from "@/lib/patience";

type Params = { brow: number; browY: number; k: number; eye: number; tint: number; blush: number };

const MOODS: Record<MoodName, Params> = {
  furious: { brow: 20, browY: 3, k: -9, eye: 0.72, tint: 0.3, blush: 0 },
  annoyed: { brow: 11, browY: 1, k: -5, eye: 0.85, tint: 0.12, blush: 0 },
  neutral: { brow: 0, browY: -1, k: -1, eye: 1, tint: 0, blush: 0 },
  relieved: { brow: -4, browY: -3, k: 5, eye: 1, tint: 0, blush: 0.15 },
  happy: { brow: -6, browY: -5, k: 9, eye: 0.9, tint: 0, blush: 0.32 },
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Expressive SVG customer. Everything that changes per-frame (mouth, brows,
 * blink, gaze, head bob, halo rings) is written straight to the DOM from one
 * requestAnimationFrame loop so React never re-renders while speaking.
 */
export default function CustomerFace({
  look,
  accent,
  mood,
  getLevel,
  speaking,
}: {
  look: Look;
  accent: string;
  mood: MoodName;
  getLevel: () => number;
  speaking: boolean;
}) {
  const root = useRef<SVGSVGElement>(null);
  const moodRef = useRef(mood);
  const levelRef = useRef(getLevel);
  const speakingRef = useRef(speaking);

  useEffect(() => {
    moodRef.current = mood;
    levelRef.current = getLevel;
    speakingRef.current = speaking;
  });

  useEffect(() => {
    const els: Record<string, Element> = {};
    root.current?.querySelectorAll("[data-k]").forEach((el) => {
      els[el.getAttribute("data-k")!] = el;
    });
    const cur = { ...MOODS.neutral, level: 0 };
    const t0 = performance.now();
    let nextBlink = t0 + 1500 + Math.random() * 2500;
    let blinkStart = -1;
    let raf = 0;

    const attr = (k: string, name: string, v: string | number) => els[k]?.setAttribute(name, String(v));

    const loop = (now: number) => {
      const t = (now - t0) / 1000;
      const target = MOODS[moodRef.current];
      const a = 0.07;
      cur.brow = lerp(cur.brow, target.brow, a);
      cur.browY = lerp(cur.browY, target.browY, a);
      cur.k = lerp(cur.k, target.k, a);
      cur.eye = lerp(cur.eye, target.eye, a);
      cur.tint = lerp(cur.tint, target.tint, a);
      cur.blush = lerp(cur.blush, target.blush, a);

      const raw = speakingRef.current ? Math.min(1, levelRef.current() * 1.7) : 0;
      cur.level = lerp(cur.level, raw, raw > cur.level ? 0.5 : 0.2);
      const lv = cur.level;

      // blink
      if (blinkStart < 0 && now > nextBlink) blinkStart = now;
      let blink = 0;
      if (blinkStart >= 0) {
        const p = (now - blinkStart) / 150;
        if (p >= 1) {
          blinkStart = -1;
          nextBlink = now + 1800 + Math.random() * 3500;
        } else blink = Math.sin(Math.PI * p);
      }
      const eyeS = Math.max(0.05, cur.eye * (1 - 0.95 * blink));
      attr("eyeL", "transform", `translate(76 108) scale(1 ${eyeS}) translate(-76 -108)`);
      attr("eyeR", "transform", `translate(124 108) scale(1 ${eyeS}) translate(-124 -108)`);

      // gaze
      const sp = speakingRef.current ? 1.8 : 1;
      const lx = (Math.sin(t * 0.7) * 2 + Math.sin(t * 1.9) * 1.2) * sp;
      const ly = Math.sin(t * 0.9) * 1;
      attr("pupilL", "transform", `translate(${lx} ${ly})`);
      attr("pupilR", "transform", `translate(${lx} ${ly})`);

      // brows
      attr("browL", "transform", `translate(76 ${88 + cur.browY}) rotate(${cur.brow})`);
      attr("browR", "transform", `translate(124 ${88 + cur.browY}) rotate(${-cur.brow})`);

      // mouth: lips drawn as two quadratics; k = corner lift, open = jaw drop
      const open = lv * (moodRef.current === "furious" ? 17 : 14);
      const w = 19 + lv * 4;
      const k = cur.k;
      attr(
        "mouth",
        "d",
        `M${100 - w} ${152 - k} Q100 ${152 + k} ${100 + w} ${152 - k} Q100 ${152 + 2 * open + k} ${100 - w} ${152 - k} Z`,
      );

      // tint + blush
      attr("tint", "opacity", cur.tint);
      attr("blushL", "opacity", cur.blush);
      attr("blushR", "opacity", cur.blush);

      // head motion (+ tremble when furious)
      const trem = moodRef.current === "furious" ? Math.sin(t * 40) * 0.7 : 0;
      const rot = Math.sin(t * 1.3) * 1.1 + lv * Math.sin(t * 9) * 2.2;
      const dy = -lv * 2.5 + Math.sin(t * 1.9) * 0.8;
      attr("head", "transform", `translate(${trem} ${dy}) rotate(${rot} 100 175)`);

      // audio halo
      for (let i = 0; i < 3; i++) {
        const s = 1 + lv * (0.05 + i * 0.045);
        attr(`ring${i}`, "transform", `translate(100 120) scale(${s}) translate(-100 -120)`);
        attr(`ring${i}`, "opacity", 0.12 + lv * (0.7 - i * 0.18));
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const hair = look.hair;
  const skinShade = "rgba(0,0,0,0.18)";

  return (
    <svg ref={root} viewBox="-30 -10 260 270" className="h-full w-full overflow-visible" role="img" aria-label="Customer on the call">
      {[92, 102, 112].map((r, i) => (
        <circle key={r} data-k={`ring${i}`} cx="100" cy="120" r={r} fill="none" stroke={accent} strokeWidth="1.5" opacity="0.15" />
      ))}

      {/* back hair for long style */}
      {look.style === "long" && (
        <path d="M42 112 C34 48 70 30 100 30 C132 30 168 48 158 112 L164 215 L36 215 Z" fill={hair} />
      )}

      {/* torso */}
      <path d="M14 270 C14 204 58 186 100 186 C142 186 186 204 186 270 Z" fill={accent} />
      <path d="M14 270 C14 204 58 186 100 186 C142 186 186 204 186 270 Z" fill="rgba(0,0,0,0.28)" />
      <path d="M78 188 L100 214 L122 188" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="3" strokeLinejoin="round" />

      {/* neck */}
      <rect x="84" y="158" width="32" height="34" rx="10" fill={look.skin} />
      <rect x="84" y="158" width="32" height="34" rx="10" fill={skinShade} />

      <g data-k="head">
        {/* ears */}
        <circle cx="49" cy="118" r="9" fill={look.skin} />
        <circle cx="151" cy="118" r="9" fill={look.skin} />
        {/* head */}
        <ellipse cx="100" cy="112" rx="52" ry="62" fill={look.skin} />
        <ellipse data-k="tint" cx="100" cy="112" rx="52" ry="62" fill="#ff2a2a" opacity="0" />
        <ellipse data-k="blushL" cx="68" cy="132" rx="11" ry="7" fill="#ff7a8a" opacity="0" />
        <ellipse data-k="blushR" cx="132" cy="132" rx="11" ry="7" fill="#ff7a8a" opacity="0" />

        {look.beard && (
          <path d="M49 118 C50 176 80 188 100 188 C120 188 150 176 151 118 C142 134 126 140 100 140 C74 140 58 134 49 118 Z" fill={hair} opacity="0.92" />
        )}

        {/* eyes */}
        {[76, 124].map((cx, i) => (
          <g key={cx} data-k={i ? "eyeR" : "eyeL"}>
            <ellipse cx={cx} cy="108" rx="12" ry="10" fill="#fff" />
            <g data-k={i ? "pupilR" : "pupilL"}>
              <circle cx={cx} cy="108" r="5.5" fill="#1b1410" />
              <circle cx={cx + 2} cy="106" r="1.6" fill="#fff" />
            </g>
          </g>
        ))}

        {/* brows */}
        <g data-k="browL">
          <line x1="-14" y1="0" x2="14" y2="0" stroke={hair} strokeWidth="5.5" strokeLinecap="round" />
        </g>
        <g data-k="browR">
          <line x1="-14" y1="0" x2="14" y2="0" stroke={hair} strokeWidth="5.5" strokeLinecap="round" />
        </g>

        {/* nose */}
        <path d="M100 112 Q93 130 100 132 Q107 133 109 129" fill="none" stroke={skinShade} strokeWidth="2.5" strokeLinecap="round" />

        {/* mouth */}
        <path data-k="mouth" d="M81 152 Q100 152 119 152 Z" fill="#4a1418" stroke="#b34a4f" strokeWidth="3" strokeLinejoin="round" />

        {/* hair front */}
        {look.style === "short" && (
          <path d="M48 104 C42 54 76 36 100 36 C126 36 160 54 152 104 C146 80 128 68 100 68 C72 68 54 80 48 104 Z" fill={hair} />
        )}
        {look.style === "long" && (
          <path d="M47 108 C42 54 80 34 106 38 C134 40 158 58 153 108 C142 84 120 60 96 64 C74 68 56 84 47 108 Z" fill={hair} />
        )}
        {look.style === "cap" && (
          <>
            <path d="M47 96 C46 48 76 32 100 32 C126 32 154 48 153 96 Z" fill="#1d2a4a" />
            <path d="M100 32 L100 96" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
            <path d="M38 96 H170 C170 106 148 110 126 104 H46 Z" fill="#16213e" />
            <path d="M48 98 C48 112 50 118 53 124 L58 102 Z" fill={hair} />
            <path d="M152 98 C152 112 150 118 147 124 L142 102 Z" fill={hair} />
          </>
        )}
      </g>
    </svg>
  );
}
