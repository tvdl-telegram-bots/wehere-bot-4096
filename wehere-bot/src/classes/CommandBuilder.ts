import type { BotContext, Command } from "../types";
import { assert, nonNullable } from "../utils/assert";
import type { InjectedContext$WithTranslate } from "../utils/error";
import { withReplyHtml } from "../utils/error";

export type BotContext$CommandBuilder = BotContext &
  InjectedContext$WithTranslate;

export class CommandBuilder {
  public readonly commandName: string;
  public readonly routes: Record<string, (ctx: BotContext) => Promise<void>>;

  constructor(commandName: string) {
    this.commandName = commandName;
    this.routes = {};
  }

  route(
    route: "message_reaction" | `/${string}`,
    handler: (ctx: BotContext & InjectedContext$WithTranslate) => void
  ) {
    assert(route.startsWith("/") || route === "message_reaction");
    this.routes[route] = withReplyHtml(handler);
  }

  build(): Command {
    return {
      commandName: this.commandName,
      handleMessage: this.routes["/"] || undefined,
      handleMessageReaction: this.routes["message_reaction"] || undefined,
      handleCallbackQuery: async (ctx) => {
        if (ctx.url?.host) {
          const handler = this.routes[ctx.url.pathname || "/"];
          assert(handler, `invalid pathname: ${ctx.url.pathname}`);
          await Promise.resolve(handler(ctx));
        } else {
          const data = nonNullable(ctx.callbackQuery?.data);
          const url = new URL(data);
          const route = Object.keys(this.routes).find(
            (route) =>
              url.pathname === "/" + this.commandName + route ||
              (route === "/" && url.pathname === "/" + this.commandName)
          );
          const handler = route ? this.routes[route] : undefined;
          assert(handler, `invalid pathname: ${url.pathname}`);
          await Promise.resolve(handler(ctx));
        }
      },
    };
  }
}
