import { Box, Flex } from "@radix-ui/themes";
import cx from "clsx";
import React from "react";
import type { MessageDirection } from "wehere-bot/src/typing/common";

import { getPieceDirection, type Piece } from "../../objects/Piece";

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
      <Balloon direction={direction} text={piece.payload.text} />
    </Box>
  );
}

type Props$Balloon = {
  className?: string;
  style?: React.CSSProperties;
  direction: MessageDirection;
  text: string | null | undefined;
};

function Balloon({ className, style, direction, text }: Props$Balloon) {
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
      <Box className={styles.content}>{text}</Box>
    </Flex>
  );
}

const PieceViewer = Root;

export default PieceViewer;
