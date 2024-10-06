import { InlineKeyboard } from "grammy";
import type { Db, WithoutId } from "mongodb";
import type { BotContext } from "wehere-bot/src/types";
import {
  Emoji,
  Locale,
  type ChatId,
  type MessageId,
} from "wehere-bot/src/typing/common";
import type { IncomingMessageEvent } from "wehere-bot/src/typing/pusher";
import type {
  PersistentDeadMessage,
  PersistentObjectId,
} from "wehere-bot/src/typing/server";
import { PersistentThreadMessage } from "wehere-bot/src/typing/server";
import { PersistentSentMessage } from "wehere-bot/src/typing/server";
import {
  PersistentAngelSubscription,
  PersistentMortalSubscription,
  PersistentPusherSubscription,
  PersistentThread,
} from "wehere-bot/src/typing/server";
import type { ReactionType } from "wehere-bot/src/typing/telegram";
import { parseDocs } from "wehere-bot/src/utils/array";
import {
  formatErrorAsObject,
  formatErrorDeeply,
  formatThread,
  html,
} from "wehere-bot/src/utils/format";

export async function joinPromisesGracefully(
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

async function createSentMessage(
  ctx: EssentialContext,
  sentMessage: WithoutId<PersistentSentMessage>
): Promise<PersistentSentMessage> {
  const ack = await ctx.db.collection("sent_message").insertOne(sentMessage);
  return { _id: ack.insertedId, ...sentMessage };
}

export async function readThreadMessage_givenSentMessage(
  ctx: Pick<BotContext, "db">,
  chatId: ChatId,
  messageId: MessageId
): Promise<PersistentThreadMessage | undefined> {
  const sentMessage = await ctx.db
    .collection("sent_message")
    .findOne({ chatId, messageId })
    .then((doc) => PersistentSentMessage.parse(doc))
    .catch(() => undefined);
  if (!sentMessage) {
    return undefined;
  }
  const threadMessage = await ctx.db
    .collection("thread_message")
    .findOne(sentMessage.threadMessageId)
    .then((doc) => PersistentThreadMessage.parse(doc))
    .catch(() => undefined);
  return threadMessage;
}

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
        const msg1 = await ctx.api.copyMessage(
          sub.chatId,
          message.originChatId,
          message.originMessageId
        );
        await createSentMessage(ctx, {
          chatId: sub.chatId,
          messageId: msg1.message_id,
          threadMessageId: message._id,
        });
      } else if (message.text) {
        const msg1 = await ctx.api.sendMessage(sub.chatId, message.text, {
          entities: message.entities || undefined,
        });
        await createSentMessage(ctx, {
          chatId: sub.chatId,
          messageId: msg1.message_id,
          threadMessageId: message._id,
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
  const angels = await ctx.db
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

  const promises: Promise<void>[] = angels.map(async (angel) => {
    const locale = Locale.orDefault(angel.locale);
    const keyboard =
      message.direction === "from_mortal"
        ? new InlineKeyboard().text(
            ctx.i18n.withLocale(locale)("text-reply"),
            `wehere:/reply?threadId=${thread._id.toHexString()}`
          )
        : undefined;

    if (message.text && message.plainText) {
      const msg1 = await ctx.api.sendMessage(
        angel.chatId,
        [subject, html.literal(message.text)].join("\n"),
        { parse_mode: "HTML", reply_markup: keyboard }
      );
      await createSentMessage(ctx, {
        chatId: angel.chatId,
        messageId: msg1.message_id,
        threadMessageId: message._id,
      });
    } else if (message.originChatId && message.originMessageId) {
      const msg1 = await ctx.api.sendMessage(
        angel.chatId,
        subject,
        { parse_mode: "HTML", reply_markup: keyboard } //
      );
      const msg2 = await ctx.api.copyMessage(
        angel.chatId,
        message.originChatId,
        message.originMessageId,
        { reply_parameters: { message_id: msg1.message_id } }
      );
      await createSentMessage(ctx, {
        chatId: angel.chatId,
        messageId: msg2.message_id,
        threadMessageId: message._id,
      });
    } else if (message.text) {
      const msg1 = await ctx.api.sendMessage(
        angel.chatId,
        subject,
        { parse_mode: "HTML", reply_markup: keyboard } //
      );
      const msg2 = await ctx.api.sendMessage(angel.chatId, message.text, {
        reply_markup: keyboard,
        entities: message.entities || undefined,
        reply_parameters: { message_id: msg1.message_id },
      });
      await createSentMessage(ctx, {
        chatId: angel.chatId,
        messageId: msg2.message_id,
        threadMessageId: message._id,
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
    await ctx.pusher.trigger(sub.pusherChannelId, "IncomingMessageEvent", {
      direction: message.direction,
      text: message.text,
      entities: message.entities,
      createdAt: message.createdAt,
      nonce: message.nonce,
    } satisfies IncomingMessageEvent);
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

export async function updateMessageEmoji(
  ctx: Pick<BotContext, "db">,
  threadMessageId: PersistentObjectId,
  from: "angel" | "mortal",
  emoji: Emoji | undefined
) {
  await ctx.db
    .collection("thread_message")
    .updateOne(
      { _id: threadMessageId },
      from == "mortal"
        ? { $set: { mortalEmoji: emoji || null } }
        : { $set: { angelEmoji: emoji || null } }
    );
}

export function getLastAddedEmoji(
  olds: ReactionType[],
  news: ReactionType[]
): string | undefined {
  const oldEmojis = olds.map(Emoji.fromReactionType);
  const newEmojis = news.map(Emoji.fromReactionType).reverse();
  return newEmojis.find((x) => !oldEmojis.includes(x));
}

export async function notifyAngelsAboutReaction(
  ctx: EssentialContext,
  threadMessage: PersistentThreadMessage,
  from: "angel" | "mortal",
  emoji: string | undefined
) {
  const tasks: (() => Promise<void>)[] = [];

  const angels = await ctx.db
    .collection("angel_subscription")
    .find()
    .toArray()
    .then(parseDocs(PersistentAngelSubscription));

  const thread = await ctx.db
    .collection("thread")
    .findOne({ _id: threadMessage.threadId })
    .then((doc) => PersistentThread.parse(doc));

  for (const angel of angels) {
    const locale = Locale.orDefault(angel.locale);

    const sentMessage = await ctx.db
      .collection("sent_message")
      .findOne({
        threadMessageId: threadMessage._id,
        chatId: angel.chatId,
      })
      .then((doc) => PersistentSentMessage.parse(doc))
      .catch(() => undefined);

    tasks.push(async () => {
      const reactionSentBy =
        from === "mortal"
          ? html.strong(html.literal(formatThread(thread)))
          : html.strong("🏢 WeHere");
      const subject = emoji
        ? ctx.i18n.withLocale(locale)(
            "html-user-set-reactions", //
            { user: reactionSentBy, reactions: emoji }
          )
        : ctx.i18n.withLocale(locale)(
            "html-user-unset-reactions", //
            { user: reactionSentBy }
          );

      await ctx.api.sendMessage(angel.chatId, subject, {
        parse_mode: "HTML",
        reply_parameters: sentMessage
          ? { message_id: sentMessage.messageId }
          : undefined,
      });

      if (
        sentMessage &&
        from === "mortal" &&
        threadMessage.direction === "from_angel"
      ) {
        await ctx.api.setMessageReaction(
          sentMessage.chatId,
          sentMessage.messageId,
          emoji ? [Emoji.intoReactionType(emoji)] : []
        );
      }
    });
  }

  await joinPromisesGracefully(
    ctx,
    tasks.map((t) => t())
  );
}

export async function notifyMortalAboutReaction(
  ctx: EssentialContext,
  threadMessage: PersistentThreadMessage,
  _from: "angel",
  emoji: string | undefined
) {
  if (!threadMessage.originChatId || !threadMessage.originMessageId) {
    return;
  }

  await ctx.api.setMessageReaction(
    threadMessage.originChatId,
    threadMessage.originMessageId,
    emoji ? [Emoji.intoReactionType(emoji)] : []
  );
}
