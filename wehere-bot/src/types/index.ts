import type { Fluent } from "@moebius/fluent";
import type { Context, Middleware } from "grammy";
import type { Db } from "mongodb";

export type BotContext = Context & {
  db: Db;
  withLocale: Fluent["withLocale"];
};

export type Command = {
  commandName: string;
  middleware?: Middleware<BotContext>;
  handleMessage?: (ctx: BotContext) => Promise<void>;
  handleCallbackQuery?: (ctx: BotContext) => Promise<void>;
};
