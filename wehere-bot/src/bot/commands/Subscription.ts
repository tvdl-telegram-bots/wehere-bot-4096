import { InlineKeyboard } from "grammy";
import type { BotContext, Command } from "wehere-bot/src/types";
import type { UserId } from "wehere-bot/src/typing/common";
import { PersistentThread } from "wehere-bot/src/typing/server";
import { nonNullable } from "wehere-bot/src/utils/assert";
import {
  withDefaultErrorHandler,
  withReplyHtml,
} from "wehere-bot/src/utils/error";
import { formatThread, html } from "wehere-bot/src/utils/format";
import { getWehereUrl } from "wehere-bot/src/utils/parse";

import {
  getAngelSubscription,
  setAngelSubscription,
} from "../operations/angel";
import { getRole } from "../operations/role";

const COMMAND_NAME = "subscription";
const ACTION_SUBSCRIBE = "subscribe";
const ACTION_UNSUBSCRIBE = "unsubscribe";
const ACTION_RENEW = "renew";

const sayYouAreNotSubscribing = withReplyHtml((ctx) =>
  ctx.replyHtml(ctx.t("html-you-not-subscribing"), {
    reply_markup: new InlineKeyboard().text(
      ctx.t("text-subscribe"),
      getWehereUrl([COMMAND_NAME, ACTION_SUBSCRIBE])
    ),
  })
);

const sayYouAreNotReplyingAnyone = withReplyHtml((ctx) =>
  ctx.replyHtml(ctx.t("html-you-subscribed-but-replying"), {
    reply_markup: new InlineKeyboard().text(
      ctx.t("text-unsubscribe"),
      getWehereUrl([COMMAND_NAME, ACTION_UNSUBSCRIBE])
    ),
  })
);

const sayYouAreReplyingToThread = withReplyHtml(
  (ctx, thread: PersistentThread) =>
    ctx.replyHtml(
      ctx.t(
        "html-you-subscribed-and-replying-to",
        { thread: html.strong(html.literal(formatThread(thread))) } //
      ),
      {
        reply_markup: new InlineKeyboard()
          .text(
            ctx.t("text-stop-replying", { thread: formatThread(thread) }),
            getWehereUrl([COMMAND_NAME, ACTION_RENEW])
          )
          .text(
            ctx.t("text-unsubscribe"),
            getWehereUrl([COMMAND_NAME, ACTION_UNSUBSCRIBE])
          ),
      }
    )
);

const sayYouAreNotAngel = withReplyHtml((ctx, userId: UserId) =>
  ctx.replyHtml(
    ctx.t(
      "html-you-not-angel",
      { user: html.strong(userId.toString()) } //
    )
  )
);

const sayYouSubscribed = withReplyHtml((ctx) =>
  ctx.replyHtml(ctx.t("html-alright-you-subscribing"), {
    reply_markup: new InlineKeyboard().text(
      ctx.t("text-unsubscribe"),
      getWehereUrl([COMMAND_NAME, ACTION_UNSUBSCRIBE])
    ),
  })
);

const sayYouUnsubscribed = withReplyHtml((ctx) =>
  ctx.replyHtml(ctx.t("html-done-you-unsubscribed"), {
    reply_markup: new InlineKeyboard().text(
      ctx.t("text-subscribe"),
      getWehereUrl([COMMAND_NAME, ACTION_SUBSCRIBE])
    ),
  })
);

const sayYouStoppedReplying = withReplyHtml((ctx) =>
  ctx.replyHtml(ctx.t("html-alright-you-stopped-replying"), {
    reply_markup: new InlineKeyboard().text(
      ctx.t("text-unsubscribe"),
      getWehereUrl([COMMAND_NAME, ACTION_UNSUBSCRIBE])
    ),
  })
);

async function checkAngelRole(ctx: BotContext) {
  const from = nonNullable(ctx.from);
  const role = await getRole(ctx, from.id);
  if (role === "mortal") {
    await sayYouAreNotAngel(ctx, from.id);
    throw false;
  }
}

const handleMessage = withDefaultErrorHandler(async (ctx) => {
  await checkAngelRole(ctx);

  const chat = nonNullable(ctx.chat);
  const angelSub = await getAngelSubscription(ctx, { chatId: chat.id });
  if (!angelSub) {
    await sayYouAreNotSubscribing(ctx);
    throw false;
  } else if (!angelSub.replyingToThreadId) {
    await sayYouAreNotReplyingAnyone(ctx);
    throw false;
  }

  const thread = await ctx.db
    .collection("thread")
    .findOne(angelSub.replyingToThreadId)
    .then((doc) => PersistentThread.parse(doc));
  return sayYouAreReplyingToThread(ctx, thread);
});

async function handleSubscribe(ctx: BotContext) {
  await checkAngelRole(ctx);
  const chat = nonNullable(ctx.chat);
  await setAngelSubscription(
    ctx,
    { chatId: chat.id },
    { replyingToThreadId: null }
  );
  await sayYouSubscribed(ctx);
}

async function handleUnsubscribe(ctx: BotContext) {
  await checkAngelRole(ctx);
  const chat = nonNullable(ctx.chat);
  await setAngelSubscription(ctx, { chatId: chat.id }, null);
  await sayYouUnsubscribed(ctx);
}

async function handleRenew(ctx: BotContext) {
  await checkAngelRole(ctx);
  const chat = nonNullable(ctx.chat);
  await setAngelSubscription(
    ctx,
    { chatId: chat.id },
    { replyingToThreadId: null }
  );
  await sayYouStoppedReplying(ctx);
}

const handleCallbackQuery = withDefaultErrorHandler(async (ctx) => {
  const data = nonNullable(ctx.callbackQuery?.data);
  const url = new URL(data);
  const pathSegments = url.pathname.split("/");
  if (pathSegments.length === 2) {
    await handleMessage(ctx);
  } else if (pathSegments.length === 3) {
    switch (pathSegments[2]) {
      case ACTION_SUBSCRIBE:
        return await handleSubscribe(ctx);
      case ACTION_UNSUBSCRIBE:
        return await handleUnsubscribe(ctx);
      case ACTION_RENEW:
        return await handleRenew(ctx);
    }
  } else {
    throw new Error("invalid pathname");
  }
});

const Subscription = {
  commandName: COMMAND_NAME,
  handleMessage,
  handleCallbackQuery,
} satisfies Command;

export default Subscription;
