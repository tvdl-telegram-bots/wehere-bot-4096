"use client";

import { Box, Button, Container, Flex, TextArea } from "@radix-ui/themes";
import cx from "clsx";
import { useRouter } from "next/navigation";
import React from "react";
import {
  Result$CreateThread,
  type Params$CreateThread,
} from "wehere-frontend/src/app/api/create-thread/typing";
import { getUrl, httpPost } from "wehere-frontend/src/utils/shared";

import ChatLayout from "../PageThreadV2/components/ChatLayout";
import { flex } from "../PageThreadV2/utils/preset";

import Composer from "./components/Composer";
import styles from "./index.module.scss";

type Props = {
  className?: string;
  style?: React.CSSProperties;
};

export default function PageHome({ className, style }: Props) {
  const [busy, setBusy] = React.useState(false);
  const router = useRouter();

  const handleSubmit = async (text: string) => {
    setBusy(true);
    try {
      const result = await httpPost(
        getUrl(location.origin, "/api/create-thread"), //
        { initialMessage: { text } } satisfies Params$CreateThread
      ).then(Result$CreateThread.parse);
      router.push(
        getUrl(location.origin, `/t/${result.threadId}`, {
          threadPassword: result.threadPassword,
          pusherChannelId: result.pusherChannelId,
        })
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <ChatLayout className={cx(styles.container, className)} style={style}>
      <Flex direction="column" position="absolute" inset="0" align="center">
        <Box className={styles.chat} {...flex.soft}>
          <p>
            {
              "It sounds like physical weakness or fatigue plays a significant role in your tendency to procrastinate. This is quite common, as our physical state can greatly impact our motivation and productivity. Here are some suggestions to help you overcome procrastination when you're feeling physically weak"
            }
          </p>
        </Box>
        <Box className={styles.composerContainer} {...flex.hard}>
          <Composer disabled={busy} onSubmit={handleSubmit} />
        </Box>
      </Flex>
    </ChatLayout>
  );
}
