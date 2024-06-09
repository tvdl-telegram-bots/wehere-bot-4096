"use client";

import { faker } from "@faker-js/faker";
import cx from "clsx";
import React from "react";

import { useHiddenQuery } from "../PageThread/hooks/useHiddenQuery";
import { useThreadLogic } from "../PageThread/hooks/useThreadLogic";

import ChatLayout from "./components/ChatLayout";
import styles from "./index.module.scss";

type Props = {
  className?: string;
  style?: React.CSSProperties;
  threadId: string;
  epoch: number;
};

export default function PageThreadV2({
  className,
  style,
  epoch,
  threadId,
}: Props) {
  const threadPassword = useHiddenQuery("threadPassword", [
    threadId,
    "threadPassword",
  ]);

  const pusherChannelId = useHiddenQuery("pusherChannelId", [
    threadId,
    "pusherChannelId",
  ]);

  const api = useThreadLogic({
    threadId,
    threadPassword,
    pusherChannelId,
    epoch,
  });
  return (
    <ChatLayout
      className={cx(styles.container, className, "container")}
      style={style}
    >
      <h2>{"state.epoch"}</h2>
      <pre>{JSON.stringify({ epoch: api.state.epoch })}</pre>

      <h2>{"state.priorEpochMessages"}</h2>
      <ul>
        {api.state.priorEpochMessages.map((item) => (
          <pre key={item.createdAt}>{JSON.stringify(item, null, 2)}</pre>
        ))}
      </ul>

      <h2>{"state.sinceEpochMessages"}</h2>
      <ul>
        {api.state.sinceEpochMessages.map((item) => (
          <pre key={item.createdAt}>{JSON.stringify(item, null, 2)}</pre>
        ))}
      </ul>

      <h2>{"state.outgoingMessages"}</h2>
      <ul>
        {api.state.outgoingMessages.map((item) => (
          <pre key={item.composedAt}>{JSON.stringify(item, null, 2)}</pre>
        ))}
      </ul>

      <h2>{"state.incomingMessages"}</h2>
      <ul>
        {api.state.incomingMessages.map((item) => (
          <pre key={item.createdAt}>{JSON.stringify(item, null, 2)}</pre>
        ))}
      </ul>

      <button onClick={api.loadPrevMessages} disabled={!api.loadPrevMessages}>
        {"Load prev messages"}
      </button>

      <button onClick={api.loadNextMessages} disabled={!api.loadNextMessages}>
        {"Load next messages"}
      </button>

      <button
        onClick={() => api.sendMessage?.(faker.lorem.paragraph())}
        disabled={!api.sendMessage}
      >
        {"Send message"}
      </button>
    </ChatLayout>
  );
}
