import { Env, Ftl } from "wehere-bot";
import en from "wehere-bot/dist/resources/locales/en.json";
import vi from "wehere-bot/dist/resources/locales/vi.json";

export const ENV = Env.parse({
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  MONGODB_URI:
    process.env.MONGODB_URI ||
    decodeURIComponent(process.env.MONGODB_URI__URLENCODED || ""),
  MONGODB_DBNAME: process.env.MONGODB_DBNAME,
  PORT: process.env.PORT,
  HOST: process.env.HOST,
  PUSHER_URI:
    process.env.PUSHER_URI ||
    decodeURIComponent(process.env.PUSHER_URI__URLENCODED || ""),
});

export const FTL = Ftl.parse({ en, vi });
