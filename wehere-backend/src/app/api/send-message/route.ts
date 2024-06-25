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
  autoReply,
  isAutoReplyNeeded,
} from "wehere-bot/src/bot/operations/availability";
import {
  createMessage,
  notifyNewMessage,
} from "wehere-bot/src/bot/operations/message";
import { getThread_givenThreadId } from "wehere-bot/src/bot/operations/thread_";
import type { PersistentThreadMessage } from "wehere-bot/src/typing/server";

import type { Result$SendMessage$WehereBackend as Result } from "./typing";
import { Params$SendMessage$WehereBackend as Params } from "./typing";

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

  const shouldAutoReply = await isAutoReplyNeeded(ctx, { threadId });
  const persistentThreadMessage = await createMessage(ctx, { message });
  await notifyNewMessage(
    { ...ctx, api, i18n, pusher },
    { message: persistentThreadMessage }
  );
  shouldAutoReply &&
    (await autoReply(
      { ...ctx, api, i18n, pusher },
      { threadId, locale: "vi" } // TODO: there is no language preference for web yet
    ));

  return createJsonResponse(200, { persistentThreadMessage } satisfies Result);
});
