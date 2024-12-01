import Pusher from "pusher-js";
import React from "react";
import useSWR from "swr";
import {
  Nonce,
  type Emoji,
  type Timestamp,
} from "wehere-bot/src/typing/common";
import { IncomingMessageEvent } from "wehere-bot/src/typing/pusher";
import type { Params$GetNextMessages } from "wehere-frontend/src/app/api/get-next-messages/typing";
import { Result$GetNextMessages } from "wehere-frontend/src/app/api/get-next-messages/typing";
import type { Params$GetPrevMessages } from "wehere-frontend/src/app/api/get-prev-messages/typing";
import { Result$GetPrevMessages } from "wehere-frontend/src/app/api/get-prev-messages/typing";
import { Result$GetStatus } from "wehere-frontend/src/app/api/get-status/typing";
import type { Params$SendMessage } from "wehere-frontend/src/app/api/send-message/typing";
import { Result$SendMessage } from "wehere-frontend/src/app/api/send-message/typing";
import type {
  IncomingMessage,
  OutgoingMessage,
} from "wehere-frontend/src/typing/common";
import { VariantMessage } from "wehere-frontend/src/typing/common";
import {
  getUrl,
  httpGet,
  httpPost,
  sleep,
} from "wehere-frontend/src/utils/shared";

import { useThreadSecret } from "./useThreadSecret";

type Plain<T> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [K in keyof T as T[K] extends Function ? never : K]: T[K];
};

export class Page {
  id: React.Key;
  after: Timestamp | null;
  until: Timestamp | null;
  messages: VariantMessage[]; // sorted ascending

  constructor(init: Plain<Page>) {
    this.id = init.id;
    this.after = init.after;
    this.until = init.until;
    this.messages = init.messages;
  }

  plain(): Plain<Page> {
    return {
      id: this.id,
      after: this.after,
      until: this.until,
      messages: this.messages,
    };
  }

  insertMessage(message: VariantMessage) {
    for (const m of this.messages) {
      const timestampExisted =
        message.createdAt && m.createdAt === message.createdAt;
      const nonceExisted = message.nonce && m.nonce === message.nonce;
      if (timestampExisted || nonceExisted) {
        return this;
      }
    }

    const newMessages = [...this.messages, message];
    newMessages.sort((a, b) => {
      const a0 = VariantMessage.getTimestamp(a);
      const b0 = VariantMessage.getTimestamp(b);
      return a0 - b0;
    });

    return new Page({
      ...this.plain(),
      messages: newMessages,
    });
  }

  containsMessageWithTimestamp(timestamp: Timestamp) {
    return (
      (!this.after || this.after < timestamp) &&
      (!this.until || timestamp <= this.until) &&
      this.messages.some((m) => VariantMessage.getTimestamp(m) === timestamp)
    );
  }
}

type CleanState = {
  after: Timestamp | null; // cursor A
  until: Timestamp; // cursor B
  pages: Page[];
};

type DirtyState = {
  incomingMessages: IncomingMessage[];
  outgoingMessages: OutgoingMessage[];
  angelEmojis: Map<Timestamp, Emoji | null>;
};

export class ThreadStateV2 {
  clean: CleanState;
  dirty: DirtyState;

  constructor(init: { clean: CleanState; dirty: DirtyState }) {
    this.clean = init.clean;
    this.dirty = init.dirty;
  }

  static fromEpoch(epoch: Timestamp): ThreadStateV2 {
    return new ThreadStateV2({
      clean: {
        after: epoch,
        until: epoch,
        pages: [],
      },
      dirty: {
        incomingMessages: [],
        outgoingMessages: [],
        angelEmojis: new Map(),
      },
    });
  }

  toPages(): Page[] {
    const pages = [
      ...this.clean.pages,
      new Page({
        id: this.clean.until,
        after: this.clean.until,
        until: null,
        messages: [],
      }),
    ];

    for (const message of [
      ...this.dirty.incomingMessages, // first priority
      ...this.dirty.outgoingMessages, // second priority
    ]) {
      const timestamp = VariantMessage.getTimestamp(message);
      const index = pages.findIndex(
        (page) =>
          (!page.after || page.after < timestamp) &&
          (!page.until || timestamp <= page.until)
      );
      pages[index] = pages[index].insertMessage(message);
    }

    return pages;
  }

