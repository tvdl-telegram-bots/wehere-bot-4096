import { Box, Flex } from "@radix-ui/themes";
import cx from "clsx";
import React from "react";
import type { MessageDirection } from "wehere-bot/src/typing/common";
import type * as Telegram from "wehere-bot/src/typing/telegram";

import { getPieceDirection, type Piece } from "../../objects/Piece";
import RichTextViewer from "../RichTextViewer";

import styles from "./index.module.scss";

type Props$Root = {
  className?: string;
  style?: React.CSSProperties;
  piece: Piece;
};

function Root({ className, style, piece }: Props$Root) {
  const direction = getPieceDirection(piece);

  switch (piece.type) {
    case "IncomingMessage":
    case "OutgoingMessage":
    case "ThreadMessage":
  }

  return (
    <Box className={cx(styles.Root, className)} style={style}>
      <Balloon
        direction={direction}
        text={piece.payload.text}
        entities={piece.payload.entities}
      />
    </Box>
  );
}

type Props$Balloon = {
  className?: string;
  style?: React.CSSProperties;
  direction: MessageDirection;
  text: string | null | undefined;
  entities: Telegram.MessageEntity[] | null | undefined;
};

function Balloon({
  className,
  style,
  direction,
  text,
  entities,
}: Props$Balloon) {
  const DIRECTION: Record<MessageDirection, string> = {
    from_angel: styles.direction_fromAngel,
    from_mortal: styles.direction_fromMortal,
  };

  return (
    <Flex
      className={cx(styles.Balloon, className, DIRECTION[direction])}
      style={style}
      direction="row"
      justify={
        direction === "from_mortal"
          ? "end"
          : direction === "from_angel"
            ? "start"
            : undefined
      }
    >
      <RichTextViewer
        className={styles.content}
        text={text || ""}
        entities={entities || []}
        unstyled={["a", "b", "i", "p", "u"]}
      />
    </Flex>
  );
}

const PieceViewer = Root;

export default PieceViewer;
