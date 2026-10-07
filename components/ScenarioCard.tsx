import type { Scenario } from "@/lib/types";

export default function ScenarioCard({
  scenario,
  onSelect,
}: {
  scenario: Scenario;
  onSelect: (s: Scenario) => void;
}) {
  return (
    <button
      onClick={() => onSelect(scenario)}
      className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.98] active:bg-slate-50"
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amber-100 text-3xl">
        {scenario.emoji}
      </span>
      <span className="flex-1">
        <span className="block text-base font-semibold text-slate-900">
          {scenario.title}
        </span>
        <span className="mt-0.5 block text-sm text-slate-600">
          {scenario.blurb}
        </span>
      </span>
      <span aria-hidden className="text-xl text-slate-400">
        ›
      </span>
    </button>
  );
}
