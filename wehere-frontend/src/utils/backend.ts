import {
  ErrorWithStatus,
  assertWithStatus,
} from "wehere-backend/src/lib/backend/errors";
import { createJsonResponse } from "wehere-backend/src/lib/backend/utils";
import { formatErrorAsObject } from "wehere-bot/src/utils/format";

export function withDefaultRouteHandler<Context>(
  handler: (request: Request, context: Context) => Promise<Response>
) {
  return async function (request: Request, context: Context) {
    try {
      if (request.method !== "GET") {
        assertWithStatus(
          400,
          request.headers.get("Content-Type") === "application/json",
          "invalid content-type"
        );
      }
      return await handler(request, context);
    } catch (error) {
      if (error instanceof ErrorWithStatus) {
        return createJsonResponse(
          error.status,
          formatErrorAsObject(error.cause)
        );
      } else {
        return createJsonResponse(500, formatErrorAsObject(error));
      }
    }
  };
}
