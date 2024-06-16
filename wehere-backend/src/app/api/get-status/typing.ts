import { Timestamp } from "wehere-bot/src/typing/common";
import { z } from "zod";

export type Result$GetStatus$WehereBackend = z.infer<
  typeof Result$GetStatus$WehereBackend
>;
export const Result$GetStatus$WehereBackend = z.object({
  availability: z.object({
    value: z.boolean(),
    since: Timestamp.nullish(),
  }),
});
