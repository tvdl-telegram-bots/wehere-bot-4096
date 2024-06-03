import { throws400 } from "wehere-backend/src/lib/backend/errors";
import { createJsonResponse } from "wehere-backend/src/lib/backend/utils";

import { SERVER_ENV } from "../../../env/server";
import {
  getUrl,
  httpPost,
  withDefaultRouteHandler,
} from "../../../utils/backend";

import { Params$SendMessage } from "./typing";

export const POST = withDefaultRouteHandler(async (request, ctx) => {
  const params = await request
    .json()
    .then(Params$SendMessage.parse)
    .catch(throws400);

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
