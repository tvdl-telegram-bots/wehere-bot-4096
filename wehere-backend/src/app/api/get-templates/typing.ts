import { PersistentTemplate } from "wehere-bot/src/typing/server";
import { z } from "zod";

export type Result$GetTemplates$WehereBackend = z.input<
  typeof Result$GetTemplates$WehereBackend
>;
export const Result$GetTemplates$WehereBackend = z.object({
  templates: PersistentTemplate.array(),
});
