import type { Params$GetMessages$WehereBackend } from "wehere-backend/src/app/api/get-messages/typing";
import { Result$GetMessages$WehereBackend } from "wehere-backend/src/app/api/get-messages/typing";
import { createJsonResponse } from "wehere-backend/src/lib/backend/utils";
import { SERVER_ENV } from "wehere-frontend/src/env/server";
import { withDefaultRouteHandler } from "wehere-frontend/src/utils/backend";
import { getUrl, httpGet } from "wehere-frontend/src/utils/shared";

import type { Result$GetPrevMessages as Result } from "./typing";
import { Params$GetPrevMessages as Params } from "./typing";

export const GET = withDefaultRouteHandler(async (request) => {
  const url = new URL(request.url);
  const params = Params.parse({
    threadId: url.searchParams.get("threadId"),
    threadPassword: url.searchParams.get("threadPassword"),
    prior: url.searchParams.get("prior"),
  });

  const data = await httpGet(
    getUrl(SERVER_ENV.WEHERE_BACKEND_ORIGIN, "/api/get-messages", {
      threadId: params.threadId,
      threadPassword: params.threadPassword,
      prior: params.prior,
      order: "des",
    } satisfies Params$GetMessages$WehereBackend),
    { cache: "no-cache" }
  ).then(Result$GetMessages$WehereBackend.parse);

  const result: Result = {
    messages: data.messages.map((m) => ({
      direction: m.direction,
      text: m.text,
      entities: m.entities,
      createdAt: m.createdAt,
      emoji: m.direction === "from_mortal" ? m.angelEmoji : m.mortalEmoji,
    })),
  };

  return createJsonResponse(200, result);
});