  tryPrependPage(page: Page) {
    if (this.clean.after !== page.until) {
      console.warn("cannot prepend page because the timestamps do not match");
      return this;
    }
    return new ThreadStateV2({
      clean: {
        after: page.after,
        until: this.clean.until,
        pages: [page, ...this.clean.pages],
      },
      dirty: this.dirty,
    });
  }

  tryAppendPage(page: Page) {
    if (this.clean.until !== page.after) {
      console.warn("cannot append page because the timestamps do not match");
      return this;
    }
    if (!page.until || !page.messages.length) {
      console.warn("skip appending page because data is empty");
      return this;
    }
    return new ThreadStateV2({
      clean: {
        after: this.clean.after,
        until: page.until,
        pages: [...this.clean.pages, page],
      },
      dirty: this.dirty,
    });
  }

  chore() {
    return new ThreadStateV2({
      clean: this.clean,
      dirty: {
        ...this.dirty,
        outgoingMessages: this.dirty.outgoingMessages.filter(
          (message) =>
            !this.clean.pages.some((page) =>
              page.containsMessageWithTimestamp(
                VariantMessage.getTimestamp(message)
              )
            )
        ),
        incomingMessages: this.dirty.incomingMessages.filter(
          (message) =>
            !this.clean.pages.some((page) =>
              page.containsMessageWithTimestamp(
                VariantMessage.getTimestamp(message)
              )
            )
        ),
      },
    });
  }

  insertOutgoingMessage(message: OutgoingMessage) {
    return new ThreadStateV2({
      clean: this.clean,
      dirty: {
        ...this.dirty,
        outgoingMessages: [...this.dirty.outgoingMessages, message],
      },
    });
  }

  insertIncomingMessage(message: IncomingMessage) {
    return new ThreadStateV2({
      clean: this.clean,
      dirty: {
        ...this.dirty,
        incomingMessages: [...this.dirty.incomingMessages, message],
      },
    });
  }

  acknowledgeOutgoingMessage(nonce: Nonce, createdAt: number) {
    return new ThreadStateV2({
      clean: this.clean,
      dirty: {
        ...this.dirty,
        outgoingMessages: this.dirty.outgoingMessages.map((item) =>
          item.nonce === nonce ? { ...item, sentAt: createdAt } : item
        ),
      },
    });
  }

  setAngelEmoji(messageTimestamp: Timestamp, emoji: Emoji | null) {
    const newAngelEmojis = new Map(this.dirty.angelEmojis);
    newAngelEmojis.set(messageTimestamp, emoji);

    return new ThreadStateV2({
      clean: this.clean,
      dirty: {
        ...this.dirty,
        angelEmojis: newAngelEmojis,
      },
    });
  }
}

