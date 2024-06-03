import { MessageDirection, Timestamp } from "wehere-bot/src/typing/common";
import { z } from "zod";

export type ThreadMessage = z.infer<typeof ThreadMessage>;
export const ThreadMessage = z.object({
  direction: MessageDirection,
  text: z.string(),
  createdAt: Timestamp,
});
