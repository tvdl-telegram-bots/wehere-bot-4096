import { InlineKeyboard } from "grammy";
import type { Command } from "wehere-bot/src/types";
import { nonNullable } from "wehere-bot/src/utils/assert";
import { withDefaultErrorHandler } from "wehere-bot/src/utils/error";

import { setAngelSubscription } from "../operations/angel_";
import { getChatLocale } from "../operations/chat_";

const handler = withDefaultErrorHandler(async (ctx) => {
  const msg0 = nonNullable(ctx.msg);
  const locale = await getChatLocale(ctx, msg0.chat.id);

  await setAngelSubscription(
    ctx,
    { chatId: msg0.chat.id },
    { replyingToThreadId: null }
  );

  await ctx.api.sendMessage(
    msg0.chat.id,
    ctx.withLocale(locale)("html-alright-you-subscribing"),
    {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard().text(
        ctx.withLocale(locale)("text-unsubscribe"),
        "wehere:/unsubscribe"
      ),
    }
  );
});

const Subscribe: Command = {
  commandName: "subscribe",
  handleMessage: handler,
  handleCallbackQuery: handler,
  middleware: undefined,
};

export default Subscribe;
