import { ThreadMessage } from "wehere-frontend/src/typing/common";
import { z } from "zod";

export type Params$GetPrevMessages = z.infer<typeof Params$GetPrevMessages>;
export const Params$GetPrevMessages = z.object({
  threadId: z.string(),
  threadPassword: z.string().nullish(),
  prior: z.coerce.number(),
});

export type Result$GetPrevMessages = z.infer<typeof Result$GetPrevMessages>;
export const Result$GetPrevMessages = z.object({
  messages: ThreadMessage.array(),
});
