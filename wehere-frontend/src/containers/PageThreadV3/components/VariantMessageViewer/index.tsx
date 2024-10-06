import { Box } from "@radix-ui/themes";
import cx from "clsx";
import React from "react";
import Balloon from "wehere-frontend/src/containers/PageHome/components/Balloon";
import type { VariantMessage } from "wehere-frontend/src/typing/common";

import styles from "./index.module.scss";

type Props = {
  className?: string;
  style?: React.CSSProperties;
  variantMessage: VariantMessage;
};

export default function VariantMessageViewer({
  className,
  style,
  variantMessage,
}: Props) {
  return (
    <Box className={cx(styles.container, className)} style={style} py="2">
      <Balloon
        direction={variantMessage.direction}
        text={variantMessage.text}
        entities={variantMessage.entities}
      />
    </Box>
  );
}
