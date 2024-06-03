import type { Db } from "mongodb";
import { ENV } from "wehere-backend/src/env";
import { createDb } from "wehere-bot/src/bot";
import { formatErrorAsObject } from "wehere-bot/src/utils/format";

import { ErrorWithStatus, assertWithStatus } from "./errors";
import type { RouteHandler } from "./types";

export function createJsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body, null, 2), {
    status: status,
    headers: { "Content-Type": "application/json" },
  });
}

export function withErrorHandling<OwnContext>(
  handler: RouteHandler<OwnContext>
): RouteHandler<OwnContext> {
  return async function (request: Request, context: OwnContext) {
    try {
      if (request.method !== "GET") {
        assertWithStatus(
          400,
          request.headers.get("Content-Type") === "application/json",
          "invalid content-type"
        );
      }
      return await handler(request, { ...context });
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

export type InjectedContext$WithDb = {
  db: Db;
};

export function withDb<OwnContext>(
  handler: RouteHandler<OwnContext & InjectedContext$WithDb>
): RouteHandler<OwnContext> {
  return async function (request: Request, context: OwnContext) {
    const [db, close] = await createDb(ENV);
    try {
      return await handler(request, { ...context, db });
    } finally {
      await close();
    }
  };
}

function isOriginAllowed(_origin: string) {
  return true;
}

export function withCors<OwnContext>(
  handler: RouteHandler<OwnContext>
): RouteHandler<OwnContext> {
  return async function (request: Request, context: OwnContext) {
    const origin = request.headers.get("Origin") || "";
    const response = await handler(request, context);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    if (isOriginAllowed(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
    }
    return response;
  };
}

export function withDefaultRouteHandler<OwnContext = { params: unknown }>(
  handler: RouteHandler<OwnContext & InjectedContext$WithDb>
): RouteHandler<OwnContext> {
  return withErrorHandling(withCors(withDb(handler)));
}
