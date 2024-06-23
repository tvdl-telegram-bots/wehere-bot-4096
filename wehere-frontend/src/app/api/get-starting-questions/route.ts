import { Result$GetTemplates$WehereBackend } from "wehere-backend/src/app/api/get-templates/typing";
import { createJsonResponse } from "wehere-backend/src/lib/backend/utils";
import type { TemplateKey } from "wehere-bot/src/typing/common";
import { doesExist } from "wehere-bot/src/utils/array";
import { SERVER_ENV } from "wehere-frontend/src/env/server";
import { withDefaultRouteHandler } from "wehere-frontend/src/utils/backend";
import { getUrl, httpGet } from "wehere-frontend/src/utils/shared";

import type {
  Result$GetStartingQuestions as Result,
  StartingQuestion,
} from "./typing";

export const GET = withDefaultRouteHandler(async (_request) => {
  const data = await httpGet(
    getUrl(SERVER_ENV.WEHERE_BACKEND_ORIGIN, "/api/get-templates")
  ).then(Result$GetTemplates$WehereBackend.parse);

  const toStartingQuestion = (
    promptKey: TemplateKey,
    answerKey: TemplateKey
  ): StartingQuestion | undefined => {
    const promptTemplate = data.templates.find((t) => t.key === promptKey);
    const answerTemplate = data.templates.find((t) => t.key === answerKey);
    if (!promptTemplate || !answerTemplate) return undefined;
    return {
      prompt: {
        key: promptKey,
        text: promptTemplate.text,
        entities: promptTemplate.entities,
      },
      answer: {
        key: answerKey,
        text: answerTemplate.text,
        entities: answerTemplate.entities,
      },
    };
  };

  const result: Result = {
    questions: [
      toStartingQuestion(
        "starting_question_1_prompt",
        "starting_question_1_answer"
      ),
      toStartingQuestion(
        "starting_question_2_prompt",
        "starting_question_2_answer"
      ),
      toStartingQuestion(
        "starting_question_3_prompt",
        "starting_question_3_answer"
      ),
      toStartingQuestion(
        "starting_question_4_prompt",
        "starting_question_4_answer"
      ),
    ].filter(doesExist),
  };

  return createJsonResponse(200, result);
});
