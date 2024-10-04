import { z } from "zod";

import { MessageDirection, Nonce, Timestamp } from "./common";
import * as Telegram from "./telegram";

export type IncomingMessageEvent = z.infer<typeof IncomingMessageEvent>;
export const IncomingMessageEvent = z.object({
  direction: MessageDirection,
  text: z.string().nullish(),
  entities: Telegram.MessageEntity.array().nullish(),
  createdAt: Timestamp,
  nonce: Nonce.nullish(),
});
