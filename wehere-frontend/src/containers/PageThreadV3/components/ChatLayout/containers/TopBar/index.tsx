import { Box, Flex, Text } from "@radix-ui/themes";
import cx from "clsx";
import Image from "next/image";
import React from "react";
import useSWR from "swr";
import { Result$GetStatus } from "wehere-frontend/src/app/api/get-status/typing";
import { httpGet } from "wehere-frontend/src/utils/shared";

import pngLogoColor from "./assets/logo-color.png";
import styles from "./index.module.scss";
import { formatAvailability } from "./utils";

type Props = {
  className?: string;
  style?: React.CSSProperties;
  fill: true;
};

export default function TopBar({ className, style }: Props) {
  const swr_GetStatus = useSWR("/api/get-status", (url) =>
    httpGet(url, { cache: "no-cache" }).then(Result$GetStatus.parse)
  );
  const availability = swr_GetStatus.data?.availability;
  const [currentTime, setCurrentTime] = React.useState<number>();

  React.useEffect(() => {
    setCurrentTime(Date.now());
    const id = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);
    return () => void clearInterval(id);
  }, []);

  return (
    <Flex
      className={cx(styles.container, className)}
      style={style}
      position="absolute"
      inset="0"
      justify="between"
      align="center"
    >
      <Flex align="center" gap="2">
        <Box
          className={styles.avatar}
          width="32px"
          height="32px"
          position="relative"
        >
          <Image src={pngLogoColor} alt="WeHere Logo" fill />
        </Box>
        <Flex direction="column">
          <Text size="2" weight="bold" color="gray" highContrast>
            {"WeHere"}
          </Text>
          <Text
            size="1"
            weight="light"
            color="gray"
            title={
              availability?.since
                ? new Date(availability?.since).toString()
                : undefined
            }
          >
            {formatAvailability(availability, currentTime)}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
}
