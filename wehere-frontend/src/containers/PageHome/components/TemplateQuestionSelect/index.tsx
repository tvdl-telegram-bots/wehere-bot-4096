import {
  CheckCircledIcon,
  QuestionMarkCircledIcon,
} from "@radix-ui/react-icons";
import { Box, Button, Flex } from "@radix-ui/themes";
import cx from "clsx";
import React from "react";
import type { TemplateKey } from "wehere-bot/src/typing/common";
import RichTextViewer from "wehere-frontend/src/containers/PageThreadV3/components/RichTextViewer";
import type { StartingQuestion } from "wehere-frontend/src/typing/common";
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
            className={styles.button}
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
            <Flex minHeight="32px" align="center" py="1" asChild>
              <RichTextViewer
                className={styles.buttonLabel}
                text={q.prompt.text || ""}
                entities={q.prompt.entities || []}
                unstyled={["b", "i", "p", "u"]}
              />
            </Flex>
          </Button>
        </Box>
      ))}
    </Flex>
  );
}
