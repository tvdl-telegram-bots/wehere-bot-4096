import { Result$GetStatus$WehereBackend } from "wehere-backend/src/app/api/get-status/typing";
import { SERVER_ENV } from "wehere-frontend/src/env/server";
import { getUrl, httpGet } from "wehere-frontend/src/utils/shared";

import type { Result$GetStatus as Result } from "./typing";

export async function handle$GetStatus(): Promise<Result> {
  const data = await httpGet(
    getUrl(SERVER_ENV.WEHERE_BACKEND_ORIGIN, "/api/get-status"),
    { cache: "no-cache" }
  ).then(Result$GetStatus$WehereBackend.parse);

  return {
    availability: {
      type: data.availability.value ? "available" : "unavailable",
      since: data.availability.since,
    },
    pusherClientConfig: data.pusherClientConfig,
    serverTimestamp: Date.now(),
  };
}
