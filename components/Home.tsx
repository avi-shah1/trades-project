"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Hardy from "./Hardy";
import CustomScenario from "./CustomScenario";
import ScenarioCard from "./ScenarioCard";
import { scenarios } from "@/lib/scenarios";
import type { Scenario } from "@/lib/types";

const TIPS = [
  "Say sorry first. Excuses later. Or never.",
  "Name their feeling: “That sounds really frustrating.”",
  "Give a real time. “Tomorrow 9am” beats “soon”.",
  "Own it. “That's on us” calms a call fast.",
];

export default function Home({ onSelect }: { onSelect: (s: Scenario) => void }) {
  const [tip, setTip] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTip((n) => (n + 1) % TIPS.length), 4200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex flex-col items-center pt-2 text-center">
        <motion.div
          initial={{ scale: 0.4, opacity: 0, rotate: -12 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 140, damping: 11 }}
          className="relative"
        >
          <div className="absolute inset-0 -z-10 scale-125 rounded-full bg-hivis/25 blur-3xl" />
          <Hardy size={150} mood="happy" />
        </motion.div>

        <div className="relative mt-3 h-12 w-full max-w-[18rem]">
          <AnimatePresence mode="wait">
            <motion.p
              key={tip}
              initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              transition={{ duration: 0.35 }}
              className="glass absolute inset-x-0 rounded-2xl px-3 py-2 text-xs text-cyan"
            >
              <span className="font-mono text-hivis">HARDY &gt; </span>
              {TIPS[tip]}
            </motion.p>
          </AnimatePresence>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="shimmer-text mt-3 text-5xl font-bold uppercase tracking-tight"
        >
          Tradie Talk
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-1 font-mono text-xs uppercase tracking-[0.25em] text-slate-400"
        >
          Keep your cool · Win the call
        </motion.p>
      </header>

      <p className="mb-3 mt-7 font-mono text-[11px] uppercase tracking-[0.25em] text-slate-500">
        Choose your incoming call
      </p>
      <div className="flex flex-col gap-3 pb-4">
        {scenarios.map((s, i) => (
          <ScenarioCard key={s.id} scenario={s} index={i} onSelect={onSelect} />
        ))}
        <CustomScenario onCreate={onSelect} />
      </div>
    </div>
  );
}
