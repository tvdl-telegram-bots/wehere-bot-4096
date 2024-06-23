"use client";

import { Box, Flex, Text } from "@radix-ui/themes";
import cx from "clsx";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";
import useSWR from "swr";
import type {
  Entities,
  MessageDirection,
  Timestamp,
} from "wehere-bot/src/typing/common";
import {
  Result$CreateThread,
  type Params$CreateThread,
} from "wehere-frontend/src/app/api/create-thread/typing";
import { Result$GetStartingQuestions } from "wehere-frontend/src/app/api/get-starting-questions/typing";
import { flex } from "wehere-frontend/src/utils/frontend";
import {
  getUrl,
  httpGet,
  httpPost,
  maxElement,
  minElement,
} from "wehere-frontend/src/utils/shared";

import ChatLayout from "../PageThreadV3/components/ChatLayout";
import SmartScrollArea from "../PageThreadV3/components/SmartScrollArea";

import pngLogoColor from "./assets/logo-color.png";
import Balloon from "./components/Balloon";
import Composer from "./components/Composer";
import StartingQuestionSelect from "./components/TemplateQuestionSelect";
import { useThreadDb } from "./hooks/useThreadDb";
import styles from "./index.module.scss";

type LightweightMessage = {
  direction: MessageDirection;
  text: string | null | undefined;
  entities: Entities | null | undefined;
  createdAt: Timestamp;
};

type Props = {
  className?: string;
  style?: React.CSSProperties;
};

export default function PageHome({ className, style }: Props) {
  const [busy, setBusy] = React.useState(false);
  const router = useRouter();
  const threadDb = useThreadDb();

  const swr_GetStartingQuestions = useSWR(
    "/api/get-starting-questions",
    (url) => httpGet(url).then(Result$GetStartingQuestions.parse)
  );
  const startingQuestions = swr_GetStartingQuestions.data?.questions;

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

  const [messages, setMessages] = React.useState<LightweightMessage[]>([]);
  const minChildKey = minElement(
    messages.map((m) => m.createdAt),
    0
  );
  const maxChildKey = maxElement(
    messages.map((m) => m.createdAt),
    0
  );

  return (
    <ChatLayout
      className={cx(styles.container, className)}
      style={style}
      activePage={{ type: "home" }}
    >
      <Flex
        direction="column"
        position="absolute"
        inset="0"
        align="center"
        p="2"
      >
        <Box position="relative" width="100%" {...flex.soft}>
          {!messages.length ? (
            <Flex position="absolute" inset="0" justify="center" align="center">
              <Flex direction="column" gap="2" align="center">
                <Image
                  className={styles.logo}
                  src={pngLogoColor}
                  alt="WeHere"
                />
                <Text className={styles.description} color="gray">
                  {
                    "WeHere là dự án tâm lý do Thư viện Dương Liễu sáng lập, nhằm chia sẻ kiến thức, câu chuyện, sự kiện về sức khỏe tinh thần của người trẻ."
                  }
                </Text>
              </Flex>
            </Flex>
          ) : (
            <SmartScrollArea
              className={styles.viewport}
              minChildKey={minChildKey}
              maxChildKey={maxChildKey}
              fill
            >
              <Box className={styles.content} position="relative">
                {messages.map((m) => (
                  <Box key={m.createdAt} py="2">
                    <Balloon
                      direction={m.direction}
                      text={m.text}
                      entities={m.entities}
                      delay={m.direction === "from_angel" ? "800ms" : "200ms"}
                    />
                  </Box>
                ))}
              </Box>
            </SmartScrollArea>
          )}
        </Box>
        <Flex
          className={styles.inputArea}
          {...flex.hard}
          direction="column"
          width="100%"
          gap="2"
        >
          {startingQuestions ? (
            <StartingQuestionSelect
              questions={startingQuestions}
              onSelect={(q) =>
                setMessages((m) => [
                  ...m,
                  {
                    createdAt: Date.now() - Math.random(),
                    text: q.prompt.text,
                    entities: q.prompt.entities,
                    direction: "from_mortal",
                  },
                  {
                    createdAt: Date.now() + Math.random(),
                    text: q.answer.text,
                    entities: q.answer.entities,
                    direction: "from_angel",
                  },
                ])
              }
            />
          ) : undefined}
          <Composer disabled={busy || !handleSubmit} onSubmit={handleSubmit} />
        </Flex>
      </Flex>
    </ChatLayout>
  );
}
