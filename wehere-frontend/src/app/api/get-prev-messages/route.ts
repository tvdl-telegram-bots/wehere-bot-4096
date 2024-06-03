import { MessageDirection, Timestamp } from "wehere-bot/src/typing/common";
import { z } from "zod";

import { SERVER_ENV } from "../../../env/server";
import {
  getUrl,
  httpGet,
  withDefaultRouteHandler,
} from "../../../utils/backend";

import type { Result$GetPrevMessages } from "./typing";
import { Params$GetPrevMessages } from "./typing";

function createJsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body, null, 2), {
    status: status,
    headers: { "Content-Type": "application/json" },
  });
}

export const GET = withDefaultRouteHandler(async (request) => {
  const url = new URL(request.url);
  const params = Params$GetPrevMessages.parse({
    threadId: url.searchParams.get("threadId"),
    threadPassword: url.searchParams.get("threadPassword"),
    currentSince: url.searchParams.get("currentSince"),
  });

  const Message = z.object({
    direction: MessageDirection,
    text: z.string(),
    createdAt: Timestamp,
  });
  const Data = z.object({ messages: Message.array() });

  const data = await httpGet(
    getUrl(SERVER_ENV.WEHERE_BACKEND_ORIGIN, "/api/get-messages", {
      threadId: params.threadId,
      threadPassword: params.threadPassword,
      prior: params.currentSince.toString(),
    })
  ).then(Data.parse);

  const result: Result$GetPrevMessages = {
    messages: data.messages.map((m) => ({
      direction: m.direction,
      text: m.text,
      createdAt: m.createdAt,
    })),
  };

  return createJsonResponse(200, result);
});
