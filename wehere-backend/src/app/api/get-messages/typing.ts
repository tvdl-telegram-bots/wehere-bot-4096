import { Timestamp } from "wehere-bot/src/typing/common";
import {
  PersistentObjectId,
  PersistentThreadMessage,
} from "wehere-bot/src/typing/server";
import { z } from "zod";

export type Params$GetMessages$WehereBackend = z.input<
  typeof Params$GetMessages$WehereBackend
>;
export const Params$GetMessages$WehereBackend = z.object({
  // select
  threadId: PersistentObjectId,
  threadPassword: z.string().nullish(),
  // filter
  since: z.coerce.number().nullish(), // >=
  after: z.coerce.number().nullish(), // >
  prior: z.coerce.number().nullish(), // <
  until: z.coerce.number().nullish(), // <=

  // order & limit
  order: z.enum(["asc", "des"]).nullish(),
  limit: z.coerce.number().nullish(),
});

export type Result$GetMessages$WehereBackend = z.input<
  typeof Result$GetMessages$WehereBackend
>;
export const Result$GetMessages$WehereBackend = z.object({
  messages: PersistentThreadMessage.array(),
  nextCursor: Timestamp.nullable(),
});
