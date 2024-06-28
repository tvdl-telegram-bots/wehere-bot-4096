import type { Db } from "mongodb";
import type { ChatId } from "wehere-bot/src/typing/common";
import { PersistentAngelSubscription } from "wehere-bot/src/typing/server";
import { parseDocs } from "wehere-bot/src/utils/array";

export async function getAngelSubscriptions(ctx: { db: Db }) {
  return await ctx.db
    .collection("angel_subscription")
    .find()
    .toArray()
    .then(parseDocs(PersistentAngelSubscription));
}

export async function readAngelSubscription(
  ctx: { db: Db },
  { chatId }: { chatId: ChatId }
) {
  return await ctx.db
    .collection("angel_subscription")
    .findOne({ chatId })
    .then((doc) => PersistentAngelSubscription.parse(doc))
    .catch(() => undefined);
}

export async function setAngelSubscription(
  ctx: { db: Db },
  { chatId }: { chatId: ChatId },
  updates: Partial<PersistentAngelSubscription> | null
) {
  if (updates == null) {
    return await ctx.db //
      .collection("angel_subscription")
      .deleteOne({ chatId });
  }
  return await ctx.db
    .collection("angel_subscription")
    .updateOne(
      { chatId },
      { $set: { updatedAt: Date.now(), ...updates } },
      { upsert: true }
    );
}
