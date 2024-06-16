import { PersistentThreadMessage } from "wehere-bot/src/typing/server";
import * as Telegram from "wehere-bot/src/typing/telegram";
import { z } from "zod";

export type Params$SendMessage$WehereBackend = z.infer<
  typeof Params$SendMessage$WehereBackend
>;
export const Params$SendMessage$WehereBackend = z.object({
  threadId: z.string(),
  threadPassword: z.string().nullish(),
  text: z.string(),
  entities: Telegram.MessageEntity.array().nullish(),
});

export type Result$SendMessage$WehereBackend = z.infer<
  typeof Result$SendMessage$WehereBackend
>;
export const Result$SendMessage$WehereBackend = z.object({
  persistentThreadMessage: PersistentThreadMessage,
});
