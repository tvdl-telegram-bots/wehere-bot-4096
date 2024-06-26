import { InlineKeyboard } from "grammy";
import type { BotContext$CommandBuilder } from "wehere-bot/src/classes/CommandBuilder";
import { CommandBuilder } from "wehere-bot/src/classes/CommandBuilder";
import { nonNullable } from "wehere-bot/src/utils/assert";
import { html } from "wehere-bot/src/utils/format";
import { getWehereUrlV2 } from "wehere-bot/src/utils/parse";
import { z } from "zod";

import { getAvailability, setAvailability } from "../operations/availability";
import { getRole } from "../operations/role";

const $ = new CommandBuilder("availability");

async function checkAngelRole(ctx: BotContext$CommandBuilder) {
  const from = nonNullable(ctx.from);
  const role = await getRole(ctx, from.id);
  if (role !== "mortal") return;
  await ctx.replyHtml(
    ctx.t("html-you-not-angel", { user: html.literal(from.id) })
  );
  throw false;
}

function getInlineKeyboard(
  ctx: BotContext$CommandBuilder,
  params: { theOppositeValue: boolean }
): InlineKeyboard {
  return InlineKeyboard.from([
    [
      params.theOppositeValue
        ? InlineKeyboard.text(
            ctx.t("text-set-available"),
            getWehereUrlV2("availability", "/set", { value: true })
          )
        : InlineKeyboard.text(
            ctx.t("text-set-unavailable"),
            getWehereUrlV2("availability", "/set", { value: false })
          ),
    ],
  ]);
}

$.route("/", async (ctx) => {
  await checkAngelRole(ctx);
  const availability = await getAvailability(ctx);

  await ctx.replyHtml(
    availability.value
      ? ctx.t("html-we-are-available")
      : ctx.t("html-we-are-unavailable"),
    {
      reply_markup: getInlineKeyboard(ctx, {
        theOppositeValue: !availability.value,
      }),
    }
  );
});

$.route("/set", async (ctx) => {
  await checkAngelRole(ctx);
  const url = nonNullable(ctx.url);
  const Boolean = z
    .enum(["true", "false"])
    .transform((value) => value === "true");
  const value = Boolean.parse(url.searchParams.get("value"));
  await setAvailability(ctx, { value });
  await ctx.replyHtml(
    value
      ? ctx.t("html-we-are-available") //
      : ctx.t("html-we-are-unavailable"),
    {
      reply_markup: getInlineKeyboard(ctx, {
        theOppositeValue: !value,
      }),
    }
  );
});

const Availability = $.build();
export default Availability;
