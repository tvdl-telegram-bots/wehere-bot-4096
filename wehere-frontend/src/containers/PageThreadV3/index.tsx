"use client";

import { Box, Flex, Text } from "@radix-ui/themes";
import cx from "clsx";
import React from "react";
import useSWR from "swr";
import { flex } from "wehere-frontend/src/utils/frontend";

import Composer from "../PageHome/components/Composer";
import { useThreadDb } from "../PageHome/hooks/useThreadDb";

import AutoTrigger from "./components/AutoTrigger";
import ChatLayout from "./components/ChatLayout";
import PieceViewer from "./components/PieceViewer";
import SmartScrollArea from "./components/SmartScrollArea";
import { useThreadLogic } from "./hooks/useThreadLogic";
import styles from "./index.module.scss";
import { getPieceTime, toSortedPieces } from "./objects/Piece";

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
  const threadDb = useThreadDb();
  const swr_threadSecret = useSWR(
    threadDb ? ["thread-db:", "ReadThreadSecret", threadId] : undefined,
    () => threadDb?.get(threadId)
  );

  const threadPassword = swr_threadSecret.data?.threadPassword;
  const pusherChannelId = swr_threadSecret.data?.pusherChannelId;

  const api = useThreadLogic({
    threadId,
    threadPassword,
    pusherChannelId,
    epoch,
  });

  const pieces = React.useMemo(() => toSortedPieces(api.state), [api.state]);

  const minChildKey = pieces.length ? getPieceTime(pieces[0]) : epoch;
  const maxChildKey = pieces.length
    ? getPieceTime(pieces[pieces.length - 1])
    : epoch;

  return (
    <ChatLayout
      className={cx(styles.container, className)}
      style={style}
      activePage={{ type: "thread", threadId }}
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
                  width="100%"
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
              {pieces.map((piece) => (
                <PieceViewer key={getPieceTime(piece)} piece={piece} />
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
  );
}
