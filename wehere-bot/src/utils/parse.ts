import type { Db, ObjectId } from "mongodb";

import { assert } from "./assert";

// type ParsedCallbackQueryData = {
//   scheme: "wehere:";
//   command: string;
//   query: Record<string, string>;
// };

// export function parseCallbackQueryData(data: string): ParsedCallbackQueryData {
//   const url = new URL(data);
//   assert(url.protocol === "wehere:", `invalid protocol`);
//   const matches = /^\/([a-z_]+)$/.exec(url.pathname);
//   assert(matches?.length, "invalid pathname");

//   return {
//     scheme: url.protocol,
//     command: matches[1],
//     query: Object.fromEntries(url.searchParams.entries()),
//   };
// }

type InputQuery = Record<
  string,
  ObjectId | string | number | boolean | null | undefined
>;

function toSearch(query: InputQuery) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value != null) {
      search.append(key, value.toString());
    }
  }
  return search.size ? "?" + search : "";
}

export function getWehereUrlV2(
  command: string,
  path: string = "",
  query: InputQuery = {}
) {
  assert(/^[a-z0-9_]+$/.test(command));
  assert(!path || path.startsWith("/"));
  return ["wehere://", command, path, toSearch(query)].join("");
}

/** Because InlineKeyboardButton only allows 64-character callback data,
 * sometimes, we must compress the url to a shorter format.
 *
 * The shortened format being used is `wehere+tinyurl://<ObjectId>`.
 */
export async function getWehereTinyurl(
  ctx: { db: Db },
  command: string,
  path: string = "",
  query: InputQuery = {}
): Promise<string> {
  const url = getWehereUrlV2(command, path, query);
  const doc = await ctx.db
    .collection("tinyurl")
    .findOneAndUpdate(
      { url },
      { $set: { updatedAt: Date.now() } },
      { upsert: true, returnDocument: "after" }
    );
  assert(doc, "doc not created");
  return `wehere+tinyurl://${doc._id}`;
}
