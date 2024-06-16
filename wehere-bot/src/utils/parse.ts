import { assert } from "./assert";

type ParsedCallbackQueryData = {
  scheme: "wehere:";
  command: string;
  query: Record<string, string>;
};

export function parseCallbackQueryData(data: string): ParsedCallbackQueryData {
  const url = new URL(data);
  assert(url.protocol === "wehere:", `invalid protocol`);
  const matches = /^\/([a-z_]+)$/.exec(url.pathname);
  assert(matches?.length, "invalid pathname");

  return {
    scheme: url.protocol,
    command: matches[1],
    query: Object.fromEntries(url.searchParams.entries()),
  };
}

export function getWehereUrl(
  command: string | string[],
  query: Record<string, string | number | boolean | null | undefined> = {}
) {
  const origin = `wehere:/`;
  const path = Array.isArray(command) ? command.join("/") : command;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value != null) {
      search.append(key, value.toString());
    }
  }
  return search.size > 0
    ? origin + path + "?" + search.toString()
    : origin + path;
}
