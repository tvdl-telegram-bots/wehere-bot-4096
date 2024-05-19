import type { Fluent } from "@moebius/fluent";
import type { Context, Middleware } from "grammy";
import type { Db } from "mongodb";
import type Pusher from "pusher";

export type I18n = {
  withLocale: Fluent["withLocale"];
};

export type BotContext = Context & {
  db: Db;
  /** @deprecated */
  withLocale: Fluent["withLocale"];
  i18n: I18n;
  pusher: Pusher;
};

export type Command = {
  commandName: string;
  middleware?: Middleware<BotContext>;
  handleMessage?: (ctx: BotContext) => Promise<void>;
  handleCallbackQuery?: (ctx: BotContext) => Promise<void>;
};
