import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { Box, Flex, IconButton, Text } from "@radix-ui/themes";
import cx from "clsx";
import React from "react";
import SideBarDialog from "wehere-frontend/src/containers/PageThreadV3/components/ChatLayout/components/SideBarDialog";
import type { ActivePage } from "wehere-frontend/src/containers/PageThreadV3/components/ChatLayout/types";
import { flex } from "wehere-frontend/src/utils/frontend";

import styles from "./index.module.scss";

type Props = {
  className?: string;
  style?: React.CSSProperties;
  activePage?: ActivePage;
  fill: true;
};

export default function TopBar({ className, style, activePage }: Props) {
  return (
    <Flex
      className={cx(styles.container, className)}
      style={style}
      position="absolute"
      inset="0"
      align="center"
      gap="2"
      px="2"
    >
      <Flex align="center" justify="center" width="32px" height="32px">
        <SideBarDialog
          trigger={
            <IconButton variant="ghost" color="gray">
              <HamburgerMenuIcon width="24px" height="24px" />
            </IconButton>
          }
          activePage={activePage}
        />
      </Flex>
      <Flex {...flex.soft} align="center" justify="center">
        <Text color="gray" size="5">
          {"Về chúng tôi"}
        </Text>
      </Flex>
      <Box {...flex.hard} width="32px" height="32px" />
    </Flex>
  );
}
