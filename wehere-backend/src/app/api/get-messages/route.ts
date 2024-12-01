import {
  assertWithStatus,
  throws400,
} from "wehere-backend/src/lib/backend/errors";
import { createJsonResponse } from "wehere-backend/src/lib/backend/utils";
import { withDefaultRouteHandler } from "wehere-backend/src/utils/handler";
import { toPipeline } from "wehere-backend/src/utils/pipeline";
import { getThread_givenThreadId } from "wehere-bot/src/bot/operations/thread";
import { PersistentThreadMessage } from "wehere-bot/src/typing/server";
import { parseDocs } from "wehere-bot/src/utils/array";

import type { Result$GetMessages$WehereBackend as Result } from "./typing";
import { Params$GetMessages$WehereBackend as Params } from "./typing";

export const dynamic = "force-dynamic";

function getCursorType(
  params: Params
): "since" | "after" | "until" | "prior" | undefined {
  switch (params.order) {
    case "asc":
      return params.after ? "after" : params.since ? "since" : undefined;
    case "des":
      return params.prior ? "prior" : params.until ? "until" : undefined;
    default:
      return undefined;
  }
}

export const GET = withDefaultRouteHandler(async (request, ctx) => {
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams.entries());
  const params = await Params.parseAsync(query).catch(throws400);
  const thread = await getThread_givenThreadId(ctx, params.threadId);

  assertWithStatus(404, thread, "thread not found");
  if (thread.password) {
    assertWithStatus(401, params.threadPassword, "password required");
    assertWithStatus(
      403,
      params.threadPassword === thread.password,
      "password mismatched"
    );
  }

  const limit = params.limit || 10;

  const messages = await ctx.db
    .collection("thread_message")
    .aggregate(
      toPipeline(function* () {
        const { since, after, prior, until, order } = params;
        yield { $match: { threadId: params.threadId } };
        yield since ? { $match: { createdAt: { $gte: since } } } : undefined;
        yield after ? { $match: { createdAt: { $gt: after } } } : undefined;
        yield prior ? { $match: { createdAt: { $lt: prior } } } : undefined;
        yield until ? { $match: { createdAt: { $lte: until } } } : undefined;
        yield order === "asc" ? { $sort: { createdAt: +1 } } : undefined;
        yield order === "des" ? { $sort: { createdAt: -1 } } : undefined;
        yield { $limit: limit };
      })
    )
    .toArray()
    .then(parseDocs(PersistentThreadMessage));

  const cursorType = getCursorType(params);

  if (
    !cursorType ||
    (messages.length < limit && params.order === "des") ||
    (!messages.length && params.order === "asc")
  ) {
    return createJsonResponse(200, {
      messages,
      nextCursor: null,
    } satisfies Result);
  } else {
    return createJsonResponse(200, {
      messages:
        cursorType === "after" || cursorType === "prior"
          ? messages
          : messages.slice(0, -1),
      nextCursor: messages[messages.length - 1].createdAt,
    } satisfies Result);
  }
});
