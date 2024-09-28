import { Box } from "@radix-ui/themes";
import cx from "clsx";
import React from "react";
import Balloon from "wehere-frontend/src/containers/PageHome/components/Balloon";

import { getPieceDirection, type Piece } from "../../objects/Piece";

import styles from "./index.module.scss";

type Props = {
  className?: string;
  style?: React.CSSProperties;
  piece: Piece;
};

export default function PieceViewer({ className, style, piece }: Props) {
  return (
    <Box className={cx(styles.container, className)} style={style} py="2">
      <Balloon
        direction={getPieceDirection(piece)}
        text={piece.payload.text}
        entities={piece.payload.entities}
        emoji={piece.payload.emoji}
      />
    </Box>
  );
}
