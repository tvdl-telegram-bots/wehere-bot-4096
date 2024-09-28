import type { Message } from "grammy/types";
import type { WithoutId } from "mongodb";
import type { Command } from "wehere-bot/src/types";
import type {
  PersistentThread,
  PersistentThreadMessage,
} from "wehere-bot/src/typing/server";
import { nonNullable } from "wehere-bot/src/utils/assert";
import { withDefaultErrorHandler } from "wehere-bot/src/utils/error";
import { isMessagePlainText } from "wehere-bot/src/utils/format";

import { autoReply, isAutoReplyNeeded } from "../operations/availability";
import { getChatLocale } from "../operations/chat_";
import {
  createMessage,
  getLastAddedEmoji,
  notifyAngelsAboutReaction,
  notifyNewMessage,
  readThreadMessage_givenSentMessage,
  updateMessageEmoji,
} from "../operations/message";
import { getThread_givenMortalChatId } from "../operations/thread";

function composeMessage({
  thread,
  message,
}: {
  thread: PersistentThread;
  message: Message;
}): WithoutId<PersistentThreadMessage> {
  return {
    threadId: thread._id,
    direction: "from_mortal",
    originChatId: message.chat.id,
    originMessageId: message.message_id,
    text: message.text,
    entities: message.entities,
    plainText: isMessagePlainText(message),
    createdAt: Date.now(),
  };
}

const handleMessage = withDefaultErrorHandler(async (ctx) => {
  const msg0 = nonNullable(ctx.message);
  const locale = await getChatLocale(ctx, msg0.chat.id);
  const thread = await getThread_givenMortalChatId(ctx, msg0.chat.id);
  const threadId = thread._id;
  const message = composeMessage({ thread, message: msg0 });
  const shouldAutoReply = await isAutoReplyNeeded(ctx, { threadId });
  const persistentThreadMessage = await createMessage(ctx, { message });
  await notifyNewMessage(ctx, {
    message: persistentThreadMessage,
    excludesChats: [msg0.chat.id],
  });
  shouldAutoReply && (await autoReply(ctx, { threadId, locale }));
});

const handleMessageReaction = withDefaultErrorHandler(async (ctx) => {
  const reaction = nonNullable(ctx.messageReaction);
  const threadMessage = await readThreadMessage_givenSentMessage(
    ctx,
    reaction.chat.id,
    reaction.message_id
  );
  if (!threadMessage || threadMessage.direction !== "from_angel") return;
  const emoji = getLastAddedEmoji(reaction.old_reaction, reaction.new_reaction);
  await updateMessageEmoji(ctx, threadMessage._id, "mortal", emoji);
  await notifyAngelsAboutReaction(ctx, threadMessage, "mortal", emoji);
});

const MortalSay = {
  commandName: "mortal_say",
  handleMessage,
  handleMessageReaction,
} satisfies Command;

export default MortalSay;
