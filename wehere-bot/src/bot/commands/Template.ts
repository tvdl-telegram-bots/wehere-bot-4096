import { InlineKeyboard } from "grammy";
import type { InlineKeyboardButton } from "grammy/types";
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

type LayoutInfo = {
  row: number;
  col: number;
  label: string;
};

const TEMPLATE_KEY_LAYOUT_INFO: Record<TemplateKey, LayoutInfo> = {
  auto_reply_when_available: { row: 0, col: 0, label: "A1" },
  auto_reply_when_unavailable: { row: 0, col: 1, label: "A2" },
  starting_question_1_prompt: { row: 1, col: 0, label: "B1" },
  starting_question_1_answer: { row: 1, col: 1, label: "B2" },
  starting_question_2_prompt: { row: 1, col: 2, label: "B3" },
  starting_question_2_answer: { row: 1, col: 3, label: "B4" },
  starting_question_3_prompt: { row: 1, col: 4, label: "B5" },
  starting_question_3_answer: { row: 1, col: 5, label: "B6" },
  starting_question_4_prompt: { row: 1, col: 6, label: "B7" },
  starting_question_4_answer: { row: 1, col: 7, label: "B8" },
  welcome_message: { row: 2, col: 0, label: "C1" },
  connection_remarks_when_available: { row: 2, col: 1, label: "C2" },
  connection_remarks_when_unavailable: { row: 2, col: 2, label: "C3" },
  opengraph_title: { row: 2, col: 3, label: "C4" },
  opengraph_description: { row: 2, col: 4, label: "C5" },
};

async function getInlineKeyboardMarkup(
  toCallbackData: (key: TemplateKey, label: string) => Promise<string>
): Promise<InlineKeyboard> {
  const rows = Array.from(
    Object.values(TemplateKey.Enum),
    () => [] as InlineKeyboardButton[]
  );
  for (const key of Object.values(TemplateKey.Enum)) {
    const { row, col, label } = TEMPLATE_KEY_LAYOUT_INFO[key];
    const callbackData = await toCallbackData(key, label);
    rows[row][col] = InlineKeyboard.text(label, callbackData);
  }
  return InlineKeyboard.from(rows.filter((r) => r.length > 0));
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
    case "welcome_message":
      return ctx.t("text-template-welcome-message");
    case "connection_remarks_when_available":
      return ctx.t("text-template-connection-remarks-when-available");
    case "connection_remarks_when_unavailable":
      return ctx.t("text-template-connection-remarks-when-unavailable");
    case "opengraph_title":
      return ctx.t("text-template-opengraph-title");
    case "opengraph_description":
      return ctx.t("text-template-opengraph-description");
  }
}

$.route("/", async (ctx) => {
  await checkAngelRole(ctx);

  const lines = [
    html.i(ctx.t("html-list-of-templates")),
    "",
    ...Object.values(TemplateKey.Enum).map((key) =>
      [
        `(${TEMPLATE_KEY_LAYOUT_INFO[key].label})`,
        html.b(html.literal(formatKey(ctx, key))),
      ].join(" ")
    ),
    "",
    ctx.t("html-below-actions-for-template-key"),
  ];

  const keyboard = await getInlineKeyboardMarkup((key) =>
    getWehereTinyurl(ctx, "template", "/select_template_key", { key })
  );
  await ctx.replyHtml(lines.join("\n"), { reply_markup: keyboard });
});

$.route("/select_template_key", async (ctx) => {
  await checkAngelRole(ctx);
  const url = nonNullable(ctx.url);
  const key = TemplateKey.parse(url.searchParams.get("key"));
  const template = await readTemplate(ctx, key);

  if (!template) {
    await ctx.replyHtml(
      [html.b(formatKey(ctx, key)), ctx.t("html-template-not-set")].join("\n")
    );
    return;
  }

  const msg1 = await ctx.replyHtml(html.b(formatKey(ctx, key)));
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

  const lines = [
    html.i(ctx.t("html-use-dead-message-as")),
    "",
    ...Object.values(TemplateKey.Enum).map((key) =>
      [
        `(${TEMPLATE_KEY_LAYOUT_INFO[key].label})`,
        html.b(html.literal(formatKey(ctx, key))),
      ].join(" ")
    ),
  ];

  const keyboard = await getInlineKeyboardMarkup((key) =>
    getWehereTinyurl(ctx, "template", "/use_dead_message", {
      id: deadMessageId,
      key,
    })
  );
  await ctx.replyHtml(lines.join("\n"), { reply_markup: keyboard });
});

$.route("/use_dead_message", async (ctx) => {
  await checkAngelRole(ctx);
  const url = nonNullable(ctx.url);
  const deadMessageId = PersistentObjectId.parse(url.searchParams.get("id"));
  const key = PersistentTemplate.shape.key.parse(url.searchParams.get("key"));
  await setTemplate_fromDeadMessage(ctx, { key, deadMessageId });
  await ctx.replyHtml(
    [
      html.b(html.literal(formatKey(ctx, key))),
      ctx.t("html-set-template-successfully"),
    ].join("\n"),
    {
      reply_markup: new InlineKeyboard().text(
        ctx.t("text-view-template"),
        await getWehereTinyurl(ctx, "template", "/select_template_key", { key })
      ),
    }
  );
});

const Template = $.build();
export default Template;
