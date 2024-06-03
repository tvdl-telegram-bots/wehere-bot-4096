import type { WithoutId } from "mongodb";
import { ObjectId } from "mongodb";
import { ENV, FTL } from "wehere-backend/src/env";
import {
  assertWithStatus,
  throws400,
} from "wehere-backend/src/lib/backend/errors";
import { createJsonResponse } from "wehere-backend/src/lib/backend/utils";
import { withDefaultRouteHandler } from "wehere-backend/src/utils/handler";
import { createApi, createI18n, createPusher } from "wehere-bot/src/bot";
import {
  createMessage,
  notifyNewMessage,
} from "wehere-bot/src/bot/operations/message";
import { getThread_givenThreadId } from "wehere-bot/src/bot/operations/thread";
import type { PersistentThreadMessage } from "wehere-bot/src/typing/server";
import * as Telegram from "wehere-bot/src/typing/telegram";
import { z } from "zod";

const Params = z.object({
  threadId: z.string(),
  threadPassword: z.string().nullish(),
  text: z.string(),
  entities: Telegram.MessageEntity.array().nullish(),
});

export const POST = withDefaultRouteHandler(async (request, ctx) => {
  const api = await createApi(ENV);
  const i18n = await createI18n(FTL);
  const pusher = await createPusher(ENV);

  const params = await request.json().then(Params.parse).catch(throws400);
  const threadId = ObjectId.createFromHexString(params.threadId);
  const thread = await getThread_givenThreadId(ctx, threadId);
  assertWithStatus(404, thread, "thread not found");

  if (thread.password) {
    assertWithStatus(401, params.threadPassword, "password required");
    assertWithStatus(
      403,
      params.threadPassword === thread.password,
      "password mismatched"
    );
  }

  const message: WithoutId<PersistentThreadMessage> = {
    threadId: ObjectId.createFromHexString(params.threadId),
    direction: "from_mortal",
    originChatId: undefined,
    originMessageId: undefined,
    text: params.text,
    entities: params.entities,
    plainText: true,
    createdAt: Date.now(),
  };

  const persistentThreadMessage = await createMessage(ctx, { message });
  await notifyNewMessage(
    { ...ctx, api, i18n, pusher },
    { message: persistentThreadMessage }
  );

  return createJsonResponse(200, { persistentThreadMessage });
});
