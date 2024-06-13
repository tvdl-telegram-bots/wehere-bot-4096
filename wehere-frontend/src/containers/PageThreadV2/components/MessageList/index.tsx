import cx from "clsx";
import React from "react";
import type { ThreadState } from "wehere-frontend/src/containers/PageThread/classes/ThreadState";

import Pieces from "../Pieces";
import SmartScrollArea from "../SmartScrollArea";

import { useClientWidth } from "./hooks/useClientWidth";
import styles from "./index.module.scss";
import { getPieceTime, toSortedPieces } from "./utils";
import { getOptimalPieceWidth } from "./utils/ui";

type Props = {
  className?: string;
  style?: React.CSSProperties;
  threadState: ThreadState;
  epoch: number;
  fill: true;
};

export default function MessageList({
  className,
  style,
  threadState,
  epoch,
}: Props) {
  const pieces = React.useMemo(
    () => toSortedPieces(threadState),
    [threadState]
  );
  // const [container, setContainer] = React.useState<HTMLElement | null>(null);
  // const containerWidth = useClientWidth(container);
  // const pieceWidth = getOptimalPieceWidth(containerWidth);

  const minChildKey = pieces.length ? getPieceTime(pieces[0]) : epoch;
  const maxChildKey = pieces.length
    ? getPieceTime(pieces[pieces.length - 1])
    : epoch;
  return (
    <div
      className={cx(styles.container, className)}
      style={style}
      // ref={setContainer}
    >
      <SmartScrollArea minChildKey={minChildKey} maxChildKey={maxChildKey} fill>
        {pieces.map((piece) => (
          <Pieces.ItemViewer key={getPieceTime(piece)} piece={piece} />
        ))}
      </SmartScrollArea>

      {/* {pieceWidth ? (
        <Pieces.ListViewer pieces={pieces} pieceWidth={pieceWidth} fill />
      ) : undefined} */}
    </div>
  );
}
