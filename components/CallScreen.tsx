"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import CallView, { type CallStatus } from "./CallView";
import MicCheck, { type MicChoice } from "./MicCheck";
import { computePatience } from "@/lib/patience";
import type { Message, Scenario } from "@/lib/types";

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

type Props = {
  scenario: Scenario;
  onEnd: (transcript: Message[]) => void;
  onCancel: () => void;
};

export default function CallScreen(props: Props) {
  const [choice, setChoice] = useState<MicChoice | null>(null);
  if (!AGENT_ID) return <DemoCall {...props} />;
  if (!choice) return <MicCheck customerName={props.scenario.customerName} onContinue={setChoice} />;
  return (
    <ConversationProvider>
      <RealCall {...props} agentId={AGENT_ID} choice={choice} />
    </ConversationProvider>
  );
}

function RealCall({ scenario, onEnd, onCancel, agentId, choice }: Props & { agentId: string; choice: MicChoice }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const notice = choice.textOnly ? "Voice is off for this call. Type your replies below." : null;
  const [typing, setTyping] = useState(choice.textOnly);
  const ending = useRef(false);

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
    onDisconnect: (details) => {
      if (ending.current) return;
      console.warn("ElevenLabs disconnected", details);
      const why =
        details.reason === "error"
          ? details.message
          : details.reason === "agent"
            ? `the agent ended the call${details.closeReason ? `: ${details.closeReason}` : ""}${details.closeCode ? ` (code ${details.closeCode})` : ""}`
            : "the call was closed";
      setError(
        `The call dropped (${why}). Check the agent ID, and that System prompt, First message and Voice overrides are enabled in the agent's Security tab.`,
      );
    },
  });
  const { startSession, endSession, sendUserMessage, status, isSpeaking, getOutputVolume, getInputVolume } = conv;

  useEffect(() => {
    // ConversationProvider ends the session when it unmounts, and React StrictMode (dev)
    // simulates an unmount right after mount. Starting on a timer that cleanup cancels means
    // the real start happens after that simulated teardown; a genuine unmount still ends the call.
    const timer = setTimeout(() => {
      startSession({
        agentId,
        connectionType: "websocket",
        inputDeviceId: choice.deviceId,
        overrides: {
          agent: {
            prompt: { prompt: scenario.customerPrompt },
            firstMessage: scenario.firstMessage,
          },
          tts: { voiceId: scenario.voiceId },
          ...(choice.textOnly ? { conversation: { textOnly: true } } : {}),
        },
      });
    }, 0);
    return () => clearTimeout(timer);
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
      notice={notice}
      typing={typing}
      onTypingChange={setTyping}
      isSpeaking={isSpeaking}
      patience={patience}
      getOutLevel={getOutputVolume}
      getInLevel={getInputVolume}
      onSend={send}
      onEnd={() => {
        ending.current = true;
        endSession();
        onEnd(messages);
      }}
      onBack={() => {
        ending.current = true;
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
      notice={null}
      typing
      onTypingChange={() => {}}
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
