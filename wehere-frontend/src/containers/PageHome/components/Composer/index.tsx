import { PaperPlaneIcon } from "@radix-ui/react-icons";
import { Box, Button, Flex, TextArea } from "@radix-ui/themes";
import cx from "clsx";
import React from "react";
import { flex } from "wehere-frontend/src/utils/frontend";

import styles from "./index.module.scss";

type Props = {
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  onSubmit?: (text: string) => void;
};

export default function Composer({
  className,
  style,
  disabled,
  onSubmit,
}: Props) {
  const [text, setText] = React.useState("");

  const submit = async () => {
    if (!text.trim().length) return;
    await Promise.resolve(onSubmit?.(text));
    setText("");
  };

  return (
    <Flex
      className={cx(styles.container, className)}
      style={style}
      align="stretch"
      gap="2"
    >
      <Box {...flex.soft} asChild>
        <TextArea
          size="3" // must be >=16px to avoid iOS from zooming on focus
          value={text}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
      </Box>
      <Box {...flex.hard} width="64px" height="64px" asChild>
        <Button disabled={disabled || !text.trim().length} onClick={submit}>
          <PaperPlaneIcon style={{ transform: "scale(1.5)" }} />
        </Button>
      </Box>
    </Flex>
  );
}
