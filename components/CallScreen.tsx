"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import CallView, { type CallStatus } from "./CallView";
import { computePatience } from "@/lib/patience";
import type { Message, Scenario } from "@/lib/types";

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

type Props = {
  scenario: Scenario;
  onEnd: (transcript: Message[]) => void;
  onCancel: () => void;
};

export default function CallScreen(props: Props) {
  if (!AGENT_ID) return <DemoCall {...props} />;
  return (
    <ConversationProvider>
      <RealCall {...props} agentId={AGENT_ID} />
    </ConversationProvider>
  );
}

function RealCall({ scenario, onEnd, onCancel, agentId }: Props & { agentId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const conv = useConversation({
    onMessage: ({ message, source }) => {
      const role = source === "ai" ? "customer" : "trainee";
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        // typed replies are added locally; skip the echo from the server
        if (role === "trainee" && last?.role === "trainee" && last.text === message.trim()) return prev;
        return [...prev, { role, text: message }];
      });
    },
    onError: (message) => setError(String(message)),
  });
  const { startSession, endSession, sendUserMessage, status, isSpeaking, getOutputVolume, getInputVolume } = conv;

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    startSession({
      agentId,
      overrides: {
        agent: {
          prompt: { prompt: scenario.customerPrompt },
          firstMessage: scenario.firstMessage,
        },
      },
    });
    return () => endSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patience = useMemo(() => computePatience(messages, scenario.startPatience), [messages, scenario]);
  const callStatus: CallStatus = error ? "error" : status === "connected" ? "live" : "connecting";

  const send = useCallback(
    (text: string) => {
      sendUserMessage(text);
      setMessages((prev) => [...prev, { role: "trainee", text }]);
    },
    [sendUserMessage],
  );

  return (
    <CallView
      scenario={scenario}
      messages={messages}
      status={callStatus}
      error={error}
      isSpeaking={isSpeaking}
      patience={patience}
      getOutLevel={getOutputVolume}
      getInLevel={getInputVolume}
      onSend={send}
      onEnd={() => {
        endSession();
        onEnd(messages);
      }}
      onBack={() => {
        endSession();
        onCancel();
      }}
      demo={false}
    />
  );
}

const DEMO_REPLIES = [
  "Hmm. I hear you, but I really need this sorted properly this time.",
  "Okay... and when exactly can someone actually come out?",
  "Alright. That sounds fair. Thanks for taking it seriously.",
];

/** No agent configured: a scripted customer so the whole UI can be explored offline. */
function DemoCall({ scenario, onEnd, onCancel }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<CallStatus>("connecting");
  const [speaking, setSpeaking] = useState(false);
  const replies = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const say = useCallback((text: string) => {
    setMessages((prev) => [...prev, { role: "customer", text }]);
    setSpeaking(true);
    timers.current.push(setTimeout(() => setSpeaking(false), Math.max(1200, text.length * 55)));
  }, []);

  useEffect(() => {
    const open = setTimeout(() => {
      setStatus("live");
      say(scenario.firstMessage);
    }, 1200);
    const pending = timers.current;
    return () => {
      clearTimeout(open);
      pending.forEach(clearTimeout);
    };
  }, [scenario, say]);

  const patience = useMemo(() => computePatience(messages, scenario.startPatience), [messages, scenario]);

  const getOut = useCallback(() => (0.3 + 0.4 * Math.abs(Math.sin(performance.now() / 70)) * (0.6 + 0.4 * Math.random())), []);

  const send = useCallback(
    (text: string) => {
      setMessages((prev) => [...prev, { role: "trainee", text }]);
      const reply = DEMO_REPLIES[Math.min(replies.current++, DEMO_REPLIES.length - 1)];
      timers.current.push(setTimeout(() => say(reply), 900));
    },
    [say],
  );

  return (
    <CallView
      scenario={scenario}
      messages={messages}
      status={status}
      error={null}
      isSpeaking={speaking}
      patience={patience}
      getOutLevel={getOut}
      getInLevel={() => 0}
      onSend={send}
      onEnd={() => onEnd(messages)}
      onBack={onCancel}
      demo
    />
  );
}
