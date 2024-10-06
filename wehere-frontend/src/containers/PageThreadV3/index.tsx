"use client";

import {
  Box,
  ChevronDownIcon,
  DropdownMenu,
  Flex,
  IconButton,
  Text,
} from "@radix-ui/themes";
import cx from "clsx";
import { useRouter } from "next/navigation";
import React from "react";
import useSWR from "swr";
import { Result$GetStatus } from "wehere-frontend/src/app/api/get-status/typing";
import WehereTheme from "wehere-frontend/src/components/WehereTheme";
import { VariantMessage } from "wehere-frontend/src/typing/common";
import { flex } from "wehere-frontend/src/utils/frontend";
import { httpGet } from "wehere-frontend/src/utils/shared";

import Composer from "../PageHome/components/Composer";
import { useThreadDb } from "../PageHome/hooks/useThreadDb";

import AutoTrigger from "./components/AutoTrigger";
import ChatLayout from "./components/ChatLayout";
import SmartScrollArea from "./components/SmartScrollArea";
import VariantMessageViewer from "./components/VariantMessageViewer";
import { useThreadLogic } from "./hooks/useThreadLogic";
import styles from "./index.module.scss";

type Props = {
  className?: string;
  style?: React.CSSProperties;
  threadId: string;
  epoch: number;
};

export default function PageThreadV3({
  className,
  style,
  threadId,
  epoch,
}: Props) {
  const router = useRouter();
  const threadDb = useThreadDb();
  const deleteThread = threadDb
    ? async () => {
        if (window.confirm("Bạn có chắc muốn xóa cuộc trò chuyện này?")) {
          await threadDb.del(threadId);
          router.push("/");
        }
      }
    : undefined;

  const swr_ReadThreadSecret = useSWR(
    threadDb ? ["thread-db:", "ReadThreadSecret", threadId] : undefined,
    () => threadDb?.get(threadId)
  );
  const threadPassword = swr_ReadThreadSecret.data?.threadPassword;
  const pusherChannelId = swr_ReadThreadSecret.data?.pusherChannelId;

  const swr_GetStatus = useSWR("/api/get-status", (url) =>
    httpGet(url, { cache: "no-cache" }).then(Result$GetStatus.parse)
  );
  const pusherClientConfig = swr_GetStatus.data?.pusherClientConfig;

  const api = useThreadLogic({
    threadId,
    threadPassword,
    pusherChannelId,
    pusherClientConfig,
    epoch,
  });

  const variantMessages = api.sortedMessages;
  const minChildKey = variantMessages.length
    ? VariantMessage.getTimestamp(variantMessages[0])
    : epoch;
  const maxChildKey = variantMessages.length
    ? VariantMessage.getTimestamp(variantMessages[variantMessages.length - 1])
    : epoch;

  return (
    <WehereTheme>
      <ChatLayout
        className={cx(styles.container, className)}
        style={style}
        activePage={{ type: "thread", threadId }}
        slotRightOnTopBar={
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <IconButton variant="ghost" color="gray">
                <ChevronDownIcon width="16px" height="16px" />
              </IconButton>
            </DropdownMenu.Trigger>
            <WehereTheme asChild>
              <DropdownMenu.Content>
                <DropdownMenu.Item
                  onClick={deleteThread}
                  disabled={!deleteThread}
                >
                  {"Xóa cuộc trò chuyện"}
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </WehereTheme>
          </DropdownMenu.Root>
        }
      >
        <Flex direction="column" position="absolute" inset="0" align="center">
          <Box position="relative" width="100%" {...flex.soft}>
            <SmartScrollArea
              className={styles.viewport}
              minChildKey={minChildKey}
              maxChildKey={maxChildKey}
              fill
            >
              <Box className={styles.content} position="relative">
                {!api.state.noMorePrevMessages ? (
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
                      onClick={api.loadPrevMessages}
                      disabled={api.state.noMorePrevMessages}
                      labelReady="Tải các tin nhắn trước đó"
                      labelBusy="Đang tải các tin nhắn trước đó..."
                      labelDisabled="Không còn tin nhắn nào trước đó."
                      height="60px"
                    />
                  </Flex>
                ) : api.state.priorEpochMessages.length > 20 ? (
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
                {variantMessages.map((m) => (
                  <VariantMessageViewer
                    key={VariantMessage.getKey(m)}
                    variantMessage={m}
                  />
                ))}
              </Box>
            </SmartScrollArea>
          </Box>
          <Box className={styles.composerContainer} width="100%" {...flex.hard}>
            <Composer
              disabled={!api.sendMessage}
              onSubmit={(text) => void api.sendMessage?.(text)}
            />
          </Box>
        </Flex>
      </ChatLayout>
    </WehereTheme>
  );
}
