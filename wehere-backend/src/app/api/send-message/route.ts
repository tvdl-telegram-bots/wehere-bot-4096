import type { WithoutId } from "mongodb";
import { ObjectId } from "mongodb";
import { ENV, FTL } from "wehere-backend/src/env";
import {
  createMessage,
  notifyNewMessage,
} from "wehere-bot/src/bot/operations/message";
import { getThread_givenThreadId } from "wehere-bot/src/bot/operations/thread";
import type { PersistentThreadMessage } from "wehere-bot/src/typing/server";
import * as Telegram from "wehere-bot/src/typing/telegram";
import { formatErrorAsObject } from "wehere-bot/src/utils/format";
import { z } from "zod";

import { createApi, createDb, createI18n, createPusher } from "@/bot";

export async function POST(request: Request): Promise<Response> {
  const [db, close] = await createDb(ENV);
  const api = await createApi(ENV);
  const i18n = await createI18n(FTL);
  const pusher = await createPusher(ENV);

  const responseHeaders = new Headers({
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": request.headers.get("Origin") || "",
    "Access-Control-Allow-Headers": "*",
  });

  try {
    if (request.headers.get("Content-Type") !== "application/json") {
      return new Response(
        JSON.stringify({ message: "invalid Content-Type" }, null, 2),
        { status: 400, headers: responseHeaders }
      );
    }

    const data = await request.json();
    const params = z
      .object({
        threadId: z.string(),
        threadPassword: z.string().nullish(),
        text: z.string(),
        entities: Telegram.MessageEntity.array().nullish(),
      })
      .parse(data);

    const thread = await getThread_givenThreadId(
      { db },
      ObjectId.createFromHexString(params.threadId)
    );

    if (!thread) {
      return new Response(
        JSON.stringify({ message: "thread not found" }), //
        { status: 404, headers: responseHeaders }
      );
    }

    if (thread.password && !params.threadPassword) {
      return new Response(
        JSON.stringify({ message: "password required" }), //
        { status: 401, headers: responseHeaders }
      );
    }

    if (thread.password && thread.password !== params.threadPassword) {
      return new Response(
        JSON.stringify({ message: "forbidden" }), //
        { status: 403, headers: responseHeaders }
      );
    }

    const message: WithoutId<PersistentThreadMessage> = {
      threadId: ObjectId.createFromHexString(params.threadId),
      direction: "from_mortal",
      originChatId: undefined,
      originMessageId: undefined,
      text: params.text,
      entities: params.entities,
      plainText: true,
      createdAt: Date.now(),
    };

    const persistentThreadMessage = await createMessage({ db }, { message });
    await notifyNewMessage(
      { db, api, i18n, pusher },
      { message: persistentThreadMessage }
    );

    return new Response(
      JSON.stringify({ persistentThreadMessage }, null, 2), //
      { status: 200, headers: responseHeaders }
    );
  } catch (error) {
    return new Response(
      JSON.stringify(formatErrorAsObject(error)), //
      { status: 500, headers: responseHeaders }
    );
  } finally {
    await close();
  }
}

export async function OPTIONS(request: Request): Promise<Response> {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": request.headers.get("Origin") || "",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
