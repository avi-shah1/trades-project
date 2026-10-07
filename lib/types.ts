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

export type Scenario = {
  id: string;
  title: string;
  blurb: string;
  emoji: string;
  customerName: string;
  customerPrompt: string;
  firstMessage: string;
};
