import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { Box, Button, Flex, Text } from "@radix-ui/themes";
import cx from "clsx";
import Link from "next/link";
import React from "react";
import useSWR from "swr";
import type { Timestamp } from "wehere-bot/src/typing/common";
import { useThemeControl } from "wehere-frontend/src/components/WehereTheme/utils";
import { useThreadDb } from "wehere-frontend/src/containers/PageHome/hooks/useThreadDb";
import type { ThreadSecret } from "wehere-frontend/src/typing/common";
import { flex } from "wehere-frontend/src/utils/frontend";

import type { ActivePage } from "../../components/ChatLayout/types";

import styles from "./index.module.scss";

type Props$Item = {
  className?: string;
  style?: React.CSSProperties;
  height: string;
  href: string;
  emoji: string | null | undefined;
  label: React.ReactNode;
  active?: boolean;
};

function Item({
  className,
  style,
  height,
  href,
  emoji,
  label,
  active,
}: Props$Item) {
  return (
    <Flex
      className={cx(styles.Item, className, active ? styles.active : undefined)}
      style={style}
      height={height}
      align="center"
      gap="2"
      asChild
    >
      <Link href={href}>
        <Text className={styles.emoji} color="gray">
          {emoji}
        </Text>
        <Text color="gray">{label}</Text>
      </Link>
    </Flex>
  );
}

type TimeRange =
  | "today"
  | "yesterday"
  | "previous-7-day"
  | "previous-30-day"
  | "long-time-ago";

function formatTimeRange(timeRange: TimeRange): string {
  switch (timeRange) {
    case "today":
      return "Hôm nay";
    case "yesterday":
      return "Hôm qua";
    case "previous-7-day":
      return "7 ngày vừa qua";
    case "previous-30-day":
      return "30 ngày vừa qua";
    case "long-time-ago":
      return "Trước đó";
  }
}

type Piece =
  | { type: "thread"; timestamp: Timestamp; payload: ThreadSecret }
  | { type: "heading"; timestamp: Timestamp; payload: TimeRange };

function getDayStart(now: Timestamp): Timestamp {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date.valueOf();
}

function toSortedPieces(epoch: Timestamp, threadSecrets: ThreadSecret[]) {
  const dayStart = getDayStart(epoch);

  const pieces: Piece[] = [
    { type: "heading", timestamp: dayStart + 86400000, payload: "today" },
    { type: "heading", timestamp: dayStart, payload: "yesterday" },
    {
      type: "heading",
      timestamp: dayStart - 86400000,
      payload: "previous-7-day",
    },
    {
      type: "heading",
      timestamp: dayStart - 604800000,
      payload: "previous-30-day",
    },
    {
      type: "heading",
      timestamp: dayStart - 2592000000,
      payload: "long-time-ago",
    },
  ];

  for (const t of threadSecrets) {
    pieces.push({ type: "thread", timestamp: t.threadCreatedAt, payload: t });
  }

  pieces.sort((a, b) => b.timestamp - a.timestamp);

  return pieces.filter(
    (_, index, array) =>
      array[index].type !== "heading" ||
      (index !== array.length - 1 && array[index + 1].type !== "heading")
  );
}

type ThemeSwitcher$Props = {
  className?: string;
  style?: React.CSSProperties;
};

function ThemeSwitcher({ className, style }: ThemeSwitcher$Props) {
  const themeControl = useThemeControl();

  return (
    <Box className={cx(styles.ThemeSwitcher, className)} style={style}>
      <Button
        variant="ghost"
        color="gray"
        style={{ width: "100%", height: "40px" }}
        onClick={() => {
          themeControl.setDark(!themeControl.dark);
        }}
      >
        {themeControl.dark ? <MoonIcon /> : <SunIcon />}
        <Text>{"Chế độ Sáng/Tối"}</Text>
      </Button>
    </Box>
  );
}

type Props$Root = {
  className?: string;
  style?: React.CSSProperties;
  activePage?: ActivePage;
  transparent?: boolean;
  fill: true;
};

function Root({ className, style, activePage, transparent }: Props$Root) {
  const [epoch, setEpoch] = React.useState<number>();

  const threadDb = useThreadDb();
  const swr_getThreadSecrets = useSWR(
    threadDb ? ["thread-db", "GetThreadSecrets"] : undefined,
    () => threadDb?.getAll()
  );
  const threadSecrets = swr_getThreadSecrets.data;
  const pieces =
    epoch && threadSecrets ? toSortedPieces(epoch, threadSecrets) : undefined;

  React.useEffect(() => {
    setEpoch(Date.now());
    return () => setEpoch(undefined);
  }, []);

  return (
    <Flex
      className={cx(
        styles.Root,
        className,
        transparent ? styles.transparent : undefined
      )}
      style={style}
      position="absolute"
      inset="0"
      direction="column"
      gap="2"
    >
      <Flex direction="column" {...flex.hard}>
        <Item
          height="40px"
          href="/"
          emoji="🏠"
          label="Trang chủ"
          active={activePage?.type === "home"}
        />
        <Item
          height="40px"
          href="/about"
          emoji="📞"
          label="Về chúng tôi"
          active={activePage?.type === "about"}
        />
      </Flex>
      <Flex className={styles.viewport} direction="column" {...flex.soft}>
        {(pieces || []).map((p) => {
          switch (p.type) {
            case "heading":
              return (
                <Text
                  key={p.timestamp}
                  className={styles.heading}
                  color="gray"
                  size="1"
                  weight="bold"
                >
                  {formatTimeRange(p.payload)}
                </Text>
              );
            case "thread":
              return (
                <Item
                  key={p.timestamp}
                  height="32px"
                  href={`/t/${p.payload.threadId}`}
                  emoji={p.payload.threadEmoji}
                  label={p.payload.threadName}
                  active={
                    activePage?.type === "thread" &&
                    activePage.threadId === p.payload.threadId
                  }
                />
              );
          }
        })}
      </Flex>
      <Box {...flex.hard} asChild>
        <ThemeSwitcher />
      </Box>
    </Flex>
  );
}

const SideBarV2 = Root;
export default SideBarV2;
