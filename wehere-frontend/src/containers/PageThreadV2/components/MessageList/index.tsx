import cx from "clsx";
import React from "react";
import type { ThreadState } from "wehere-frontend/src/containers/PageThread/classes/ThreadState";

import Pieces from "../Pieces";

import { useClientWidth } from "./hooks/useClientWidth";
import styles from "./index.module.scss";
import { getPieceTime, toSortedPieces } from "./utils";
import { getOptimalPieceWidth } from "./utils/ui";

type Props = {
  className?: string;
  style?: React.CSSProperties;
  threadState: ThreadState;
  fill: true;
};

export default function MessageList({ className, style, threadState }: Props) {
  const pieces = React.useMemo(
    () => toSortedPieces(threadState),
    [threadState]
  );
  const [container, setContainer] = React.useState<HTMLElement | null>(null);
  const containerWidth = useClientWidth(container);
  const pieceWidth = getOptimalPieceWidth(containerWidth);
  return (
    <div
      className={cx(styles.container, className)}
      style={style}
      ref={setContainer}
    >
      {pieceWidth ? (
        <Pieces.ListViewer pieces={pieces} pieceWidth={pieceWidth} fill />
      ) : undefined}
    </div>
  );
}
