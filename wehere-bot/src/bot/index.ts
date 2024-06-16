import { autoRetry } from "@grammyjs/auto-retry";
import { apiThrottler } from "@grammyjs/transformer-throttler";
import { Fluent } from "@moebius/fluent";
import { Api, Bot, GrammyError, HttpError } from "grammy";
import type { Db } from "mongodb";
import { MongoClient } from "mongodb";
import Pusher from "pusher";
import type { BotContext, Command, I18n } from "wehere-bot/src/types";
import {
  PusherOptions,
  type Env,
  type Ftl,
} from "wehere-bot/src/typing/common";
import { assert, nonNullable } from "wehere-bot/src/utils/assert";

import AngelSay from "./commands/AngelSay";
import Availability from "./commands/Availability";
import MortalSay from "./commands/MortalSay";
import Reply from "./commands/Reply";
import Start from "./commands/Start";
import Subscribe from "./commands/Subscribe";
import { getRole } from "./operations/role_";

export async function createDb(
  env: Env
): Promise<[db: Db, close: (force?: boolean) => Promise<void>]> {
  console.log("Connecting to:", env.MONGODB_URI);
  const client = await MongoClient.connect(env.MONGODB_URI);
  const db = client.db(env.MONGODB_DBNAME);
  console.log("Connected. The db is:", env.MONGODB_DBNAME);
  return [db, client.close.bind(client)];
}

export async function createI18n(ftl: Ftl): Promise<I18n> {
  const fluent = new Fluent();
  await fluent.addTranslation({ locales: "en", source: ftl.en });
  await fluent.addTranslation({ locales: "vi", source: ftl.vi });
  return { withLocale: fluent.withLocale.bind(fluent) };
}

export async function createPusher(env: Env): Promise<Pusher> {
  const url = new URL(env.PUSHER_URI);
  assert(url.protocol === "pusher:");

  const options = PusherOptions.parse({
    appId: url.searchParams.get("appId"),
    key: url.searchParams.get("key"),
    secret: url.searchParams.get("secret"),
    cluster: url.searchParams.get("cluster"),
    useTLS: url.searchParams.get("useTLS"),
  });

  return new Pusher(options);
}

export async function createApi(env: Env): Promise<Api> {
  const api = new Api(env.TELEGRAM_BOT_TOKEN);
  api.config.use(apiThrottler());
  api.config.use(autoRetry());
  return api;
}

export async function createBot(
  telegramBotToken: string,
  { db, i18n, pusher }: { db: Db; i18n: I18n; pusher: Pusher }
): Promise<Bot<BotContext>> {
  const bot = new Bot<BotContext>(telegramBotToken);

  bot.use(async (ctx, next) => {
    ctx.db = db;
    ctx.i18n = i18n;
    ctx.withLocale = i18n.withLocale;
    ctx.pusher = pusher;
    await next();
  });

  bot.api.config.use(apiThrottler());
  bot.api.config.use(autoRetry());

  const commands: Command[] = [Start, Subscribe, Reply, Availability];

  for (const c of commands) {
    if (c.middleware) {
      bot.use(c.middleware);
    }
  }

  for (const c of commands) {
    if (c.handleMessage) {
      bot.command(c.commandName, c.handleMessage);
    }
  }

  bot.on("callback_query:data", async (ctx) => {
    const url = new URL(ctx.callbackQuery.data);
    assert(url.protocol === "wehere:", "invalid protocol");

    for (const c of commands) {
      if (!c.handleCallbackQuery) continue;
      if (url.pathname !== "/" + c.commandName) continue;
      return await c.handleCallbackQuery(ctx);
    }

    ctx.reply("Unknown callback query");
  });

  bot.on("message::bot_command", async (ctx) => {
    ctx.reply("Unknown command");
  });

  bot.on("message", async (ctx) => {
    const msg0 = nonNullable(ctx.message);
    const role = await getRole(ctx, msg0.from.id);
    if (role === "mortal") {
      return await MortalSay.handleMessage(ctx);
    } else {
      return await AngelSay.handleMessage(ctx);
    }
  });

  bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
      console.error("Error in request:", e.description);
    } else if (e instanceof HttpError) {
      console.error("Could not contact Telegram:", e);
    } else {
      console.error("Unknown error:", e);
    }
  });

  return bot;
}
