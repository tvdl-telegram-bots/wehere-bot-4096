import {
  Result$GetMessages$WehereBackend,
  type Params$GetMessages$WehereBackend,
} from "wehere-backend/src/app/api/get-messages/typing";
import { createJsonResponse } from "wehere-backend/src/lib/backend/utils";
import { SERVER_ENV } from "wehere-frontend/src/env/server";
import { withDefaultRouteHandler } from "wehere-frontend/src/utils/backend";
import { getUrl, httpGet } from "wehere-frontend/src/utils/shared";

import type { Result$GetPrevMessages } from "./typing";
import { Params$GetPrevMessages } from "./typing";

export const GET = withDefaultRouteHandler(async (request) => {
  const url = new URL(request.url);
  const params = Params$GetPrevMessages.parse({
    threadId: url.searchParams.get("threadId"),
    threadPassword: url.searchParams.get("threadPassword"),
    currentSince: url.searchParams.get("currentSince"),
  });

  const data = await httpGet(
    getUrl(SERVER_ENV.WEHERE_BACKEND_ORIGIN, "/api/get-messages", {
      threadId: params.threadId,
      threadPassword: params.threadPassword,
      prior: params.currentSince,
    } satisfies Params$GetMessages$WehereBackend)
  ).then(Result$GetMessages$WehereBackend.parse);

  const result: Result$GetPrevMessages = {
    messages: data.messages
      .map((m) => ({
        direction: m.direction,
        text: m.text,
        createdAt: m.createdAt,
      }))
      .sort((a, b) => a.createdAt - b.createdAt),
  };

  return createJsonResponse(200, result);
});
