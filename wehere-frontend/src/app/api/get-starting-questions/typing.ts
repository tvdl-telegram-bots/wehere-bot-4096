import { Entities, TemplateKey } from "wehere-bot/src/typing/common";
import { z } from "zod";

export type StartingQuestion = z.infer<typeof StartingQuestion>;
export const StartingQuestion = z.object({
  prompt: z.object({
    key: TemplateKey,
    text: z.string().nullish(),
    entities: Entities.nullish(),
  }),
  answer: z.object({
    key: TemplateKey,
    text: z.string().nullish(),
    entities: Entities.nullish(),
  }),
});

export type Result$GetStartingQuestions = z.infer<
  typeof Result$GetStartingQuestions
>;
export const Result$GetStartingQuestions = z.object({
  questions: StartingQuestion.array(),
});
