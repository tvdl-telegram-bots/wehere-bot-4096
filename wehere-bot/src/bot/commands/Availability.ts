import { InlineKeyboard } from "grammy";
import type { Command } from "wehere-bot/src/types";
import { assert, nonNullable } from "wehere-bot/src/utils/assert";
import { withDefaultErrorHandler } from "wehere-bot/src/utils/error";
import { parseCallbackQueryData } from "wehere-bot/src/utils/parse";
import { z } from "zod";

import { getAvailability, setAvailability } from "../operations/availability";
import { getChatLocale } from "../operations/chat_";
import { getRole } from "../operations/role";

const handleMessage = withDefaultErrorHandler(async (ctx) => {
  const msg0 = nonNullable(ctx.message);
  const role = await getRole(ctx, msg0.from.id);
  const locale = await getChatLocale(ctx, msg0.chat.id);

  if (role === "mortal") {
    ctx.api.sendMessage(
      msg0.chat.id,
      ctx.i18n.withLocale(locale)("html-forbidden"),
      { parse_mode: "HTML" }
    );
    return;
  }

  assert(["angel", "admin"].includes(role), "forbidden");
  const availability = await getAvailability(ctx);
  const messageBody = availability.value
    ? ctx.i18n.withLocale(locale)("html-we-are-available")
    : ctx.i18n.withLocale(locale)("html-we-are-unavailable");

  await ctx.api.sendMessage(msg0.chat.id, messageBody, {
    parse_mode: "HTML",
    reply_markup: new InlineKeyboard()
      .text(
        ctx.i18n.withLocale(locale)("html-set-available"),
        "wehere:/availability?value=true"
      )
      .text(
        ctx.i18n.withLocale(locale)("html-set-unavailable"),
        "wehere:/availability?value=false"
      ),
  });
});

const Params = z.object({
  value: z.enum(["true", "false"]).transform((value) => value === "true"),
});

const handleCallbackQuery = withDefaultErrorHandler(async (ctx) => {
  const msg0 = nonNullable(ctx.callbackQuery?.message);
  const data = nonNullable(ctx.callbackQuery?.data);
  const { query } = parseCallbackQueryData(data);
  const locale = await getChatLocale(ctx, msg0.chat.id);
  const params = Params.parse(query);
  await setAvailability(ctx, { value: params.value });

  const messageBody = params.value
    ? ctx.i18n.withLocale(locale)("html-we-are-available")
    : ctx.i18n.withLocale(locale)("html-we-are-unavailable");
  await ctx.api.sendMessage(
    msg0.chat.id, //
    messageBody,
    { parse_mode: "HTML" }
  );
});

const Availability = {
  commandName: "availability",
  handleMessage,
  handleCallbackQuery,
} satisfies Command;

export default Availability;
