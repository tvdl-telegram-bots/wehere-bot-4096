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
import { isMessagePlainText } from "wehere-bot/src/utils/format";
import { getWehereTinyurl, getWehereUrlV2 } from "wehere-bot/src/utils/parse";

import { getAngelSubscription } from "../operations/angel";
import {
  createDeadMessage,
  createMessage,
  notifyNewMessage,
} from "../operations/message";
import { getThread_givenThreadId } from "../operations/thread_";

const $ = new CommandBuilder("angel_say");

async function checkAngelSubscription(
  ctx: BotContext$CommandBuilder
): Promise<PersistentAngelSubscription> {
  const chat = nonNullable(ctx.chat);
  const angelSubscription = await getAngelSubscription(ctx, {
    chatId: chat.id,
  });
  if (angelSubscription) return angelSubscription;
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
  angelSubscription: PersistentAngelSubscription
): Promise<ObjectId> {
  const targetThreadId = angelSubscription.replyingToThreadId;
  if (targetThreadId) return targetThreadId;

  const msg0 = nonNullable(ctx.message);
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
  const angelSubscription = await checkAngelSubscription(ctx);
  const threadId = await checkTargetThreadId(ctx, angelSubscription);
  const message = composeMessage({ threadId, msg0 });
  const persistentThreadMessage = await createMessage(ctx, { message });
  await notifyNewMessage(ctx, { message: persistentThreadMessage });
  await warnIfMessageTooComplexForWeb(ctx, threadId);
});

const AngelSay = $.build();
export default AngelSay;
