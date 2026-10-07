export type Message = {
  role: "customer" | "trainee";
  text: string;
};

export type Scores = {
  acknowledge: number;
  empathise: number;
  ownership: number;
  solution: number;
  timeline: number;
};

export type ScoreResult = {
  scores: Scores;
  strength: string;
  fix: string;
  modelResponse: string;
};

export type Look = {
  skin: string;
  hair: string;
  style: "short" | "long" | "cap";
  beard?: boolean;
};

export type Scenario = {
  id: string;
  title: string;
  blurb: string;
  emoji: string;
  customerName: string;
  gender: "male" | "female";
  voiceId: string;
  accent: string;
  heat: 1 | 2 | 3;
  startPatience: number;
  look: Look;
  customerPrompt: string;
  firstMessage: string;
};
