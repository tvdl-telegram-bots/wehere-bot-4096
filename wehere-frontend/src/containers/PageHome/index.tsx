"use client";

import { Box, Button, Dialog, Flex, Progress, Text } from "@radix-ui/themes";
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
import { Result$GetStatus } from "wehere-frontend/src/app/api/get-status/typing";
import { Result$GetTemplates } from "wehere-frontend/src/app/api/get-templates/typing";
import WehereTheme from "wehere-frontend/src/components/WehereTheme";
import { flex } from "wehere-frontend/src/utils/frontend";
import {
  getUrl,
  httpGet,
  httpPost,
  maxElement,
  minElement,
} from "wehere-frontend/src/utils/shared";

import ChatLayout from "../PageThreadV3/components/ChatLayout";
import RichTextViewer from "../PageThreadV3/components/RichTextViewer";
import SmartScrollArea from "../PageThreadV3/components/SmartScrollArea";

import pngLogoColor from "./assets/logo-color.png";
import Balloon from "./components/Balloon";
import Composer from "./components/Composer";
import StartingQuestionSelect from "./components/StartingQuestionSelect";
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
  const [leaving, setLeaving] = React.useState(false);
  const [abortController, setAbortController] =
    React.useState<AbortController>();
  const router = useRouter();
  const threadDb = useThreadDb();

  const swr_GetStatus = useSWR("/api/get-status", (url) =>
    httpGet(url, { cache: "no-cache" }).then(Result$GetStatus.parse)
  );
  const availability = swr_GetStatus.data?.availability.type;

  const swr_GetTemplates = useSWR("/api/get-templates", (url) =>
    httpGet(url, { cache: "default" }).then(Result$GetTemplates.parse)
  );
  const welcomeMessage = swr_GetTemplates.data?.welcomeMessage;
  const connectionRemarks = swr_GetTemplates.data?.connectionRemarks;
  const startingQuestions = swr_GetTemplates.data?.startingQuestions;

  const resolvedConnectionRemark =
    availability === "available"
      ? connectionRemarks?.whenAvailable
      : availability === "unavailable"
        ? connectionRemarks?.whenUnavailable
        : undefined;

  const handleSubmit = threadDb
    ? async (text: string) => {
        const abortController = new AbortController();
        setAbortController(abortController);
        setBusy(true);
        try {
          const signal = abortController.signal;
          const result = await httpPost(
            getUrl(location.origin, "/api/create-thread"), //
            { initialMessages: [{ text }] } satisfies Params$CreateThread,
            { signal }
          ).then(Result$CreateThread.parse);
          signal.throwIfAborted();
          setAbortController(undefined);

          await threadDb.set({
            threadId: result.threadId,
            threadPassword: result.threadPassword,
            threadName: result.threadName,
            threadEmoji: result.threadEmoji,
            threadCreatedAt: result.threadCreatedAt,
            pusherChannelId: result.pusherChannelId,
          });
          setLeaving(true);
          router.push(getUrl(location.origin, `/t/${result.threadId}`));
        } catch (error) {
          const isAbortError =
            error instanceof DOMException && error.name == "AbortError";
          if (!isAbortError) throw error;
        } finally {
          setAbortController(undefined);
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
      <Dialog.Root open={busy || leaving}>
        <WehereTheme asChild>
          <Dialog.Content>
            <Flex align="center" justify="center" direction="column" gap="4">
              {leaving ? (
                <Text align="center" weight="bold" size="4">
                  {"Đang chuyển hướng..."}
                </Text>
              ) : (
                <>
                  <Text align="center" weight="bold" size="4" color="gray">
                    {"Đang kết nối"}
                  </Text>
                  {resolvedConnectionRemark ? (
                    <RichTextViewer
                      className={styles.dialogDescription}
                      text={resolvedConnectionRemark.text || ""}
                      entities={resolvedConnectionRemark.entities || []}
                      unstyled={["b", "i", "p", "u"]}
                    />
                  ) : undefined}
                </>
              )}
              <Box width="80%" asChild>
                <Progress duration="20s" />
              </Box>
              <Button
                variant="surface"
                onClick={() => abortController?.abort()}
                disabled={!abortController}
              >
                {"Hủy kết nối"}
              </Button>
            </Flex>
          </Dialog.Content>
        </WehereTheme>
      </Dialog.Root>
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
                  className={cx(styles.logo, styles.hideIfWindowTooShort)}
                  src={pngLogoColor}
                  alt="WeHere"
                />
                {welcomeMessage ? (
                  <RichTextViewer
                    className={styles.description}
                    text={welcomeMessage.text || ""}
                    entities={welcomeMessage.entities || []}
                    unstyled={["b", "i", "p", "u"]}
                  />
                ) : undefined}
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
              className={styles.hideIfWindowTooShort}
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
