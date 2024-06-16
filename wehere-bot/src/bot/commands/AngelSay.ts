import { InlineKeyboard } from "grammy";
import type { Message } from "grammy/types";
import type { Db, WithoutId } from "mongodb";
import type { Command } from "wehere-bot/src/types";
import type {
  PersistentObjectId,
  PersistentThreadMessage,
} from "wehere-bot/src/typing/server";
import { nonNullable } from "wehere-bot/src/utils/assert";
import {
  withDefaultErrorHandler,
  withReplyHtml,
} from "wehere-bot/src/utils/error";
import { isMessagePlainText } from "wehere-bot/src/utils/format";
import { getWehereUrl } from "wehere-bot/src/utils/parse";

import { getAngelSubscription } from "../operations/angel";
import { createMessage, notifyNewMessage } from "../operations/message_";
import { getThread_givenThreadId } from "../operations/thread_";

function isMessageTooComplexForWeb(msg0: Message) {
  return msg0.entities?.some(
    (ent) =>
      ![
        "url",
        "bold",
        "italic",
        "underline",
        "strikethrough",
        "code",
        "pre",
        "text_link",
      ].includes(ent.type)
  );
}

async function isMortalUsingWeb(
  ctx: { db: Db },
  { threadId }: { threadId: PersistentObjectId }
) {
  const thread = await getThread_givenThreadId(ctx, threadId) //
    .catch(() => undefined);
  return thread?.platform === "web";
}

const sayYouAreNotSubscribing = withReplyHtml((ctx) =>
  ctx.replyHtml(ctx.t("html-you-not-subscribing"), {
    reply_markup: new InlineKeyboard().text(
      ctx.t("text-subscribe"),
      getWehereUrl(["subscription", "subscribe"])
    ),
  })
);

const sayYouAreNotReplyingAnyone = withReplyHtml((ctx) =>
  ctx.replyHtml(ctx.t("html-not-replying-anyone"))
);

const sayYouAreSendingComplexMessage = withReplyHtml((ctx) =>
  ctx.replyHtml(ctx.t("html-can-only-send-plaintext"))
);

function composeMessage({
  threadId,
  msg0: msg0,
}: {
  threadId: PersistentObjectId;
  msg0: Message;
}): WithoutId<PersistentThreadMessage> {
  const message: WithoutId<PersistentThreadMessage> = {
    threadId,
    direction: "from_angel",
    originChatId: msg0.chat.id,
    originMessageId: msg0.message_id,
    text: msg0.text,
    entities: msg0.entities,
    plainText: isMessagePlainText(msg0),
    createdAt: Date.now(),
  };

  return message;
}

const handleMessage = withDefaultErrorHandler(async (ctx) => {
  const msg0 = nonNullable(ctx.message);
  const angelSub = await getAngelSubscription(ctx, { chatId: msg0.chat.id });

  if (!angelSub) {
    await sayYouAreNotSubscribing(ctx);
    return;
  }

  if (!angelSub.replyingToThreadId) {
    await sayYouAreNotReplyingAnyone(ctx);
    return;
  }

  const threadId = angelSub.replyingToThreadId;
  const message = composeMessage({ threadId, msg0 });
  const persistentThreadMessage = await createMessage(ctx, { message });
  await notifyNewMessage(ctx, { message: persistentThreadMessage });

  if (!isMessagePlainText(msg0) && isMessageTooComplexForWeb(msg0)) {
    if (await isMortalUsingWeb(ctx, { threadId })) {
      await sayYouAreSendingComplexMessage(ctx);
    }
  }
});

const AngelSay = {
  commandName: "angel_say",
  handleMessage,
} satisfies Command;

export default AngelSay;
