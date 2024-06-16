import type { Db } from "mongodb";
import type { ChatId, Locale } from "wehere-bot/src/typing/common";
import { PersistentChat } from "wehere-bot/src/typing/server";

export const DEFAULT_LOCALE: Locale = "vi";

export async function getChatLocale(ctx: { db: Db }, chatId: ChatId) {
  const persistentChat = await ctx.db
    .collection("chat")
    .findOne({ chatId: { $eq: chatId } })
    .then((doc) => PersistentChat.parse(doc))
    .catch(() => undefined);
  return persistentChat?.locale || DEFAULT_LOCALE;
}
