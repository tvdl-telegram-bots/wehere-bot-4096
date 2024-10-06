import { ObjectId } from "mongodb";
import type { Command } from "wehere-bot/src/types";
import { assert, nonNullable } from "wehere-bot/src/utils/assert";
import { withDefaultErrorHandler } from "wehere-bot/src/utils/error";
import { formatThread, html } from "wehere-bot/src/utils/format";
import { z } from "zod";

import { getAngelLocale, setAngelSubscription } from "../operations/angel";
import { getThread_givenThreadId } from "../operations/thread";

const handleCallbackQuery = withDefaultErrorHandler(async (ctx) => {
  const msg0 = nonNullable(ctx.callbackQuery?.message);
  const data = nonNullable(ctx.callbackQuery?.data);
  const url = new URL(data);
  const threadId = ObjectId.createFromHexString(
    z.string().parse(url.searchParams.get("threadId"))
  );
  const thread = await getThread_givenThreadId(ctx, threadId);
  assert(thread, "thread not found");
  await setAngelSubscription(
    ctx,
    { chatId: msg0.chat.id },
    { replyingToThreadId: threadId, updatedAt: Date.now() }
  );

  const locale = await getAngelLocale(ctx, msg0.chat.id);
  await ctx.api.sendMessage(
    nonNullable(msg0.chat.id),
    ctx.i18n.withLocale(locale)("html-replying-to", {
      name: html.strong(formatThread(thread)),
    }),
    { parse_mode: "HTML" }
  );
});

const Reply: Command = {
  commandName: "reply",
  handleCallbackQuery,
};

export default Reply;
