import { StartingQuestion, Template } from "wehere-frontend/src/typing/common";
import { z } from "zod";

export type Result$GetTemplates = z.infer<typeof Result$GetTemplates>;
export const Result$GetTemplates = z.object({
  welcomeMessage: Template.nullish(),
  connectionRemarks: z.object({
    whenAvailable: Template.nullish(),
    whenUnavailable: Template.nullish(),
  }),
  startingQuestions: StartingQuestion.array(),
});
