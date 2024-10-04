import { Nonce } from "wehere-bot/src/typing/common";
import { ThreadMessage } from "wehere-frontend/src/typing/common";
import { z } from "zod";

export type Params$SendMessage = z.infer<typeof Params$SendMessage>;
export const Params$SendMessage = z.object({
  threadId: z.string(),
  threadPassword: z.string(),
  text: z.string(),
  nonce: Nonce,
});

export type Result$SendMessage = z.infer<typeof Result$SendMessage>;
export const Result$SendMessage = z.object({
  message: ThreadMessage,
});
