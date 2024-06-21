import type { TranslationContext } from "@moebius/fluent";
import type { RawApi } from "grammy";
import type { BotContext } from "wehere-bot/src/types";

import { getChatLocale } from "../bot/operations/chat_";

import { nonNullable } from "./assert";
import { html } from "./format";

export function withDefaultErrorHandler(handler: (ctx: BotContext) => void) {
  return async (ctx: BotContext) => {
    try {
      await Promise.resolve(handler(ctx));
    } catch (error) {
      if (error === false) {
        return; // shortcut to gracefully stop
      }
      if (error instanceof Error) {
        const chatId = nonNullable(ctx.chat?.id);
        await ctx.api.sendMessage(
          chatId,
          html.pre(html.literal(error.message)),
          { parse_mode: "HTML" }
        );
      }
      throw error;
    }
  };
}

export type Translate = (path: string, context?: TranslationContext) => string;

export type ReplyHtml = RawApi["sendMessage"] extends (
  arg0: infer T0
) => Promise<infer R>
  ? (
      text: string,
      other?: Omit<T0, "chat_id" | "text" | "parse_mode">
    ) => Promise<R>
  : never;

export type InjectedContext$WithTranslate = {
  t: Translate;
  replyHtml: ReplyHtml;
};

export function withReplyHtml<OtherArgs extends unknown[]>(
  handler: (
    ctx: BotContext & InjectedContext$WithTranslate,
    ...otherArgs: OtherArgs
  ) => void
) {
  return async (ctx: BotContext, ...otherArgs: OtherArgs) => {
    const chat = nonNullable(ctx.chat);
    const locale = await getChatLocale(ctx, chat.id);
    const t = ctx.i18n.withLocale(locale);
    const replyHtml: ReplyHtml = (text, other) =>
      ctx.api.sendMessage(chat.id, text, { parse_mode: "HTML", ...other });
    await Promise.resolve(
      handler(Object.assign(ctx, { t, replyHtml }), ...otherArgs)
    );
  };
}
