import { InlineKeyboard } from "grammy";
import { CommandBuilder } from "wehere-bot/src/classes/CommandBuilder";
import type { BotContext } from "wehere-bot/src/types";
import {
  PersistentObjectId,
  PersistentTemplate,
} from "wehere-bot/src/typing/server";
import { doesExist } from "wehere-bot/src/utils/array";
import { nonNullable } from "wehere-bot/src/utils/assert";
import type { InjectedContext$WithTranslate } from "wehere-bot/src/utils/error";
import { html } from "wehere-bot/src/utils/format";
import { getWehereTinyurl } from "wehere-bot/src/utils/parse";

import { getRole } from "../operations/role";
import {
  getTemplate,
  setTemplate_fromDeadMessage,
} from "../operations/template";

const $ = new CommandBuilder("template");

async function checkAngelRole(ctx: BotContext & InjectedContext$WithTranslate) {
  const from = nonNullable(ctx.from);
  const role = await getRole(ctx, from.id);
  if (role !== "mortal") return;
  ctx.replyHtml(ctx.t("html-you-not-angel", { user: html.literal(from.id) }));
  throw false;
}

function formatKey(
  ctx: InjectedContext$WithTranslate,
  key: PersistentTemplate["key"]
) {
  switch (key) {
    case "auto_reply_when_available":
      return ctx.t("text-template-auto-reply-when-available");
    case "auto_reply_when_unavailable":
      return ctx.t("text-template-auto-reply-when-unavailable");
  }
}

const KEYS: PersistentTemplate["key"][] = [
  "auto_reply_when_available",
  "auto_reply_when_unavailable",
];

$.route("/", async (ctx) => {
  await checkAngelRole(ctx);
  await ctx.replyHtml(html.i(ctx.t("html-list-of-templates")));

  const persistentTemplates = await Promise.all(
    KEYS.map((key) => getTemplate(ctx, key))
  ).then((list) => list.filter(doesExist));

  if (!persistentTemplates.length) {
    await ctx.replyHtml(html.i(ctx.t("html-no-templates")));
    return;
  }

  for (const t of persistentTemplates) {
    const msg1 = await ctx.replyHtml(
      html.b(html.literal(formatKey(ctx, t.key)))
    );
    await ctx.replyHtml(t.text || "", {
      entities: t.entities || undefined,
      reply_parameters: { message_id: msg1.message_id },
    });
  }
});

$.route("/from_dead_message", async (ctx) => {
  await checkAngelRole(ctx);
  const url = nonNullable(ctx.url);
  const deadMessageId = PersistentObjectId.parse(url.searchParams.get("id"));

  const keys: PersistentTemplate["key"][] = [
    "auto_reply_when_available",
    "auto_reply_when_unavailable",
  ];

  await ctx.replyHtml("Dùng làm", {
    reply_markup: InlineKeyboard.from(
      await Promise.all(
        keys.map(async (key) => [
          InlineKeyboard.text(
            formatKey(ctx, key),
            await getWehereTinyurl(ctx, "template", "/use_dead_message", {
              id: deadMessageId,
              key,
            })
          ),
        ])
      )
    ),
  });
});

$.route("/use_dead_message", async (ctx) => {
  const url = nonNullable(ctx.url);
  const deadMessageId = PersistentObjectId.parse(url.searchParams.get("id"));
  const key = PersistentTemplate.shape.key.parse(url.searchParams.get("key"));
  await setTemplate_fromDeadMessage(ctx, { key, deadMessageId });
  ctx.replyHtml("Đã đặt.");
});

const Template = $.build();
export default Template;
