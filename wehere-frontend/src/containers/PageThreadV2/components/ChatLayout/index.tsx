import { Box, Flex } from "@radix-ui/themes";
import cx from "clsx";
import React from "react";
import {
  flex,
  bg,
} from "wehere-frontend/src/containers/PageThreadV2/utils/preset";

import SideBar from "../SideBar";

import styles from "./index.module.scss";

type Props = {
  className?: string;
  style?: React.CSSProperties;
  content?: React.ReactNode;
  children?: React.ReactNode;
};

export default function ChatLayout({
  className,
  style,
  content,
  children = content,
}: Props) {
  return (
    <Flex
      className={cx(styles.container, className)}
      style={style}
      direction="row"
    >
      <Box className={styles.left} position="relative" {...flex.hard}>
        <SideBar fill />
      </Box>
      <Flex direction="column" {...flex.soft}>
        <Box className={styles.top} {...flex.hard}></Box>
        <Box className={styles.content} {...flex.soft}>
          {children}
        </Box>
      </Flex>
    </Flex>
  );
}
