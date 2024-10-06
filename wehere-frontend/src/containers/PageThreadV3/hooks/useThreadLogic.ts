import Pusher from "pusher-js";
import React from "react";
import type { PusherClientConfig } from "wehere-bot/src/typing/common";
import { Nonce } from "wehere-bot/src/typing/common";
import { IncomingMessageEvent } from "wehere-bot/src/typing/pusher";
import type { Params$GetNextMessages } from "wehere-frontend/src/app/api/get-next-messages/typing";
import { Result$GetNextMessages } from "wehere-frontend/src/app/api/get-next-messages/typing";
import type { Params$GetPrevMessages } from "wehere-frontend/src/app/api/get-prev-messages/typing";
import { Result$GetPrevMessages } from "wehere-frontend/src/app/api/get-prev-messages/typing";
import type { Params$SendMessage } from "wehere-frontend/src/app/api/send-message/typing";
import { Result$SendMessage } from "wehere-frontend/src/app/api/send-message/typing";
import {
  VariantMessage,
  type OutgoingMessage,
} from "wehere-frontend/src/typing/common";
import {
  getUrl,
  httpGet,
  httpPost,
  sleep,
} from "wehere-frontend/src/utils/shared";

import { ThreadState } from "../classes/ThreadState";

export function useThreadLogic({
  threadId,
  threadPassword,
  pusherChannelId,
  pusherClientConfig,
  epoch,
}: {
  threadId: string;
  threadPassword: string | null | undefined;
  pusherChannelId: string | null | undefined;
  pusherClientConfig: PusherClientConfig | null | undefined;
  epoch: number;
}) {
  const [state, setState] = React.useState(ThreadState.createByEpoch(epoch));

  React.useEffect(() => {
    const intervalId = setInterval(
      () => setState((state) => state.cleaned()),
      10000
    );
    return () => clearInterval(intervalId);
  }, []);

  const handleIncomingMessage = React.useCallback((rawEvent: unknown) => {
    const event = IncomingMessageEvent.parse(rawEvent);
    setState((state) =>
      state.withNewIncomingMessage({
        type: "IncomingMessage",
        direction: event.direction,
        text: event.text,
        entities: event.entities,
        createdAt: event.createdAt,
        nonce: event.nonce,
      })
    );
  }, []);

  const pusherClientConfig_appKey = pusherClientConfig?.appKey;
  const pusherClientConfig_cluster = pusherClientConfig?.cluster;

  React.useEffect(() => {
    if (
      !pusherChannelId ||
      !pusherClientConfig_appKey ||
      !pusherClientConfig_cluster
    )
      return;
    const pusher = new Pusher(pusherClientConfig_appKey, {
      cluster: pusherClientConfig_cluster,
    });
    const channel = pusher.subscribe(pusherChannelId);
    channel.bind("IncomingMessageEvent", handleIncomingMessage);
    return () =>
      void channel.unbind("IncomingMessageEvent", handleIncomingMessage);
  }, [
    pusherChannelId,
    handleIncomingMessage,
    pusherClientConfig_appKey,
    pusherClientConfig_cluster,
  ]);

  const loadPrevMessages = threadPassword
    ? async () => {
        const data = await httpGet(
          getUrl(location.origin, "/api/get-prev-messages", {
            threadId,
            threadPassword: threadPassword,
            prior: state.oldestTimestamp(),
          } satisfies Params$GetPrevMessages),
          { cache: "no-cache" }
        ).then(Result$GetPrevMessages.parse);
        if (data.messages.length > 0) {
          setState((state) => state.withNewPriorEpochMessages(data.messages));
        } else {
          setState((state) => state.withNoMorePrevMessages(true));
        }
      }
    : undefined;

  const loadNextMessages = threadPassword
    ? async () => {
        const data = await httpGet(
          getUrl(location.origin, "/api/get-next-messages", {
            threadId,
            threadPassword: threadPassword,
            after: state.newestTimestamp(),
          } satisfies Params$GetNextMessages),
          { cache: "no-cache" }
        ).then(Result$GetNextMessages.parse);
        setState((state) => state.withNewSinceEpochMessages(data.messages));
      }
    : undefined;

  const sendMessage = threadPassword
    ? async (text: string) => {
        const outgoingMessage: OutgoingMessage = {
          type: "OutgoingMessage",
          composedAt: Date.now(),
          direction: "from_mortal",
          text,
          nonce: Nonce.generate(),
        };
        setState((state) => state.withNewOutgoingMessage(outgoingMessage));

        const data = await httpPost(
          getUrl(location.origin, "/api/send-message"),
          {
            threadId,
            threadPassword,
            text: outgoingMessage.text,
            nonce: outgoingMessage.nonce,
          } satisfies Params$SendMessage
        ).then(Result$SendMessage.parse);

        setState((state) =>
          state.withAcknowledgedOutgoingMessage(
            outgoingMessage.composedAt,
            data.message.createdAt
          )
        );
      }
    : undefined;

  const state_newestTimestamp = state.newestTimestamp();
  React.useEffect(() => {
    const run = async (signal: AbortSignal) => {
      await sleep(1000);
      signal.throwIfAborted();

      const data = await httpGet(
        getUrl(location.origin, "/api/get-next-messages", {
          threadId,
          threadPassword: threadPassword,
          after: state_newestTimestamp,
        } satisfies Params$GetNextMessages),
        { cache: "no-cache", signal }
      ).then(Result$GetNextMessages.parse);
      signal.throwIfAborted();

      setState((state) => state.withNewSinceEpochMessages(data.messages));
    };

    const abortController = new AbortController();
    const signal = abortController.signal;
    run(signal).catch((error) => signal.aborted || console.error(error));
    return () => abortController.abort();
  }, [state_newestTimestamp, threadId, threadPassword]);

  const sortedMessages: VariantMessage[] = React.useMemo(() => {
    const creationSet = new Set();
    state.priorEpochMessages.forEach((m) => creationSet.add(m.createdAt));
    state.sinceEpochMessages.forEach((m) => creationSet.add(m.createdAt));

    const nonceSet = new Set();
    state.priorEpochMessages.forEach((m) => m.nonce && nonceSet.add(m.nonce));
    state.sinceEpochMessages.forEach((m) => m.nonce && nonceSet.add(m.nonce));
    state.incomingMessages.forEach((m) => m.nonce && nonceSet.add(m.nonce));

    const a = state.priorEpochMessages.toReversed();
    const b = state.sinceEpochMessages;
    const c = state.incomingMessages.filter(
      (m) => !creationSet.has(m.createdAt)
    );
    const d = state.outgoingMessages.filter((m) => !nonceSet.has(m.nonce));
    return mergeSortedLists<VariantMessage>([a, b, c, d], (x) =>
      VariantMessage.getTimestamp(x)
    );
  }, [state]);

  return {
    state,
    loadPrevMessages,
    loadNextMessages,
    sendMessage,
    sortedMessages,
  };
}

function mergeSortedLists<T>(lists: T[][], keyfn: (value: T) => number) {
  const tops: [number, number, number][] = [];
  lists.forEach((values, i) => {
    if (values.length) {
      tops.push([keyfn(values[0]), i, 0]);
    }
  });

  const results: T[] = [];
  while (tops.length) {
    tops.sort((x, y) => y[0] - x[0]);
    const [_, i, j] = tops.pop()!;
    const values = lists[i];
    results.push(values[j]);
    if (j + 1 < values.length) {
      tops.push([keyfn(values[j + 1]), i, j + 1]);
    }
  }
  return results;
}
