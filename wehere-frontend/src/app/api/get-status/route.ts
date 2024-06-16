import { Result$GetStatus$WehereBackend } from "wehere-backend/src/app/api/get-status/typing";
import { createJsonResponse } from "wehere-backend/src/lib/backend/utils";
import { SERVER_ENV } from "wehere-frontend/src/env/server";
import { withDefaultRouteHandler } from "wehere-frontend/src/utils/backend";
import { getUrl, httpGet } from "wehere-frontend/src/utils/shared";

import type { Result$GetStatus as Result } from "./typing";

export const GET = withDefaultRouteHandler(async () => {
  const data = await httpGet(
    getUrl(SERVER_ENV.WEHERE_BACKEND_ORIGIN, "/api/get-status"),
    { cache: "no-cache" }
  ).then(Result$GetStatus$WehereBackend.parse);

  const result: Result = {
    availability: {
      type: data.availability.value ? "available" : "unavailable",
      since: data.availability.since,
    },
    pusherClientConfig: data.pusherClientConfig,
  };
  return createJsonResponse(200, result);
});
