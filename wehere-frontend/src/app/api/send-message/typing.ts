import { z } from "zod";

export type Params$SendMessage = z.infer<typeof Params$SendMessage>;
export const Params$SendMessage = z.object({
  threadId: z.string(),
  threadPassword: z.string(),
  text: z.string(),
});
