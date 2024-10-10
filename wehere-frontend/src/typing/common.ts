import {
  Emoji,
  Entities,
  MessageDirection,
  Nonce,
  TemplateKey,
  Timestamp,
} from "wehere-bot/src/typing/common";
import * as Telegram from "wehere-bot/src/typing/telegram";
import { z } from "zod";

export type BaseMessage = z.infer<typeof BaseMessage>;
export const BaseMessage = z.object({
  direction: MessageDirection,
  entities: Telegram.MessageEntity.array().nullish(),
  angelEmoji: Emoji.nullable(),
  mortalEmoji: Emoji.nullable(),
});

export type ThreadMessage = z.infer<typeof ThreadMessage>;
export const ThreadMessage = BaseMessage.extend({
  type: z.literal("ThreadMessage"),
  text: z.string().nullish(),
  createdAt: Timestamp,
  composedAt: z.undefined().nullish(),
  sentAt: z.undefined().nullish(),
  nonce: Nonce.nullish(),
});

export type OutgoingMessage = z.infer<typeof OutgoingMessage>;
export const OutgoingMessage = BaseMessage.extend({
  type: z.literal("OutgoingMessage"),
  text: z.string(),
  createdAt: z.undefined().nullish(),
  composedAt: Timestamp, // generated by FE
  sentAt: Timestamp.nullish(), // acknowledgement by BE
  nonce: Nonce,
});

export type IncomingMessage = z.infer<typeof IncomingMessage>;
export const IncomingMessage = BaseMessage.extend({
  type: z.literal("IncomingMessage"),
  text: z.string().nullish(),
  createdAt: Timestamp,
  composedAt: z.undefined().nullish(),
  sentAt: z.undefined().nullish(),
  nonce: Nonce.nullish(),
});

const _VariantMessage = z.discriminatedUnion("type", [
  ThreadMessage,
  IncomingMessage,
  OutgoingMessage,
]);
export type VariantMessage = z.infer<typeof _VariantMessage>;
export const VariantMessage = Object.assign(_VariantMessage, {
  getTimestamp: (value: VariantMessage): Timestamp => {
    switch (value.type) {
      case "OutgoingMessage":
        return value.sentAt || value.composedAt;
      default:
        return value.createdAt;
    }
  },

  getKey: (value: VariantMessage): Timestamp => {
    switch (value.type) {
      case "OutgoingMessage":
        return value.nonce;
      default:
        return value.nonce || value.createdAt;
    }
  },
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

export type Template = z.infer<typeof Template>;
export const Template = z.object({
  key: TemplateKey,
  text: z.string().nullish(),
  entities: Entities.nullish(),
});

export type StartingQuestion = z.infer<typeof StartingQuestion>;
export const StartingQuestion = z.object({
  prompt: Template,
  answer: Template,
});
