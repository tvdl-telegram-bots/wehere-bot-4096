import { MessageDirection, Timestamp } from "wehere-bot/src/typing/common";
import { z } from "zod";

export type ThreadMessage = z.infer<typeof ThreadMessage>;
export const ThreadMessage = z.object({
  direction: MessageDirection,
  text: z.string().nullish(),
  createdAt: Timestamp,
});

export type OutgoingMessage = z.infer<typeof OutgoingMessage>;
export const OutgoingMessage = z.object({
  direction: MessageDirection,
  text: z.string(),
  createdAt: Timestamp.nullish(), // from server
  composedAt: Timestamp, // from client
});

export type IncomingMessage = z.infer<typeof IncomingMessage>;
export const IncomingMessage = z.object({
  direction: MessageDirection,
  text: z.string().nullish(),
  createdAt: Timestamp,
});

export type Availability = z.infer<typeof Availability>;
export const Availability = z.object({
  type: z.enum(["available", "unavailable"]),
  since: Timestamp.nullish(),
});

export type ThreadSecret = z.infer<typeof ThreadSecret>;
export const ThreadSecret = z.object({
  threadId: z.string(),
  threadPassword: z.string().nullish(),
  threadName: z.string().nullish(),
  threadEmoji: z.string().nullish(),
  threadCreatedAt: Timestamp,
  pusherChannelId: z.string().nullish(),
});
