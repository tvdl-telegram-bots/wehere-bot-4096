import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { Box, Flex, IconButton, Text } from "@radix-ui/themes";
import cx from "clsx";
import Image from "next/image";
import React from "react";
import useSWR from "swr";
import { Result$GetStatus } from "wehere-frontend/src/app/api/get-status/typing";
import Logo from "wehere-frontend/src/components/Logo";
import { flex } from "wehere-frontend/src/utils/frontend";
import { httpGet } from "wehere-frontend/src/utils/shared";

import SideBarDialog from "../../components/SideBarDialog";
import type { ActivePage } from "../../types";

import pngLogoColor from "./assets/logo-color.png";
import styles from "./index.module.scss";
import { formatAvailability } from "./utils";

type Props = {
  className?: string;
  style?: React.CSSProperties;
  activePage?: ActivePage;
  slotRight?: React.ReactNode;
  fill: true;
};

export default function TopBar({
  className,
  style,
  activePage,
  slotRight,
}: Props) {
  const swr_GetStatus = useSWR(
    "/api/get-status",
    (url) => httpGet(url, { cache: "no-cache" }).then(Result$GetStatus.parse),
    { refreshInterval: 60000 } // refresh every 1 minute
  );
  const availability = swr_GetStatus.data?.availability;
  const serverTimestamp = swr_GetStatus.data?.serverTimestamp;

  return (
    <Flex
      className={cx(styles.container, className)}
      style={style}
      position="absolute"
      inset="0"
      justify="between"
      align="center"
    >
      <Flex align="center" gap="2" px={{ initial: "2", sm: "0" }}>
        <Flex
          display={{ initial: "flex", sm: "none" }}
          align="center"
          justify="center"
          width="32px"
          height="32px"
        >
          <SideBarDialog
            trigger={
              <IconButton variant="ghost" color="gray">
                <HamburgerMenuIcon width="24px" height="24px" />
              </IconButton>
            }
            activePage={activePage}
          />
        </Flex>
        <Box
          className={styles.avatar}
          width="32px"
          height="32px"
          position="relative"
        >
          <Logo fill />
        </Box>
        <Flex direction="column">
          <Text size="2" weight="bold" color="gray" highContrast>
            {"WeHere"}
          </Text>
          <Text
            className={cx(
              styles.availability,
              !availability?.type ? styles.loading : undefined
            )}
            size="1"
            weight="light"
            color="gray"
            title={
              availability?.since
                ? new Date(availability?.since).toString()
                : undefined
            }
          >
            {formatAvailability(availability, serverTimestamp)}
          </Text>
        </Flex>
      </Flex>
      {slotRight ? (
        <Flex px="2" {...flex.hard}>
          {slotRight}
        </Flex>
      ) : undefined}
    </Flex>
  );
}
