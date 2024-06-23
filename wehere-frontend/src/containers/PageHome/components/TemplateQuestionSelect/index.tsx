import {
  CheckCircledIcon,
  QuestionMarkCircledIcon,
} from "@radix-ui/react-icons";
import { Box, Button, Flex } from "@radix-ui/themes";
import cx from "clsx";
import React from "react";
import type { TemplateKey } from "wehere-bot/src/typing/common";
import type { StartingQuestion } from "wehere-frontend/src/app/api/get-starting-questions/typing";
import RichTextViewer from "wehere-frontend/src/containers/PageThreadV3/components/RichTextViewer";
import { flex } from "wehere-frontend/src/utils/frontend";

import styles from "./index.module.scss";

type Props = {
  className?: string;
  style?: React.CSSProperties;
  questions: StartingQuestion[];
  onSelect?: (question: StartingQuestion) => void;
};

export default function StartingQuestionSelect({
  className,
  style,
  questions,
  onSelect,
}: Props) {
  const [openedQuestions, setOpenedQuestions] = React.useState<TemplateKey[]>(
    []
  );

  return (
    <Flex
      className={cx(styles.container, className)}
      style={style}
      wrap="wrap"
      gap="2"
    >
      {questions.map((q, index) => (
        <Box key={index} asChild {...flex.soft}>
          <Button
            variant="surface"
            color={openedQuestions.includes(q.prompt.key) ? "green" : undefined}
            onClick={() => {
              setOpenedQuestions((qs) => [...qs, q.prompt.key]);
              onSelect?.(q);
            }}
          >
            {openedQuestions.includes(q.prompt.key) ? (
              <CheckCircledIcon />
            ) : (
              <QuestionMarkCircledIcon />
            )}
            <RichTextViewer
              className={styles.buttonLabel}
              text={q.prompt.text || ""}
              entities={q.prompt.entities || []}
              unstyled={["b", "i", "p", "u"]}
            />
          </Button>
        </Box>
      ))}
    </Flex>
  );
}
