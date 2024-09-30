import { Flex } from "@radix-ui/themes";
import cx from "clsx";
import type { CSSProperties } from "react";
import React from "react";
import type {
  Emoji,
  Entities,
  MessageDirection,
} from "wehere-bot/src/typing/common";
import RichTextViewer from "wehere-frontend/src/containers/PageThreadV3/components/RichTextViewer";

import styles from "./index.module.scss";

const DIRECTION: Record<MessageDirection, string> = {
  from_angel: styles.direction_fromAngel,
  from_mortal: styles.direction_fromMortal,
};

type Props = {
  className?: string;
  style?: React.CSSProperties;
  direction: MessageDirection;
  text: string | null | undefined;
  entities: Entities | null | undefined;
  emoji?: Emoji | null | undefined;
  delay?: CSSProperties["animationDelay"];
};

export default function Balloon({
  className,
  style,
  direction,
  text,
  entities,
  emoji,
  delay,
}: Props) {
  return (
    <Flex
      className={cx(styles.container, className, DIRECTION[direction])}
      style={{ ...style, "--delay": delay } as CSSProperties}
    >
      <Flex className={styles.content}>
        <RichTextViewer
          text={text || ""}
          entities={entities || []}
          unstyled={["a", "b", "i", "p", "u"]}
        />
        {emoji ? (
          <Flex className={styles.emojiContainer}>{emoji}</Flex>
        ) : undefined}
      </Flex>
    </Flex>
  );
}
