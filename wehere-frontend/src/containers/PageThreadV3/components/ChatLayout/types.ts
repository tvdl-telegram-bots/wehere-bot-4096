export type ActivePage =
  | { type: "home" }
  | { type: "about" }
  | { type: "thread"; threadId: string };
