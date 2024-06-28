import { InlineKeyboard } from "grammy";
import type { Db } from "mongodb";
import type { WithoutId } from "mongodb";
import type { BotContext } from "wehere-bot/src/types";
import type { Locale, Timestamp } from "wehere-bot/src/typing/common";
import {
  PersistentThreadMessage,
  type PersistentObjectId,
  PersistentAvailability,
} from "wehere-bot/src/typing/server";
import { html } from "wehere-bot/src/utils/format";
import { getWehereUrlV2 } from "wehere-bot/src/utils/parse";

import { getAngelSubscriptions } from "./angel";
import { getChatLocale } from "./chat_";
import {
  createMessage,
  joinPromisesGracefully,
  notifyNewMessage,
} from "./message";
import { readTemplate } from "./template";

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

async function composeMessage(
  ctx: Pick<BotContext, "db" | "i18n">,
  {
    threadId,
    locale,
    available,
  }: { threadId: PersistentObjectId; locale: Locale; available: boolean }
): Promise<WithoutId<PersistentThreadMessage>> {
  const customTemplate = available
    ? await readTemplate(ctx, "auto_reply_when_available")
    : await readTemplate(ctx, "auto_reply_when_unavailable");
  const text = customTemplate
    ? customTemplate.text
    : available
      ? ctx.i18n.withLocale(locale)("html-auto-reply-when-available")
      : ctx.i18n.withLocale(locale)("html-auto-reply-when-unavailable");
  const entities = customTemplate?.entities || undefined;

  return {
    threadId,
    direction: "from_angel",
    originChatId: null,
    originMessageId: null,
    text,
    entities,
    plainText: !!text && text.length <= 2048 && !entities?.length,
    createdAt: Date.now(),
  };
}

export async function isAutoReplyNeeded(
  ctx: { db: Db },
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
  ctx: Pick<BotContext, "db" | "api" | "i18n" | "pusher">,
  { threadId, locale }: { threadId: PersistentObjectId; locale: Locale }
) {
  const availability = await getAvailability(ctx);
  const message = await composeMessage(ctx, {
    threadId,
    locale,
    available: availability.value,
  });
  const persistentThreadMessage = await createMessage(ctx, { message });
  await notifyNewMessage(ctx, { message: persistentThreadMessage });
}

export async function remindAllAngelsToUpdateAvailability(
  ctx: Pick<BotContext, "db" | "api" | "i18n">,
  params: { expected: boolean; observed: boolean; timestamp: number }
) {
  const angels = await getAngelSubscriptions(ctx);
  const promises = angels.map(async (angel) => {
    const locale = await getChatLocale(ctx, angel.chatId);
    await ctx.api.sendMessage(
      angel.chatId,
      [
        html.i(ctx.i18n.withLocale(locale)("html-please-update-availability")),
        html.pre(JSON.stringify(params, null, 2)),
      ].join("\n"),
      {
        parse_mode: "HTML",
        reply_markup: params.expected
          ? new InlineKeyboard().text(
              ctx.i18n.withLocale(locale)("text-set-available"),
              getWehereUrlV2("availability", "/set", { value: true })
            )
          : new InlineKeyboard().text(
              ctx.i18n.withLocale(locale)("text-set-unavailable"),
              getWehereUrlV2("availability", "/set", { value: false })
            ),
      }
    );
  });
  await joinPromisesGracefully(ctx, promises);
}
