import { z } from "zod";

import { Emoji, MessageDirection, Nonce, Timestamp } from "./common";
import * as Telegram from "./telegram";

export type IncomingMessageEvent = z.infer<typeof IncomingMessageEvent>;
export const IncomingMessageEvent = z.object({
  direction: MessageDirection,
  text: z.string().nullish(),
  entities: Telegram.MessageEntity.array().nullish(),
  createdAt: Timestamp,
  nonce: Nonce.nullish(),
});

export type ReactionUpdateEvent = z.infer<typeof ReactionUpdateEvent>;
export const ReactionUpdateEvent = Object.assign(
  z.object({
    messageCreatedAt: Timestamp,
    messageNonce: Nonce.nullish(),
    angelEmoji: Emoji.nullish(),
    mortalEmoji: Emoji.nullish(),
  }),
  { name: "ReactionUpdateEvent" } as const
);
