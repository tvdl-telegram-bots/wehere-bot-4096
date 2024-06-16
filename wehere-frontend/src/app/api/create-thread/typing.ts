import { Timestamp } from "wehere-bot/src/typing/common";
import { ThreadMessage } from "wehere-frontend/src/typing/common";
import { z } from "zod";

export type Params$CreateThread = z.input<typeof Params$CreateThread>;
export const Params$CreateThread = z.object({
  initialMessage: z.object({
    text: z.string(),
  }),
});

export type Result$CreateThread = z.input<typeof Result$CreateThread>;
export const Result$CreateThread = z.object({
  threadId: z.string(),
  threadPassword: z.string().nullish(),
  threadName: z.string().nullish(),
  threadEmoji: z.string().nullish(),
  threadCreatedAt: Timestamp,
  pusherChannelId: z.string(),
  initialMessage: ThreadMessage,
});
