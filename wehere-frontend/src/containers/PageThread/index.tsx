/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React from "react";
import styles from "./index.module.scss";
import cx from "clsx";
import { useThreadLogic } from "./hooks/useThreadLogic";
import { faker } from "@faker-js/faker";
import { useHiddenQuery } from "./hooks/useHiddenQuery";

type Props = {
  className?: string;
  style?: React.CSSProperties;
  threadId: string;
  initialTimestamp: number;
};

export default function PageThread({
  className,
  style,
  threadId,
  initialTimestamp,
}: Props) {
  const threadPassword = useHiddenQuery("threadPassword", [
    threadId,
    "threadPassword",
  ]);
  const pusherChannelId = useHiddenQuery("pusherChannelId", [
    threadId,
    "pusherChannelId",
  ]);

  if (threadPassword === null || pusherChannelId === null) {
    console.error({ threadId, threadPassword, pusherChannelId });
    throw new Error("secret not found in the storage");
  }

  const api = useThreadLogic({
    threadId,
    threadPassword,
    pusherChannelId,
    initialTimestamp,
  });

  return (
    <div className={cx(styles.container, className)} style={style}>
      <pre>{JSON.stringify(api.state, null, 2)}</pre>
      <button
        onClick={() => {
          api.actions.sendMessage?.(faker.lorem.paragraph());
        }}
        disabled={!api.actions.sendMessage}
      >
        {"Send Message"}
      </button>
      <button onClick={() => api.actions.loadPreviousMessages?.()}>
        {"Load previous messages"}
      </button>
      <button>{"Load next messages"}</button>
    </div>
  );
}
