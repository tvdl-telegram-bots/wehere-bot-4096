"use client";

import { Box, Flex } from "@radix-ui/themes";
import cx from "clsx";
import { useRouter } from "next/navigation";
import React from "react";
import {
  Result$CreateThread,
  type Params$CreateThread,
} from "wehere-frontend/src/app/api/create-thread/typing";
import { flex } from "wehere-frontend/src/utils/frontend";
import { getUrl, httpPost } from "wehere-frontend/src/utils/shared";

import ChatLayout from "../PageThreadV3/components/ChatLayout";

import Composer from "./components/Composer";
import { useThreadDb } from "./hooks/useThreadDb";
import styles from "./index.module.scss";

type Props = {
  className?: string;
  style?: React.CSSProperties;
};

export default function PageHome({ className, style }: Props) {
  const [busy, setBusy] = React.useState(false);
  const router = useRouter();
  const threadDb = useThreadDb();

  const handleSubmit = threadDb
    ? async (text: string) => {
        setBusy(true);
        try {
          const result = await httpPost(
            getUrl(location.origin, "/api/create-thread"), //
            { initialMessage: { text } } satisfies Params$CreateThread
          ).then(Result$CreateThread.parse);
          await threadDb.set({
            threadId: result.threadId,
            threadPassword: result.threadPassword,
            threadName: result.threadName,
            threadEmoji: result.threadEmoji,
            threadCreatedAt: result.threadCreatedAt,
            pusherChannelId: result.pusherChannelId,
          });
          router.push(getUrl(location.origin, `/t/${result.threadId}`));
        } finally {
          setBusy(false);
        }
      }
    : undefined;

  return (
    <ChatLayout
      className={cx(styles.container, className)}
      style={style}
      activePage={{ type: "home" }}
    >
      <Flex direction="column" position="absolute" inset="0" align="center">
        <Box className={styles.chat} {...flex.soft}>
          {/* <p>
            {
              "It sounds like physical weakness or fatigue plays a significant role in your tendency to procrastinate. This is quite common, as our physical state can greatly impact our motivation and productivity. Here are some suggestions to help you overcome procrastination when you're feeling physically weak"
            }
          </p> */}
        </Box>
        <Box className={styles.composerContainer} {...flex.hard}>
          <Composer disabled={busy || !handleSubmit} onSubmit={handleSubmit} />
        </Box>
      </Flex>
    </ChatLayout>
  );
}
