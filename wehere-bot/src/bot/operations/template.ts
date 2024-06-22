import type { Db } from "mongodb";
import type { TemplateKey } from "wehere-bot/src/typing/common";
import type { PersistentObjectId } from "wehere-bot/src/typing/server";
import {
  PersistentDeadMessage,
  PersistentTemplate,
} from "wehere-bot/src/typing/server";
import { parseDocs } from "wehere-bot/src/utils/array";

export async function getTemplates(ctx: {
  db: Db;
}): Promise<PersistentTemplate[]> {
  return await ctx.db
    .collection("template")
    .find()
    .toArray()
    .then(parseDocs(PersistentTemplate));
}

export async function readTemplate(
  ctx: { db: Db },
  key: TemplateKey
): Promise<PersistentTemplate | undefined> {
  return await ctx.db
    .collection("template")
    .find({ key }, { sort: { _id: -1 }, limit: 1 })
    .toArray()
    .then(parseDocs(PersistentTemplate))
    .then((array) => array[0]);
}

export async function deleteTemplate(
  ctx: { db: Db },
  key: TemplateKey
): Promise<number> {
  const ack = await ctx.db.collection("template").deleteOne({ key });
  return ack.deletedCount;
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

  await ctx.db.collection("template").updateOne(
    { key },
    {
      $set: {
        text: persistentDeadMessage.text,
        entities: persistentDeadMessage.entities,
        createdAt: Date.now(),
      },
    },
    { upsert: true }
  );
}
