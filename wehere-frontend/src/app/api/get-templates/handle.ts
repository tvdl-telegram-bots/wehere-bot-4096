import { Result$GetTemplates$WehereBackend } from "wehere-backend/src/app/api/get-templates/typing";
import type { TemplateKey } from "wehere-bot/src/typing/common";
import type { PersistentTemplate } from "wehere-bot/src/typing/server";
import { doesExist } from "wehere-bot/src/utils/array";
import { SERVER_ENV } from "wehere-frontend/src/env/server";
import type {
  StartingQuestion,
  Template,
} from "wehere-frontend/src/typing/common";
import { getUrl, httpGet } from "wehere-frontend/src/utils/shared";

import type { Result$GetTemplates as Result } from "./typing";

function toTemplate(
  templates: PersistentTemplate[],
  key: TemplateKey
): Template | undefined {
  const t = templates.find((t) => t.key === key);
  if (!t) return undefined;
  return { key: t.key, text: t.text, entities: t.entities };
}

function toStartingQuestion(
  templates: PersistentTemplate[],
  promptKey: TemplateKey,
  answerKey: TemplateKey
): StartingQuestion | undefined {
  const prompt = toTemplate(templates, promptKey);
  const answer = toTemplate(templates, answerKey);
  if (!prompt || !answer) return undefined;
  return { prompt, answer };
}

export async function handle$GetTemplates(): Promise<Result> {
  const data = await httpGet(
    getUrl(SERVER_ENV.WEHERE_BACKEND_ORIGIN, "/api/get-templates"),
    {
      cache: "force-cache",
      next: {
        revalidate: 60, // https://nextjs.org/docs/app/api-reference/functions/fetch#optionsnextrevalidate
      },
    }
  ).then(Result$GetTemplates$WehereBackend.parse);

  const welcomeMessage = toTemplate(data.templates, "welcome_message");
  const aboutDescription = toTemplate(data.templates, "about_description");

  const connectionRemarks = {
    whenAvailable: toTemplate(
      data.templates,
      "connection_remarks_when_available"
    ),
    whenUnavailable: toTemplate(
      data.templates,
      "connection_remarks_when_unavailable"
    ),
  };

  const startingQuestions = [
    toStartingQuestion(
      data.templates,
      "starting_question_1_prompt",
      "starting_question_1_answer"
    ),
    toStartingQuestion(
      data.templates,
      "starting_question_2_prompt",
      "starting_question_2_answer"
    ),
    toStartingQuestion(
      data.templates,
      "starting_question_3_prompt",
      "starting_question_3_answer"
    ),
    toStartingQuestion(
      data.templates,
      "starting_question_4_prompt",
      "starting_question_4_answer"
    ),
  ].filter(doesExist);

  return {
    welcomeMessage,
    aboutDescription,
    connectionRemarks,
    startingQuestions,
  };
}
