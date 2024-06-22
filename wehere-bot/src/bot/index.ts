import { autoRetry } from "@grammyjs/auto-retry";
import { apiThrottler } from "@grammyjs/transformer-throttler";
import { Fluent } from "@moebius/fluent";
import { Api, Bot, GrammyError, HttpError } from "grammy";
import type { Db } from "mongodb";
import { MongoClient, ObjectId } from "mongodb";
import Pusher from "pusher";
import type { BotContext, Command, I18n } from "wehere-bot/src/types";
import {
  PusherOptions,
  type Env,
  type Ftl,
} from "wehere-bot/src/typing/common";
import { assert, nonNullable } from "wehere-bot/src/utils/assert";

import { PersistentTinyurl } from "../typing/server";

import AngelSay from "./commands/AngelSay";
import Availability from "./commands/Availability";
import MortalSay from "./commands/MortalSay";
import Reply from "./commands/Reply";
import Start from "./commands/Start";
import Subscription from "./commands/Subscription";
import Template from "./commands/Template";
import { getRole } from "./operations/role";

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
    ctx.pusher = pusher;
    await next();
  });

  bot.api.config.use(apiThrottler());
  bot.api.config.use(autoRetry());

  const commands: Command[] = [
    Start,
    Reply,
    Availability,
    Subscription,
    Template,
  ];

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

  // NOTE: it seems that assert messages here are not sent to users
  bot.on("callback_query:data", async (ctx) => {
    let url = new URL(ctx.callbackQuery.data);

    if (url.protocol === "wehere+tinyurl:") {
      const resolvedUrl = await ctx.db
        .collection("tinyurl")
        .findOne(ObjectId.createFromHexString(url.host))
        .then((doc) => PersistentTinyurl.parse(doc).url);
      url = new URL(resolvedUrl);
    }

    assert(url.protocol === "wehere:", "invalid protocol");
    ctx.url = url;

    if (url.host) {
      const command = commands.find((c) => c.commandName === url.host);
      assert(command, "command not found");
      assert(command.handleCallbackQuery, "command has no handler");
      await command.handleCallbackQuery(ctx);
    } else {
      assert(url.pathname.startsWith("/"), "invalid pathname");
      const pathSegments = url.pathname.split("/");
      const command = commands.find((c) => c.commandName === pathSegments[1]);
      assert(command, "command not found");
      assert(command.handleCallbackQuery, "command has no handler");
      await command.handleCallbackQuery(ctx);
    }
  });

  bot.on("message::bot_command", async (ctx) => {
    if (ctx.msg.text?.startsWith("/sub")) {
      ctx.reply("Did you mean /subscription?");
    } else {
      ctx.reply("Unknown command");
    }
  });

  bot.on("message", async (ctx) => {
    const msg0 = nonNullable(ctx.message);
    const role = await getRole(ctx, msg0.from.id);
    if (role === "mortal") {
      return await MortalSay.handleMessage(ctx);
    } else {
      return await AngelSay.handleMessage?.(ctx);
    }
  });

  bot.catch((err) => {
    if (err.error === false) return;
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
