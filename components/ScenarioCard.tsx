"use client";

import { motion } from "motion/react";
import type { Scenario } from "@/lib/types";

export default function ScenarioCard({
  scenario,
  index,
  onSelect,
}: {
  scenario: Scenario;
  index: number;
  onSelect: (s: Scenario) => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 + index * 0.12, type: "spring", stiffness: 160, damping: 18 }}
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -3 }}
      onClick={() => onSelect(scenario)}
      className="glass group relative flex w-full items-center gap-4 overflow-hidden rounded-3xl p-4 text-left"
      style={{ boxShadow: `0 0 0 1px ${scenario.accent}22, 0 12px 40px -16px ${scenario.accent}66` }}
    >
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: scenario.accent, boxShadow: `0 0 18px ${scenario.accent}` }}
      />
      <span
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-4xl"
        style={{ background: `${scenario.accent}22`, boxShadow: `inset 0 0 20px ${scenario.accent}33` }}
      >
        {scenario.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-base font-bold text-white">{scenario.title}</span>
        </span>
        <span className="mt-1 block text-sm leading-snug text-slate-300">{scenario.blurb}</span>
        <span className="mt-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-slate-400">
          <span>Caller: {scenario.customerName}</span>
          <span aria-hidden>·</span>
          <span aria-label={`Heat ${scenario.heat} of 3`}>
            {"🔥".repeat(scenario.heat)}
            <span className="opacity-25">{"🔥".repeat(3 - scenario.heat)}</span>
          </span>
        </span>
      </span>
      <span
        aria-hidden
        className="text-2xl transition-transform group-active:translate-x-1"
        style={{ color: scenario.accent }}
      >
        ›
      </span>
    </motion.button>
  );
}
