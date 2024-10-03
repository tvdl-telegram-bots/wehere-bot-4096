import { InlineKeyboard } from "grammy";
import type { Message } from "grammy/types";
import type { ObjectId, WithoutId } from "mongodb";
import type { BotContext$CommandBuilder } from "wehere-bot/src/classes/CommandBuilder";
import { CommandBuilder } from "wehere-bot/src/classes/CommandBuilder";
import type {
  PersistentAngelSubscription,
  PersistentThreadMessage,
} from "wehere-bot/src/typing/server";
import { nonNullable } from "wehere-bot/src/utils/assert";
import { html, isMessagePlainText } from "wehere-bot/src/utils/format";
import { getWehereTinyurl, getWehereUrlV2 } from "wehere-bot/src/utils/parse";

import { readAngelSubscription } from "../operations/angel";
import {
  createDeadMessage,
  createMessage,
  getLastAddedEmoji,
  notifyAngelsAboutReaction,
  notifyMortalAboutReaction,
  notifyNewMessage,
  notifyPusherAboutReaction,
  readThreadMessage_givenSentMessage,
  updateMessageEmoji,
} from "../operations/message";
import { getThread_givenThreadId } from "../operations/thread";

const $ = new CommandBuilder("angel_say");

async function checkAngelSubscription(
  ctx: BotContext$CommandBuilder
): Promise<PersistentAngelSubscription> {
  const chat = nonNullable(ctx.chat);
  const angel = await readAngelSubscription(ctx, { chatId: chat.id });
  if (angel) return angel;
  await ctx.replyHtml(ctx.t("html-you-not-subscribing"), {
    reply_markup: new InlineKeyboard().text(
      ctx.t("text-subscribe"),
      getWehereUrlV2("subscription", "/subscribe")
    ),
  });
  throw false;
}

async function checkTargetThreadId(
  ctx: BotContext$CommandBuilder,
  angel: PersistentAngelSubscription
): Promise<ObjectId> {
  const targetThreadId = angel.replyingToThreadId;
  if (targetThreadId) return targetThreadId;

  const msg0 = nonNullable(ctx.message);
  if (
    msg0.text?.startsWith("wehere:") &&
    msg0.entities?.some((entity) => entity.type === "pre")
  ) {
    const url = new URL(msg0.text);
    const obj = {
      host: url.host,
      pathname: url.pathname,
      searchParams: Object.fromEntries(url.searchParams.entries()),
    };
    await ctx.replyHtml(html.pre(html.literal(JSON.stringify(obj, null, 2))), {
      reply_markup: new InlineKeyboard().text(msg0.text),
    });
    throw false;
  }

  const persistentDeadMessage = await createDeadMessage(ctx, {
    message: {
      text: msg0.text,
      entities: msg0.entities,
      createdAt: Date.now(),
    },
  });

  await ctx.replyHtml(ctx.t("html-not-replying-anyone"));

  await ctx.replyHtml(ctx.t("html-below-actions-dead-message"), {
    reply_parameters: { message_id: msg0.message_id },
    reply_markup: new InlineKeyboard().text(
      ctx.t("text-use-as-template"),
      await getWehereTinyurl(ctx, "template", "/select_dead_message", {
        id: persistentDeadMessage._id,
      })
    ),
  });
  throw false;
}

function composeMessage({
  threadId,
  msg0: msg0,
}: {
  threadId: ObjectId;
  msg0: Message;
}): WithoutId<PersistentThreadMessage> {
  return {
    threadId,
    direction: "from_angel",
    originChatId: msg0.chat.id,
    originMessageId: msg0.message_id,
    text: msg0.text,
    entities: msg0.entities,
    plainText: isMessagePlainText(msg0),
    createdAt: Date.now(),
  };
}

const WEB_FRIENDLY_ENTITIES = [
  "url",
  "bold",
  "italic",
  "underline",
  "strikethrough",
  "code",
  "pre",
  "text_link",
];

async function warnIfMessageTooComplexForWeb(
  ctx: BotContext$CommandBuilder,
  threadId: ObjectId
) {
  const msg0 = nonNullable(ctx.message);
  if (!msg0.entities) return;
  if (msg0.entities.every((ent) => WEB_FRIENDLY_ENTITIES.includes(ent.type)))
    return;
  const thread = await getThread_givenThreadId(ctx, threadId) //
    .catch(() => undefined);
  if (thread?.platform !== "web") return;
  await ctx.replyHtml(ctx.t("html-can-only-send-plaintext"));
}

$.route("/", async (ctx) => {
  const msg0 = nonNullable(ctx.message);
  const angel = await checkAngelSubscription(ctx);
  const threadId = await checkTargetThreadId(ctx, angel);
  const message = composeMessage({ threadId, msg0 });
  const persistentThreadMessage = await createMessage(ctx, { message });
  await notifyNewMessage(ctx, { message: persistentThreadMessage });
  await warnIfMessageTooComplexForWeb(ctx, threadId);
});

$.route("message_reaction", async (ctx) => {
  const reaction = nonNullable(ctx.messageReaction);
  const threadMessage = await readThreadMessage_givenSentMessage(
    ctx,
    reaction.chat.id,
    reaction.message_id
  );
  if (!threadMessage || threadMessage.direction !== "from_mortal") return;
  const emoji = getLastAddedEmoji(reaction.old_reaction, reaction.new_reaction);
  await updateMessageEmoji(ctx, threadMessage._id, "angel", emoji);
  await notifyMortalAboutReaction(ctx, threadMessage, "angel", emoji);
  await notifyAngelsAboutReaction(ctx, threadMessage, "angel", emoji);
  await notifyPusherAboutReaction(ctx, threadMessage, emoji);
});

const AngelSay = $.build();
export default AngelSay;
