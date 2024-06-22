import { InlineKeyboard } from "grammy";
import { CommandBuilder } from "wehere-bot/src/classes/CommandBuilder";
import type { BotContext } from "wehere-bot/src/types";
import { TemplateKey } from "wehere-bot/src/typing/common";
import {
  PersistentObjectId,
  PersistentTemplate,
} from "wehere-bot/src/typing/server";
import { assert, nonNullable } from "wehere-bot/src/utils/assert";
import type { InjectedContext$WithTranslate } from "wehere-bot/src/utils/error";
import { html } from "wehere-bot/src/utils/format";
import { getWehereTinyurl } from "wehere-bot/src/utils/parse";

import { getRole } from "../operations/role";
import {
  deleteTemplate,
  getTemplates,
  readTemplate,
  setTemplate_fromDeadMessage,
} from "../operations/template";

const $ = new CommandBuilder("template");

async function checkAngelRole(ctx: BotContext & InjectedContext$WithTranslate) {
  const from = nonNullable(ctx.from);
  const role = await getRole(ctx, from.id);
  if (role !== "mortal") return;
  await ctx.replyHtml(
    ctx.t("html-you-not-angel", { user: html.literal(from.id) })
  );
  throw false;
}

function formatKey(
  ctx: InjectedContext$WithTranslate,
  key: PersistentTemplate["key"]
): string {
  switch (key) {
    case "auto_reply_when_available":
      return ctx.t("text-template-auto-reply-when-available");
    case "auto_reply_when_unavailable":
      return ctx.t("text-template-auto-reply-when-unavailable");
    case "starting_question_1_prompt":
      return ctx.t("text-template-starting-question-1-prompt");
    case "starting_question_1_answer":
      return ctx.t("text-template-starting-question-1-answer");
    case "starting_question_2_prompt":
      return ctx.t("text-template-starting-question-2-prompt");
    case "starting_question_2_answer":
      return ctx.t("text-template-starting-question-2-answer");
    case "starting_question_3_prompt":
      return ctx.t("text-template-starting-question-3-prompt");
    case "starting_question_3_answer":
      return ctx.t("text-template-starting-question-3-answer");
    case "starting_question_4_prompt":
      return ctx.t("text-template-starting-question-4-prompt");
    case "starting_question_4_answer":
      return ctx.t("text-template-starting-question-4-answer");
  }
}

$.route("/", async (ctx) => {
  await checkAngelRole(ctx);
  const persistentTemplates = await getTemplates(ctx);

  if (!persistentTemplates.length) {
    await ctx.replyHtml(html.i(ctx.t("html-no-templates")));
    return;
  }

  const buttons = [];
  const lines = [html.i(ctx.t("html-list-of-templates"))];
  for (const t of persistentTemplates) {
    lines.push("");
    lines.push(html.b(html.literal(formatKey(ctx, t.key))));
    lines.push(html.pre(html.literal(t.text || "")));
    buttons.push(
      InlineKeyboard.text(
        formatKey(ctx, t.key),
        await getWehereTinyurl(ctx, "template", "/select_template_key", {
          key: t.key,
        })
      )
    );
  }

  lines.push(ctx.t("html-below-actions-for-template-key"));

  await ctx.replyHtml(lines.join("\n"), {
    reply_markup: InlineKeyboard.from(buttons.map((b) => [b])),
  });
});

$.route("/select_template_key", async (ctx) => {
  await checkAngelRole(ctx);
  const url = nonNullable(ctx.url);
  const key = TemplateKey.parse(url.searchParams.get("key"));
  const template = await readTemplate(ctx, key);
  assert(template, "template not found");
  const msg1 = await ctx.replyHtml(
    [
      html.i(ctx.t("html-viewing-template")),
      html.b(formatKey(ctx, key)), //
    ].join("\n")
  );
  await ctx.api.sendMessage(nonNullable(ctx.chat).id, template.text || "", {
    entities: template.entities || undefined,
    reply_parameters: { message_id: msg1.message_id },
    reply_markup: new InlineKeyboard().text(
      ctx.t("text-delete-template"),
      await getWehereTinyurl(ctx, "template", "/delete_template_key", { key })
    ),
  });
});

$.route("/delete_template_key", async (ctx) => {
  await checkAngelRole(ctx);
  const url = nonNullable(ctx.url);
  const key = TemplateKey.parse(url.searchParams.get("key"));
  await deleteTemplate(ctx, key);
  await ctx.replyHtml(
    [
      html.i(ctx.t("html-deleted-template-successfully")),
      html.b(html.literal(formatKey(ctx, key))),
    ].join("\n")
  );
});

$.route("/reply_mortal", async (ctx) => {
  const url = nonNullable(ctx.url);
  const key = TemplateKey.parse(url.searchParams.get("key"));
  const template = await readTemplate(ctx, key);
  assert(template, "template not found");
  await ctx.api.sendMessage(nonNullable(ctx.chat).id, template.text || "", {
    entities: template.entities || undefined,
  });
});

$.route("/select_dead_message", async (ctx) => {
  await checkAngelRole(ctx);
  const url = nonNullable(ctx.url);
  const deadMessageId = PersistentObjectId.parse(url.searchParams.get("id"));

  const buttons = [];
  for (const key of Object.values(TemplateKey.Enum)) {
    buttons.push(
      InlineKeyboard.text(
        formatKey(ctx, key),
        await getWehereTinyurl(ctx, "template", "/use_dead_message", {
          id: deadMessageId,
          key,
        })
      )
    );
  }

  await ctx.replyHtml(html.i(ctx.t("html-use-dead-message-as")), {
    reply_markup: InlineKeyboard.from(buttons.map((b) => [b])),
  });
});

$.route("/use_dead_message", async (ctx) => {
  await checkAngelRole(ctx);
  const url = nonNullable(ctx.url);
  const deadMessageId = PersistentObjectId.parse(url.searchParams.get("id"));
  const key = PersistentTemplate.shape.key.parse(url.searchParams.get("key"));
  await setTemplate_fromDeadMessage(ctx, { key, deadMessageId });
  await ctx.replyHtml(
    [
      html.i(ctx.t("html-set-template-successfully")),
      html.b(html.literal(formatKey(ctx, key))),
    ].join("\n")
  );
});

const Template = $.build();
export default Template;
