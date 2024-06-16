import { InlineKeyboard } from "grammy";
import { getThread_givenMortalChatId } from "wehere-bot/src/bot/operations/thread_";
import type { Command } from "wehere-bot/src/types";
import type { UserId } from "wehere-bot/src/typing/common";
import type { PersistentThread } from "wehere-bot/src/typing/server";
import { nonNullable } from "wehere-bot/src/utils/assert";
import {
  withDefaultErrorHandler,
  withReplyHtml,
} from "wehere-bot/src/utils/error";
import { formatThread, html } from "wehere-bot/src/utils/format";
import { getWehereUrl } from "wehere-bot/src/utils/parse";

import { getRole } from "../operations/role";

import Subscription from "./Subscription";

// TODO: add set_role
const sayHelloFirstUser = withReplyHtml((ctx, userId: UserId) =>
  ctx.replyHtml(ctx.t("html-hello-you-alone", { user: html.literal(userId) }), {
    reply_markup: new InlineKeyboard().text(
      ctx.t("html-make-me-an-admin"),
      getWehereUrl("set_role", { user: userId, role: "admin" })
    ),
  })
);

const sayHelloAdmin = withReplyHtml((ctx, userId: UserId) =>
  ctx.replyHtml(ctx.t("html-hello-admin", { user: html.literal(userId) }))
);

const sayHelloAngel = withReplyHtml((ctx, userId: UserId) =>
  ctx.replyHtml(ctx.t("html-hello-angel", { user: html.literal(userId) }))
);

const sayHelloMortal = withReplyHtml((ctx, thread: PersistentThread) =>
  ctx.replyHtml(
    ctx.t("html-hello-mortal", { user: html.literal(formatThread(thread)) })
  )
);

const handleMessage = withDefaultErrorHandler(async (ctx) => {
  const from = nonNullable(ctx.from);
  const role = await getRole(ctx, from.id);

  switch (role) {
    case "admin": {
      await sayHelloAdmin(ctx, from.id);
      await Subscription.handleMessage(ctx);
      break;
    }
    case "angel": {
      await sayHelloAngel(ctx, from.id);
      await Subscription.handleMessage(ctx);
      break;
    }
    case "mortal": {
      const chat = nonNullable(ctx.chat);
      const thread = await getThread_givenMortalChatId(ctx, chat.id);
      await sayHelloMortal(ctx, thread);
      break;
    }
  }

  const admins = await ctx.db
    .collection("role")
    .find({ role: "admin" })
    .toArray();
  if (!admins.length) {
    await sayHelloFirstUser(ctx, from.id);
  }
});

const Start: Command = {
  commandName: "start",
  handleMessage,
};

export default Start;
