import type { Db } from "mongodb";
import { Locale, type ChatId } from "wehere-bot/src/typing/common";
import { PersistentMortalSubscription } from "wehere-bot/src/typing/server";

export async function readMortalLocale(
  ctx: { db: Db },
  chatId: ChatId
): Promise<Locale | undefined> {
  const mortal = await ctx.db
    .collection("mortal_subscription")
    .findOne({ chatId })
    .then((doc) => PersistentMortalSubscription.parse(doc))
    .catch(() => undefined);
  return mortal?.locale || undefined;
}

export async function getMortalLocale(
  ctx: { db: Db },
  chatId: ChatId
): Promise<Locale> {
  const locale = await readMortalLocale(ctx, chatId);
  return Locale.orDefault(locale);
}
