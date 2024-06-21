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
  baseUrl: string | string[],
  query: Record<string, string | number | boolean | null | undefined> = {}
) {
  const resolvedBaseUrl = Array.isArray(baseUrl)
    ? "wehere:/" + baseUrl.join("/")
    : baseUrl.startsWith("wehere:/")
      ? baseUrl
      : baseUrl.startsWith("/")
        ? "wehere:/" + baseUrl.slice(1)
        : "wehere:/" + baseUrl;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value != null) {
      search.append(key, value.toString());
    }
  }
  return search.size > 0
    ? resolvedBaseUrl + "?" + search.toString()
    : resolvedBaseUrl;
}
