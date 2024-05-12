import { MongoClient } from "mongodb";
import type { NextApiRequest, NextApiResponse } from "next";
import { createBot, webhookCallback, Env, Ftl } from "wehere-bot";
import en from "wehere-bot/dist/resources/locales/en.json";
import vi from "wehere-bot/dist/resources/locales/vi.json";
import {
  formatErrorAsObject,
  formatErrorDeeply,
} from "wehere-bot/src/utils/format";

export const ENV = Env.parse({
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  MONGODB_URI:
    process.env.MONGODB_URI ||
    decodeURIComponent(process.env.MONGODB_URI__URLENCODED || ""),
  MONGODB_DBNAME: process.env.MONGODB_DBNAME,
  PORT: process.env.PORT,
  HOST: process.env.HOST,
});

export const FTL = Ftl.parse({ en, vi });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const bot = await createBot(ENV, FTL);
    await webhookCallback(bot, "next-js")(req, res);
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
