import { ObjectId } from "mongodb";
import {
  assertWithStatus,
  throws400,
} from "wehere-backend/src/lib/backend/errors";
import {
  createJsonResponse,
  withDefaultRouteHandler,
} from "wehere-backend/src/lib/backend/utils";
import { toPipeline } from "wehere-backend/src/utils/pipeline";
import { getThread_givenThreadId } from "wehere-bot/src/bot/operations/thread";
import { PersistentThreadMessage } from "wehere-bot/src/typing/server";
import { parseDocs } from "wehere-bot/src/utils/array";
import { z } from "zod";

const Params = z.object({
  // select
  threadId: z.string(),
  threadPassword: z.string().nullish(),
  // filter
  since: z.coerce.number().nullish(), // >=
  after: z.coerce.number().nullish(), // >
  prior: z.coerce.number().nullish(), // <
  until: z.coerce.number().nullish(), // <=

  // order & limit
  order: z.enum(["asc", "des"]).nullish(),
  limit: z.coerce.number().nullish(),
});

export const GET = withDefaultRouteHandler(async (request, ctx) => {
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams.entries());
  const params = await Params.parseAsync(query).catch(throws400);
  const threadId = ObjectId.createFromHexString(params.threadId);
  const thread = await getThread_givenThreadId(ctx, threadId);

  assertWithStatus(404, thread, "thread not found");
  if (thread.password) {
    assertWithStatus(401, params.threadPassword, "password required");
    assertWithStatus(
      403,
      params.threadPassword === thread.password,
      "password mismatched"
    );
  }

  const messages = await ctx.db
    .collection("thread_message")
    .aggregate(
      toPipeline(function* () {
        const { since, after, prior, until, order, limit } = params;
        yield { $match: { threadId } };
        yield since ? { $match: { createdAt: { $gte: since } } } : undefined;
        yield after ? { $match: { createdAt: { $gt: after } } } : undefined;
        yield prior ? { $match: { createdAt: { $lt: prior } } } : undefined;
        yield until ? { $match: { createdAt: { $lte: until } } } : undefined;
        yield order === "asc" ? { $sort: { createdAt: +1 } } : undefined;
        yield order === "des" ? { $sort: { createdAt: -1 } } : undefined;
        yield { $limit: limit || 10 };
      })
    )
    .toArray()
    .then(parseDocs(PersistentThreadMessage));

  return createJsonResponse(200, { messages });
});
