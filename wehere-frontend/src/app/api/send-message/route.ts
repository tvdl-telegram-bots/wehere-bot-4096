import { throws400 } from "wehere-backend/src/lib/backend/errors";
import { createJsonResponse } from "wehere-backend/src/lib/backend/utils";
import { SERVER_ENV } from "wehere-frontend/src/env/server";
import { withDefaultRouteHandler } from "wehere-frontend/src/utils/backend";
import { getUrl, httpPost } from "wehere-frontend/src/utils/shared";

import { Params$SendMessage as Params } from "./typing";

export const POST = withDefaultRouteHandler(async (request, _ctx) => {
  const params = await request.json().then(Params.parse).catch(throws400);

  await httpPost(
    getUrl(SERVER_ENV.WEHERE_BACKEND_ORIGIN, "/api/send-message"),
    {
      threadId: params.threadId,
      threadPassword: params.threadPassword,
      text: params.text,
    }
  );

  return createJsonResponse(200, null);
});
