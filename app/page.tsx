"use client";

import { useState } from "react";
import { ConversationProvider } from "@elevenlabs/react";
import CallScreen from "@/components/CallScreen";
import Debrief from "@/components/Debrief";
import ScenarioCard from "@/components/ScenarioCard";
import { scenarios } from "@/lib/scenarios";
import type { Message, Scenario } from "@/lib/types";

export default function Home() {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [transcript, setTranscript] = useState<Message[] | null>(null);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-8 pt-[max(2rem,env(safe-area-inset-top))]">
      {scenario && !transcript && (
        <ConversationProvider>
          <CallScreen
            scenario={scenario}
            onEnd={setTranscript}
            onCancel={() => setScenario(null)}
          />
        </ConversationProvider>
      )}
      {scenario && transcript && (
        <Debrief
          scenario={scenario}
          transcript={transcript}
          onRestart={() => {
            setScenario(null);
            setTranscript(null);
          }}
        />
      )}
      {!scenario && (
        <>
          <header className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Tradie Talk
            </h1>
            <p className="mt-1 text-slate-600">
              Pick a complaint call and practise keeping the customer on side.
            </p>
          </header>
          <div className="flex flex-col gap-3">
            {scenarios.map((s) => (
              <ScenarioCard key={s.id} scenario={s} onSelect={setScenario} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
