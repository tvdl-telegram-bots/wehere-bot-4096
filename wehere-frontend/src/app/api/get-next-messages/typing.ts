import { ThreadMessage } from "wehere-frontend/src/typing/common";
import { z } from "zod";

export type Params$GetNextMessages = z.input<typeof Params$GetNextMessages>;
export const Params$GetNextMessages = z.object({
  threadId: z.string(),
  threadPassword: z.string().nullish(),
  after: z.coerce.number(),
});

export type Result$GetNextMessages = z.input<typeof Result$GetNextMessages>;
export const Result$GetNextMessages = z.object({
  messages: ThreadMessage.array(),
});