export function useThreadStateApi({
  epoch,
  threadId,
}: {
  epoch: Timestamp;
  threadId: string;
}) {
  const threadSecret = useThreadSecret(threadId);
  const threadSecret_threadPassword = threadSecret.threadPassword;
  const threadSecret_pusherChannelId = threadSecret.pusherChannelId;

  const [threadState, setThreadState] = React.useState(() =>
    ThreadStateV2.fromEpoch(epoch)
  );
  const threadState_clean_after = threadState.clean.after;
  console.log(threadState.dirty);

  const swr_GetStatus = useSWR("/api/get-status", (url) =>
    httpGet(url, { cache: "no-cache" }).then(Result$GetStatus.parse)
  );
  const pusherClientConfig = swr_GetStatus.data?.pusherClientConfig;
  const pusherClientConfig_appKey = pusherClientConfig?.appKey;
  const pusherClientConfig_cluster = pusherClientConfig?.cluster;

  const handleIncomingMessage = React.useCallback((rawEvent: unknown) => {
    const event = IncomingMessageEvent.parse(rawEvent);
    setThreadState((state) =>
      state.insertIncomingMessage({
        type: "IncomingMessage",
        direction: event.direction,
        text: event.text,
        entities: event.entities,
        createdAt: event.createdAt,
        nonce: event.nonce,
      })
    );
  }, []);

  React.useEffect(() => {
    if (
      !threadSecret_pusherChannelId ||
      !pusherClientConfig_appKey ||
      !pusherClientConfig_cluster
    )
      return;
    const pusher = new Pusher(pusherClientConfig_appKey, {
      cluster: pusherClientConfig_cluster,
    });
    const channel = pusher.subscribe(threadSecret_pusherChannelId);
    channel.bind("IncomingMessageEvent", handleIncomingMessage);
    return () =>
      void channel.unbind("IncomingMessageEvent", handleIncomingMessage);
  }, [
    threadSecret_pusherChannelId,
    handleIncomingMessage,
    pusherClientConfig_appKey,
    pusherClientConfig_cluster,
  ]);

  const loadPrevMessages =
    threadState_clean_after && threadSecret_threadPassword
      ? async (abortSignal?: AbortSignal) => {
          const data = await httpGet(
            getUrl(location.origin, "/api/get-prev-messages", {
              threadId,
              threadPassword: threadSecret_threadPassword,
              prior: threadState_clean_after,
              until: "yes",
            } satisfies Params$GetPrevMessages),
            { cache: "no-cache" }
          ).then(Result$GetPrevMessages.parse);
          abortSignal?.throwIfAborted();

          setThreadState((state) =>
            state.tryPrependPage(
              new Page({
                id: Date.now(),
                after: data.nextCursor,
                until: threadState_clean_after,
                messages: data.messages.toSorted(VariantMessage.compare),
              })
            )
          );
        }
      : undefined;

  const threadState_clean_until = threadState.clean.until;
  const loadNextMessages = threadSecret_threadPassword
    ? async (abortSignal?: AbortSignal) => {
        const data = await httpGet(
          getUrl(location.origin, "/api/get-next-messages", {
            threadId,
            threadPassword: threadSecret_threadPassword,
            after: threadState_clean_until,
          } satisfies Params$GetNextMessages),
          { cache: "no-cache" }
        ).then(Result$GetNextMessages.parse);
        abortSignal?.throwIfAborted();

        setThreadState((state) =>
          state
            .tryAppendPage(
              new Page({
                id: Date.now(),
                after: threadState_clean_until,
                until: data.nextCursor,
                messages: data.messages.toSorted(VariantMessage.compare),
              })
            )
            .chore()
        );
      }
    : undefined;

  const sendMessage = threadSecret_threadPassword
    ? async (text: string) => {
        const outgoingMessage: OutgoingMessage = {
          type: "OutgoingMessage",
          composedAt: Date.now(),
          direction: "from_mortal",
          text,
          nonce: Nonce.generate(),
        };
        setThreadState((state) => state.insertOutgoingMessage(outgoingMessage));

        const data = await httpPost(
          getUrl(location.origin, "/api/send-message"),
          {
            threadId,
            threadPassword: threadSecret_threadPassword,
            text: outgoingMessage.text,
            nonce: outgoingMessage.nonce,
          } satisfies Params$SendMessage
        ).then(Result$SendMessage.parse);

        setThreadState((state) =>
          state.acknowledgeOutgoingMessage(
            outgoingMessage.nonce,
            data.message.createdAt
          )
        );
      }
    : undefined;

  const pages = threadState.toPages();
  const oldestMessage = pages.find((p) => p.messages.length > 0)?.messages[0];
  const newestMessage = pages
    .toReversed()
    .find((p) => p.messages.length > 0)
    ?.messages.toReversed()[0];

  const approxDirtyPages = Math.floor(
    threadState.dirty.incomingMessages.length / 10
  );
  React.useEffect(() => {
    if (approxDirtyPages <= 0) return;
    const abortController = new AbortController();
    const abortSignal = abortController.signal;

    const handler = async () => {
      await sleep(1000);
      abortSignal.throwIfAborted();
      await loadNextMessages?.(abortSignal);
    };

    void handler().catch((e) => {
      if (!abortSignal.aborted) {
        throw e;
      }
    });

    return () => {
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approxDirtyPages, threadSecret_threadPassword]);

  return {
    pages,
    loadPrevMessages,
    loadNextMessages,
    sendMessage,
    minTimestamp: oldestMessage
      ? VariantMessage.getTimestamp(oldestMessage)
      : undefined,
    maxTimestamp: newestMessage
      ? VariantMessage.getTimestamp(newestMessage)
      : undefined,
    hasNoMorePreviousMessages: threadState.clean.after == null,
  };
}
