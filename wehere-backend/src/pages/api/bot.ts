import { MongoClient } from "mongodb";
import type { NextApiRequest, NextApiResponse } from "next";
import { ENV, FTL } from "wehere-backend/src/env";
import { createBot, webhookCallback } from "wehere-bot";
import { createDb, createI18n, createPusher } from "wehere-bot/src/bot";
import {
  formatErrorAsObject,
  formatErrorDeeply,
} from "wehere-bot/src/utils/format";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const [db] = await createDb(ENV);
    const i18n = await createI18n(FTL);
    const pusher = await createPusher(ENV);
    const bot = await createBot(ENV.TELEGRAM_BOT_TOKEN, { db, i18n, pusher });
    await webhookCallback(bot, "next-js", {
      // https://core.telegram.org/bots/api#setwebhook
      // https://grammy.dev/ref/core/webhookoptions#secrettoken
      secretToken: ENV.TELEGRAM_BOT_API_SECRET_TOKEN || undefined,
    })(req, res);
  } catch (error) {
    console.error(formatErrorDeeply(error));
    res.status(299).json(formatErrorAsObject(error));

    // write error to db if possible
    try {
      const client = await MongoClient.connect(ENV.MONGODB_URI);
      const db = client.db(ENV.MONGODB_DBNAME);
      await db.collection("error").insertOne(formatErrorAsObject(error));
    } catch (error) {
      console.error(error);
    }
  }
}
