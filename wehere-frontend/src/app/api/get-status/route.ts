import { createJsonResponse } from "wehere-backend/src/lib/backend/utils";
import { withDefaultRouteHandler } from "wehere-frontend/src/utils/backend";

import { handle$GetStatus } from "./handle";

export const GET = withDefaultRouteHandler(async () => {
  const result = await handle$GetStatus();
  return createJsonResponse(200, result);
});
