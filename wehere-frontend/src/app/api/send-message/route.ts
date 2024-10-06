import type { Params$SendMessage$WehereBackend } from "wehere-backend/src/app/api/send-message/typing";
import { Result$SendMessage$WehereBackend } from "wehere-backend/src/app/api/send-message/typing";
import { throws400 } from "wehere-backend/src/lib/backend/errors";
import { createJsonResponse } from "wehere-backend/src/lib/backend/utils";
import { SERVER_ENV } from "wehere-frontend/src/env/server";
import type { ThreadMessage } from "wehere-frontend/src/typing/common";
import { withDefaultRouteHandler } from "wehere-frontend/src/utils/backend";
import { getUrl, httpPost } from "wehere-frontend/src/utils/shared";

import type { Result$SendMessage as Result } from "./typing";
import { Params$SendMessage as Params } from "./typing";

export const POST = withDefaultRouteHandler(async (request, _ctx) => {
  const params = await request.json().then(Params.parse).catch(throws400);

  const data = await httpPost(
    getUrl(SERVER_ENV.WEHERE_BACKEND_ORIGIN, "/api/send-message"),
    {
      threadId: params.threadId,
      threadPassword: params.threadPassword,
      text: params.text,
      nonce: params.nonce,
    } satisfies Params$SendMessage$WehereBackend
  ).then(Result$SendMessage$WehereBackend.parse);

  const message: ThreadMessage = {
    type: "ThreadMessage",
    createdAt: data.persistentThreadMessage.createdAt,
    direction: data.persistentThreadMessage.direction,
    text: data.persistentThreadMessage.text,
    nonce: data.persistentThreadMessage.nonce,
  };

  return createJsonResponse(200, { message } satisfies Result);
});
