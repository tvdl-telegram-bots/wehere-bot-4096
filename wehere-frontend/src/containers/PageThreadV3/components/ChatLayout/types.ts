export type ActivePage =
  | { type: "home" }
  | { type: "thread"; threadId: string };
