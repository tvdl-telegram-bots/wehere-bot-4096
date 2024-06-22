import { InlineKeyboard } from "grammy";
import type { Db, WithoutId } from "mongodb";
import type { BotContext } from "wehere-bot/src/types";
import type {
  ChatId,
  NewMessage$PusherEvent,
} from "wehere-bot/src/typing/common";
import type {
  PersistentDeadMessage,
  PersistentThreadMessage,
} from "wehere-bot/src/typing/server";
import {
  PersistentAngelSubscription,
  PersistentMortalSubscription,
  PersistentPusherSubscription,
  PersistentThread,
} from "wehere-bot/src/typing/server";
import { parseDocs } from "wehere-bot/src/utils/array";
import {
  formatErrorAsObject,
  formatErrorDeeply,
  formatThread,
  html,
} from "wehere-bot/src/utils/format";

import { getChatLocale } from "./chat_";

async function joinPromisesGracefully(
  ctx: { db: Db },
  promises: Promise<void>[]
) {
  await Promise.all(
    promises.map((p) =>
      p.catch(async (error) => {
        console.error(formatErrorDeeply(error));
        await ctx.db
          .collection("error")
          .insertOne(formatErrorAsObject(error))
          .catch((anotherError) => {
            console.error(formatErrorDeeply(anotherError));
          });
      })
    )
  );
}

export async function createMessage(
  { db }: { db: Db },
  { message }: { message: WithoutId<PersistentThreadMessage> }
): Promise<PersistentThreadMessage> {
  const ack = await db.collection("thread_message").insertOne(message);
  return { _id: ack.insertedId, ...message };
}

type EssentialContext = Pick<BotContext, "db" | "api" | "i18n" | "pusher">;

async function notifyMortals(
  ctx: EssentialContext,
  message: PersistentThreadMessage,
  excludesChats: ChatId[]
) {
  const mortalSubs = await ctx.db
    .collection("mortal_subscription")
    .find({ threadId: message.threadId })
    .toArray()
    .then(parseDocs(PersistentMortalSubscription));

  const promises = mortalSubs
    .filter((sub) => !excludesChats.includes(sub.chatId))
    .map(async (sub) => {
      if (message.originChatId && message.originMessageId) {
        await ctx.api.copyMessage(
          sub.chatId,
          message.originChatId,
          message.originMessageId
        );
      } else if (message.text) {
        await ctx.api.sendMessage(sub.chatId, message.text, {
          entities: message.entities || undefined,
        });
      } else {
        throw new Error("invalid message", { cause: { message } });
      }
    });

  await joinPromisesGracefully(ctx, promises);
}

async function notifyAngels(
  ctx: EssentialContext,
  message: PersistentThreadMessage
) {
  const angelSubs = await ctx.db
    .collection("angel_subscription")
    .find()
    .toArray()
    .then(parseDocs(PersistentAngelSubscription));

  const thread = await ctx.db
    .collection("thread")
    .findOne({ _id: message.threadId })
    .then((doc) => PersistentThread.parse(doc));

  const subject =
    message.direction === "from_mortal"
      ? html.strong(html.literal(formatThread(thread)))
      : [
          html.strong("🏢 WeHere"),
          `(${html.strong(html.literal(formatThread(thread)))})`,
        ].join(" ");

  const promises: Promise<void>[] = angelSubs.map(async (sub) => {
    const locale = await getChatLocale(ctx, sub.chatId);
    const keyboard =
      message.direction === "from_mortal"
        ? new InlineKeyboard().text(
            ctx.i18n.withLocale(locale)("text-reply"),
            `wehere:/reply?threadId=${thread._id.toHexString()}`
          )
        : undefined;

    if (message.text && message.plainText) {
      await ctx.api.sendMessage(
        sub.chatId,
        [subject, html.literal(message.text)].join("\n"),
        { parse_mode: "HTML", reply_markup: keyboard }
      );
    } else if (message.originChatId && message.originMessageId) {
      const msg1 = await ctx.api.sendMessage(
        sub.chatId,
        subject,
        { parse_mode: "HTML", reply_markup: keyboard } //
      );

      await ctx.api.copyMessage(
        sub.chatId,
        message.originChatId,
        message.originMessageId,
        { reply_parameters: { message_id: msg1.message_id } }
      );
    } else if (message.text) {
      const msg1 = await ctx.api.sendMessage(
        sub.chatId,
        subject,
        { parse_mode: "HTML", reply_markup: keyboard } //
      );

      await ctx.api.sendMessage(sub.chatId, message.text, {
        parse_mode: "HTML",
        reply_markup: keyboard,
        entities: message.entities || undefined,
        reply_parameters: { message_id: msg1.message_id },
      });
    } else {
      throw new Error("invalid message", { cause: { message } });
    }
  });

  await joinPromisesGracefully(ctx, promises);
}

async function notifyPusher(
  ctx: EssentialContext,
  message: PersistentThreadMessage
) {
  const pusherSubs = await ctx.db
    .collection("pusher_subscription")
    .find({ threadId: message.threadId })
    .toArray()
    .then(parseDocs(PersistentPusherSubscription));

  const promises = pusherSubs.map(async (sub) => {
    await ctx.pusher.trigger(sub.pusherChannelId, "new-message", {
      direction: message.direction,
      text: message.text,
      createdAt: message.createdAt,
    } satisfies NewMessage$PusherEvent);
  });

  await joinPromisesGracefully(ctx, promises);
}

export async function notifyNewMessage(
  ctx: EssentialContext,
  {
    message,
    excludesChats = [],
  }: {
    message: PersistentThreadMessage;
    excludesChats?: ChatId[];
  }
) {
  await joinPromisesGracefully(ctx, [
    notifyMortals(ctx, message, excludesChats),
    notifyAngels(ctx, message),
    notifyPusher(ctx, message),
  ]);
}

export async function createDeadMessage(
  ctx: { db: Db },
  { message }: { message: WithoutId<PersistentDeadMessage> }
): Promise<PersistentDeadMessage> {
  const ack = await ctx.db.collection("dead_message").insertOne(message);
  return { _id: ack.insertedId, ...message };
}
