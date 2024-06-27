import { Box, Flex } from "@radix-ui/themes";
import cx from "clsx";
import React from "react";
import type { ActivePage } from "wehere-frontend/src/containers/PageThreadV3/components/ChatLayout/types";
import SideBarV2 from "wehere-frontend/src/containers/PageThreadV3/containers/SideBarV2";
import { flex } from "wehere-frontend/src/utils/frontend";

import TopBar from "../TopBar";

import styles from "./index.module.scss";

type Props = {
  className?: string;
  style?: React.CSSProperties;
  content?: React.ReactNode;
  children?: React.ReactNode;
  activePage?: ActivePage;
};

export default function InfoLayout({
  className,
  style,
  content,
  children = content,
  activePage,
}: Props) {
  return (
    <Flex
      className={cx(styles.container, className)}
      style={style}
      direction="row"
    >
      <Box
        className={styles.left}
        {...flex.hard}
        position="relative"
        display={{ initial: "none", sm: "block" }}
      >
        <SideBarV2 activePage={activePage} fill />
      </Box>
      <Flex direction="column" {...flex.soft}>
        <Box
          className={styles.top}
          {...flex.hard}
          position="relative"
          display={{ initial: "block", sm: "none" }}
        >
          <TopBar activePage={activePage} fill />
        </Box>
        <Box className={styles.content} {...flex.soft}>
          {children}
        </Box>
      </Flex>
    </Flex>
  );
}
