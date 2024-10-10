import type { ObjectId } from "mongodb";
import { serializeError } from "serialize-error";
import type { BotContext } from "wehere-bot/src/types";
import type { Emoji } from "wehere-bot/src/typing/common";
import { ReactionUpdateEvent } from "wehere-bot/src/typing/pusher";
import type {
  PersistentObjectId,
  PersistentThreadMessage,
} from "wehere-bot/src/typing/server";
import { PersistentPusherSubscription } from "wehere-bot/src/typing/server";
import { parseDocs } from "wehere-bot/src/utils/array";

function captureExceptionGracefully(
  ctx: Pick<BotContext, "db">,
  error: unknown
) {
  try {
    const serializedError = serializeError(error);

    Promise.resolve(undefined)
      .then(() => console.error(serializedError))
      .catch((err) => console.error(err));

    Promise.resolve(undefined)
      .then(() =>
        ctx.db.collection("error").insertOne({
          createdAt: Date.now(),
          error: serializedError,
        })
      )
      .then((ack) => console.log("Exception captured to DB: ", ack.insertedId))
      .catch((err) => console.error(err));
  } catch (err) {
    console.error(err);
  }
}

export async function notifyPusher$ReactionUpdateEvent(
  ctx: Pick<BotContext, "db" | "api" | "i18n" | "pusher">,
  threadId: ObjectId,
  event: ReactionUpdateEvent
) {
  const pushers = await ctx.db
    .collection("pusher_subscription")
    .find({ threadId })
    .toArray()
    .then(parseDocs(PersistentPusherSubscription));

  const promises = pushers.map(async (pusher) => {
    await ctx.pusher.trigger(
      pusher.pusherChannelId,
      ReactionUpdateEvent.name,
      event
    );
  });

  await Promise.all(
    promises.map((t) => t.catch((err) => captureExceptionGracefully(ctx, err)))
  );
}
