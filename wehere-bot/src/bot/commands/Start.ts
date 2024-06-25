import { InlineKeyboard } from "grammy";
import { getThread_givenMortalChatId } from "wehere-bot/src/bot/operations/thread_";
import type { Command } from "wehere-bot/src/types";
import type { TemplateKey, UserId } from "wehere-bot/src/typing/common";
import type { PersistentThread } from "wehere-bot/src/typing/server";
import { doesExist } from "wehere-bot/src/utils/array";
import { nonNullable } from "wehere-bot/src/utils/assert";
import {
  withDefaultErrorHandler,
  withReplyHtml,
} from "wehere-bot/src/utils/error";
import { formatThread, html } from "wehere-bot/src/utils/format";
import { getWehereTinyurl, getWehereUrlV2 } from "wehere-bot/src/utils/parse";

import { getRole } from "../operations/role";
import { readTemplate } from "../operations/template";

import Availability from "./Availability";
import Subscription from "./Subscription";

// TODO: add set_role
const sayHelloFirstUser = withReplyHtml((ctx, userId: UserId) =>
  ctx.replyHtml(ctx.t("html-hello-you-alone", { user: html.literal(userId) }), {
    reply_markup: new InlineKeyboard().text(
      ctx.t("html-make-me-an-admin"),
      getWehereUrlV2("set_role", "/", { user: userId, role: "admin" })
    ),
  })
);

const sayHelloAdmin = withReplyHtml((ctx, userId: UserId) =>
  ctx.replyHtml(ctx.t("html-hello-admin", { user: html.literal(userId) }))
);

const sayHelloAngel = withReplyHtml((ctx, userId: UserId) =>
  ctx.replyHtml(ctx.t("html-hello-angel", { user: html.literal(userId) }))
);

const sayHelloMortal = withReplyHtml(async (ctx, thread: PersistentThread) => {
  const toButton = async (promptKey: TemplateKey, answerKey: TemplateKey) => {
    const template = await readTemplate(ctx, promptKey);
    if (!template?.text) return undefined;
    const url = await getWehereTinyurl(ctx, "template", "/reply_mortal", {
      key: answerKey,
    });
    return InlineKeyboard.text(template.text, url);
  };

  const buttons = await Promise.all([
    toButton("starting_question_1_prompt", "starting_question_1_answer"),
    toButton("starting_question_2_prompt", "starting_question_2_answer"),
    toButton("starting_question_3_prompt", "starting_question_3_answer"),
    toButton("starting_question_4_prompt", "starting_question_4_answer"),
  ]).then((array) => array.filter(doesExist));

  await ctx.replyHtml(
    ctx.t("html-hello-mortal", { user: html.literal(formatThread(thread)) }),
    {
      reply_markup: buttons.length
        ? InlineKeyboard.from(buttons.map((b) => [b]))
        : undefined,
    }
  );
});

const handleMessage = withDefaultErrorHandler(async (ctx) => {
  const from = nonNullable(ctx.from);
  const role = await getRole(ctx, from.id);

  switch (role) {
    case "admin": {
      await sayHelloAdmin(ctx, from.id);
      await Availability.handleMessage(ctx);
      await Subscription.handleMessage?.(ctx);
      break;
    }
    case "angel": {
      await sayHelloAngel(ctx, from.id);
      await Availability.handleMessage(ctx);
      await Subscription.handleMessage?.(ctx);
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
