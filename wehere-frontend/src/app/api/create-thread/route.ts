import { Result$CreateThread$WehereBackend } from "wehere-backend/src/app/api/create-thread/typing";
import {
  Result$SendMessage$WehereBackend,
  type Params$SendMessage$WehereBackend,
} from "wehere-backend/src/app/api/send-message/typing";
import { throws400 } from "wehere-backend/src/lib/backend/errors";
import { createJsonResponse } from "wehere-backend/src/lib/backend/utils";
import { Nonce } from "wehere-bot/src/typing/common";
import { nonNullable } from "wehere-bot/src/utils/assert";
import { SERVER_ENV } from "wehere-frontend/src/env/server";
import type { ThreadMessage } from "wehere-frontend/src/typing/common";
import { withDefaultRouteHandler } from "wehere-frontend/src/utils/backend";
import { getUrl, httpPost } from "wehere-frontend/src/utils/shared";

import type { Result$CreateThread as Result } from "./typing";
import { Params$CreateThread as Params } from "./typing";

// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#maxduration
export const maxDuration = 24;

export const POST = withDefaultRouteHandler(async (request) => {
  const params = await request.json().then(Params.parse).catch(throws400);
  const data_createThread = await httpPost(
    getUrl(SERVER_ENV.WEHERE_BACKEND_ORIGIN, "/api/create-thread"),
    {}
  ).then(Result$CreateThread$WehereBackend.parse);

  const sentMessages: ThreadMessage[] = [];
  for (const m of params.initialMessages) {
    const data_sendMessage = await httpPost(
      getUrl(SERVER_ENV.WEHERE_BACKEND_ORIGIN, "/api/send-message"),
      {
        text: m.text,
        threadId: data_createThread.thread._id.toHexString(),
        threadPassword: data_createThread.thread.password,
        nonce: Nonce.generate(),
      } satisfies Params$SendMessage$WehereBackend
    ).then(Result$SendMessage$WehereBackend.parse);
    sentMessages.push({
      type: "ThreadMessage",
      direction: data_sendMessage.persistentThreadMessage.direction,
      text: data_sendMessage.persistentThreadMessage.text,
      entities: data_sendMessage.persistentThreadMessage.entities,
      createdAt: data_sendMessage.persistentThreadMessage.createdAt,
      nonce: data_sendMessage.persistentThreadMessage.nonce,
    });
  }

  return createJsonResponse(200, {
    threadId: data_createThread.thread._id.toHexString(),
    threadPassword: data_createThread.thread.password,
    threadName: data_createThread.thread.name,
    threadEmoji: data_createThread.thread.emoji,
    threadCreatedAt: nonNullable(data_createThread.thread.createdAt),
    pusherChannelId: data_createThread.pusherSubscription.pusherChannelId,
    initialMessages: sentMessages,
  } satisfies Result);
});
