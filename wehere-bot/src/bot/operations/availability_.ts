import type { Db } from "mongodb";
import type { WithoutId } from "mongodb";
import type { BotContext } from "wehere-bot/src/types";
import type { Locale, Timestamp } from "wehere-bot/src/typing/common";
import {
  PersistentThreadMessage,
  type PersistentObjectId,
  PersistentAvailability,
} from "wehere-bot/src/typing/server";

import { createMessage, notifyNewMessage } from "./message";

type EssentialContext = Pick<BotContext, "db" | "api" | "i18n" | "pusher">;

type ParsedAvailability = {
  value: boolean;
  since: Timestamp | null;
};

export async function setAvailability(
  ctx: { db: Db },
  { value }: { value: boolean }
) {
  const ack = await ctx.db
    .collection("availability") //
    .insertOne({
      createdAt: Date.now(),
      value,
    } satisfies WithoutId<PersistentAvailability>);
  return ack;
}

export async function getAvailability(ctx: {
  db: Db;
}): Promise<ParsedAvailability> {
  const persistentAvailability = await ctx.db
    .collection("availability")
    .findOne({}, { sort: { createdAt: -1 }, limit: 1 })
    .then(PersistentAvailability.parse)
    .catch(() => undefined);

  if (!persistentAvailability) {
    return { value: false, since: null };
  } else {
    return {
      value: persistentAvailability.value,
      since: persistentAvailability.createdAt,
    };
  }
}

function composeMessage(
  ctx: EssentialContext,
  {
    threadId,
    locale,
    available,
  }: { threadId: PersistentObjectId; locale: Locale; available: boolean }
): WithoutId<PersistentThreadMessage> {
  return {
    threadId,
    direction: "from_angel",
    originChatId: null,
    originMessageId: null,
    text: available
      ? ctx.i18n.withLocale(locale)("html-auto-reply-when-available")
      : ctx.i18n.withLocale(locale)("html-auto-reply-when-unavailable"),
    entities: null,
    plainText: true,
    createdAt: Date.now(),
  };
}

export async function isAutoReplyNeeded(
  ctx: EssentialContext,
  { threadId }: { threadId: PersistentObjectId }
) {
  try {
    const availability = await getAvailability(ctx);

    const lastMessage = await ctx.db
      .collection("thread_message")
      .findOne(
        { threadId, direction: "from_mortal" },
        { sort: { createdAt: -1 }, limit: 1 }
      )
      .then(PersistentThreadMessage.parse)
      .catch(() => undefined);

    // We compare two timestamps:
    // 1. the last message from mortal
    // 2. the last update of availability
    // If the last message is newer than the last update of availability,
    // we don't send the auto-reply.

    if (!lastMessage?.createdAt) return true;
    if (!availability.since) return false;
    return lastMessage.createdAt < availability.since;
  } catch (e) {
    // just for safety
    console.error(e);
    return false;
  }
}

export async function autoReply(
  ctx: EssentialContext,
  { threadId, locale }: { threadId: PersistentObjectId; locale: Locale }
) {
  const availability = await getAvailability(ctx);
  const message = composeMessage(ctx, {
    threadId,
    locale,
    available: availability.value,
  });
  const persistentThreadMessage = await createMessage(ctx, { message });
  await notifyNewMessage(ctx, { message: persistentThreadMessage });
}
