import type { Db, WithoutId } from "mongodb";
import type { PersistentObjectId } from "wehere-bot/src/typing/server";
import {
  PersistentDeadMessage,
  PersistentTemplate,
} from "wehere-bot/src/typing/server";
import { parseDocs } from "wehere-bot/src/utils/array";

export async function getTemplate(
  ctx: { db: Db },
  key: PersistentTemplate["key"]
): Promise<PersistentTemplate | undefined> {
  const docs = await ctx.db
    .collection("template")
    .find({ key }, { sort: { _id: -1 }, limit: 1 })
    .toArray()
    .then(parseDocs(PersistentTemplate));

  return docs[0];
}

export async function setTemplate_fromDeadMessage(
  ctx: { db: Db },
  {
    key,
    deadMessageId,
  }: {
    key: PersistentTemplate["key"];
    deadMessageId: PersistentObjectId;
  }
) {
  const persistentDeadMessage = await ctx.db
    .collection("dead_message")
    .findOne(deadMessageId)
    .then(PersistentDeadMessage.parse);

  const template: WithoutId<PersistentTemplate> = {
    key,
    text: persistentDeadMessage.text,
    entities: persistentDeadMessage.entities,
    createdAt: Date.now(),
  };

  await ctx.db.collection("template").insertOne(template);
}
