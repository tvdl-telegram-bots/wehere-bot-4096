import { Box } from "@radix-ui/themes";
import cx from "clsx";
import { Map } from "immutable";
import React from "react";

import { useClientHeight } from "../MessageList/hooks/useClientHeight";
import { getPieceTime, type Piece } from "../MessageList/utils";

import styles from "./index.module.scss";
import { getPartialSums } from "./utils";

type StableUnaryFunction<R, T0> = {
  call: (arg0: T0) => R; // referentially stable
  arg0: T0;
};

type Props$ItemViewer = {
  className?: string;
  style?: React.CSSProperties;
  piece: Piece;
  onHeightChange?: StableUnaryFunction<
    (length: number | undefined) => void,
    number
  >;
};

function ItemViewer({
  className,
  style,
  piece,
  onHeightChange,
}: Props$ItemViewer) {
  const [container, setContainer] = React.useState<Element | null>(null);
  const clientHeight = useClientHeight(container);

  React.useEffect(() => {
    onHeightChange?.call(onHeightChange.arg0)(clientHeight);
  }, [clientHeight, onHeightChange?.call, onHeightChange?.arg0]);

  return (
    <Box
      className={cx(styles.ItemViewer, className)}
      style={style}
      ref={setContainer}
    >
      {JSON.stringify(piece)}
    </Box>
  );
}

type Props$ListViewer = {
  className?: string;
  style?: React.CSSProperties;
  pieces: Piece[];
  pieceWidth: number;
  fill: true;
};

function ListViewer({
  className,
  style,
  pieces,
  pieceWidth,
}: Props$ListViewer) {
  const [heightCache, setHeightCache] = React.useState(
    Map<number, number | undefined>()
  );

  const pieceKeys = pieces.map(
    (piece) => getPieceTime(piece) * 1000 + pieceWidth
  );
  const pieceHeights = pieces.map(
    (_, index) => heightCache.get(pieceKeys[index]) || 0
  );
  const pieceTops = getPartialSums(pieceHeights);

  const handleHeightChange = React.useCallback(
    (key: number) => {
      return function (length: number | undefined) {
        setHeightCache((cache) => cache.set(key, length));
      };
    },
    [setHeightCache]
  );

  return (
    <div className={cx(styles.ListViewer, className)} style={style}>
      {pieces.map((piece, index) => (
        <Box
          position="absolute"
          width={`${pieceWidth}px`}
          height={`${pieceHeights[index]}px`}
          left={`${0}px`}
          top={`${pieceTops[index]}px`}
        >
          <ItemViewer
            key={getPieceTime(piece)}
            piece={piece}
            onHeightChange={{
              call: handleHeightChange,
              arg0: pieceKeys[index],
            }}
          />
        </Box>
      ))}
    </div>
  );
}

const Pieces = {
  ItemViewer,
  ListViewer,
};

export default Pieces;
