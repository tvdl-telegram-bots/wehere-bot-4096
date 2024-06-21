import type { BotContext, Command } from "../types";
import { assert, nonNullable } from "../utils/assert";
import type { InjectedContext$WithTranslate } from "../utils/error";
import { withReplyHtml } from "../utils/error";

export class CommandBuilder {
  public readonly commandName: string;
  public readonly routes: Record<string, (ctx: BotContext) => Promise<void>>;

  constructor(commandName: string) {
    this.commandName = commandName;
    this.routes = {};
  }

  route(
    route: string,
    handler: (ctx: BotContext & InjectedContext$WithTranslate) => void
  ) {
    assert(route.startsWith("/"));
    this.routes[route] = withReplyHtml(handler);
  }

  build(): Command {
    return {
      commandName: this.commandName,
      handleMessage: this.routes["/"] || undefined,
      handleCallbackQuery: async (ctx) => {
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
      },
    };
  }
}
