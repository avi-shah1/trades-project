"use client";

import { useState } from "react";
import { ConversationProvider } from "@elevenlabs/react";
import CallScreen from "@/components/CallScreen";
import Debrief from "@/components/Debrief";
import Home from "@/components/Home";
import type { Message, Scenario } from "@/lib/types";

export default function Page() {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [transcript, setTranscript] = useState<Message[] | null>(null);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))]">
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
      {!scenario && <Home onSelect={setScenario} />}
    </main>
  );
}
