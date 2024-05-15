import * as crypto from "crypto";

import type { Db, WithoutId } from "mongodb";

import type {
  PersistentObjectId,
  PersistentPusherSubscription,
} from "@/typing/server";

export async function createPusherSubscription(
  ctx: { db: Db },
  params: { threadId: PersistentObjectId }
): Promise<PersistentPusherSubscription> {
  const sub: WithoutId<PersistentPusherSubscription> = {
    pusherChannelId: crypto.randomUUID(),
    threadId: params.threadId,
    createdAt: Date.now(),
  };

  const ack = await ctx.db.collection("pusher_subscription").insertOne(sub);
  return { _id: ack.insertedId, ...sub };
}
