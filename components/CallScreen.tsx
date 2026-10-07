"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import Avatar from "./Avatar";
import type { Message, Scenario } from "@/lib/types";

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

export default function CallScreen({
  scenario,
  onEnd,
  onCancel,
}: {
  scenario: Scenario;
  onEnd: (transcript: Message[]) => void;
  onCancel: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(
    AGENT_ID ? null : "Missing NEXT_PUBLIC_ELEVENLABS_AGENT_ID in .env.local",
  );
  const bottomRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const { startSession, endSession, status, isSpeaking } = useConversation({
    onMessage: ({ message, source }) => {
      setMessages((prev) => [
        ...prev,
        { role: source === "ai" ? "customer" : "trainee", text: message },
      ]);
    },
    onError: (message) => setError(String(message)),
  });

  useEffect(() => {
    if (!AGENT_ID || started.current) return;
    started.current = true;
    startSession({
      agentId: AGENT_ID,
      overrides: {
        agent: {
          prompt: { prompt: scenario.customerPrompt },
          firstMessage: scenario.firstMessage,
        },
      },
    });
  }, [scenario, startSession]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleEnd = useCallback(() => {
    endSession();
    onEnd(messages);
  }, [endSession, messages, onEnd]);

  const handleCancel = useCallback(() => {
    endSession();
    onCancel();
  }, [endSession, onCancel]);

  const connecting = status === "connecting" || (status === "disconnected" && !error);

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <div className="flex flex-col items-center pt-4">
        <Avatar
          emoji={scenario.emoji}
          name={scenario.customerName}
          speaking={isSpeaking}
        />
        <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">
          {error ? "Error" : connecting ? "Connecting…" : "On call"}
        </p>
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 flex-1 space-y-2 overflow-y-auto rounded-2xl bg-slate-100 p-3">
        {messages.length === 0 && !error && (
          <p className="text-center text-sm text-slate-400">
            Transcript will appear here. Allow microphone access when asked.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "trainee" ? "justify-end" : "justify-start"}`}
          >
            <p
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                m.role === "trainee"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-900 shadow-sm"
              }`}
            >
              {m.text}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        {error ? (
          <button
            onClick={handleCancel}
            className="w-full rounded-full bg-slate-900 py-4 text-base font-semibold text-white active:scale-[0.98]"
          >
            Back
          </button>
        ) : (
          <button
            onClick={handleEnd}
            className="w-full rounded-full bg-red-600 py-4 text-base font-semibold text-white active:scale-[0.98]"
          >
            End call
          </button>
        )}
      </div>
    </div>
  );
}
