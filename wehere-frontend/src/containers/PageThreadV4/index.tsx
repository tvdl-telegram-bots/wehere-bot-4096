"use client";

import { Box, Flex, Text } from "@radix-ui/themes";
import cx from "clsx";
import React from "react";
import WehereTheme from "wehere-frontend/src/components/WehereTheme";
import { VariantMessage } from "wehere-frontend/src/typing/common";
import { flex } from "wehere-frontend/src/utils/frontend";

import Composer from "../PageHome/components/Composer";
import AutoTrigger from "../PageThreadV3/components/AutoTrigger";
import ChatLayout from "../PageThreadV3/components/ChatLayout";
import SmartScrollArea from "../PageThreadV3/components/SmartScrollArea";
import VariantMessageViewer from "../PageThreadV3/components/VariantMessageViewer";

import { useThreadStateApi } from "./hooks/useThreadState";
import styles from "./index.module.scss";

type Props = {
  className?: string;
  style?: React.CSSProperties;
  threadId: string;
  epoch: number;
};

export default function PageThreadV4({
  className,
  style,
  threadId,
  epoch,
}: Props) {
  const threadStateApi = useThreadStateApi({ epoch, threadId });

  return (
    <WehereTheme>
      <ChatLayout
        className={cx(styles.container, className)}
        style={style}
        activePage={{ type: "thread", threadId }}
      >
        <Flex direction="column" position="absolute" inset="0" align="center">
          <Box position="relative" width="100%" {...flex.soft}>
            <SmartScrollArea
              className={styles.viewport}
              minChildKey={threadStateApi.minTimestamp || epoch}
              maxChildKey={threadStateApi.maxTimestamp || epoch}
              fill
            >
              <Box className={styles.content} position="relative">
                {!threadStateApi.hasNoMorePreviousMessages ? (
                  <Flex
                    className={styles.autoTriggerContainer}
                    position="absolute"
                    top="0"
                    left="0"
                    right="0"
                    justify="center"
                    align="center"
                  >
                    <AutoTrigger
                      onClick={threadStateApi.loadPrevMessages}
                      disabled={!threadStateApi.loadPrevMessages}
                      labelReady="Tải các tin nhắn trước đó"
                      labelBusy="Đang tải các tin nhắn trước đó..."
                      labelDisabled="Không còn tin nhắn nào trước đó." // This is not always correct. Maybe `threadSecret.threadPassword` is undefined.
                      height="60px"
                    />
                  </Flex>
                ) : threadStateApi.pages.length > 2 ? (
                  <Flex
                    className={styles.labelNoMorePrevMessages}
                    width="100%"
                    justify="center"
                    align="center"
                  >
                    <Text size="2" color="gray">
                      {"Không còn tin nhắn nào trước đó."}
                    </Text>
                  </Flex>
                ) : undefined}
                {threadStateApi.pages.map((page) => {
                  return (
                    <Box key={page.id}>
                      {page.messages.map((m) => (
                        <VariantMessageViewer
                          key={VariantMessage.getKey(m)}
                          variantMessage={m}
                        />
                      ))}
                    </Box>
                  );
                })}
              </Box>
            </SmartScrollArea>
          </Box>
          <Box className={styles.composerContainer} width="100%" {...flex.hard}>
            <Composer
              disabled={!threadStateApi.sendMessage}
              onSubmit={(text) => void threadStateApi.sendMessage?.(text)}
            />
          </Box>
        </Flex>
      </ChatLayout>
    </WehereTheme>
  );
}
