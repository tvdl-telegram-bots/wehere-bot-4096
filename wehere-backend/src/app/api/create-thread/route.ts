import { MongoClient } from "mongodb";
import { ENV } from "wehere-backend/src/env";
import { createPusherSubscription } from "wehere-bot/src/bot/operations/Pusher";
import { createThread } from "wehere-bot/src/bot/operations/Thread";
import { formatErrorAsObject } from "wehere-bot/src/utils/format";

export async function POST(request: Request): Promise<Response> {
  const client = await MongoClient.connect(ENV.MONGODB_URI);
  const db = client.db(ENV.MONGODB_DBNAME);

  try {
    const thread = await createThread({ db }, { platform: "web" });
    const pusherSubscription = await createPusherSubscription(
      { db },
      { threadId: thread._id }
    );

    return new Response(
      JSON.stringify({ thread, pusherSubscription }, null, 2), //
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": request.headers.get("Origin") || "",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify(formatErrorAsObject(error)), //
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  } finally {
    await client.close();
  }
}
