import Pusher from "pusher-js";
import React from "react";
import type { PusherClientConfig } from "wehere-bot/src/typing/common";
import {
  EmojiUpdated$PusherEvent,
  NewMessage$PusherEvent,
} from "wehere-bot/src/typing/common";
import type { Params$GetNextMessages } from "wehere-frontend/src/app/api/get-next-messages/typing";
import { Result$GetNextMessages } from "wehere-frontend/src/app/api/get-next-messages/typing";
import type { Params$GetPrevMessages } from "wehere-frontend/src/app/api/get-prev-messages/typing";
import { Result$GetPrevMessages } from "wehere-frontend/src/app/api/get-prev-messages/typing";
import type { Params$SendMessage } from "wehere-frontend/src/app/api/send-message/typing";
import { Result$SendMessage } from "wehere-frontend/src/app/api/send-message/typing";
import type { OutgoingMessage } from "wehere-frontend/src/typing/common";
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
    const event = NewMessage$PusherEvent.parse(rawEvent);
    setState((state) =>
      state.withNewIncomingMessage({
        direction: event.direction,
        text: event.text,
        entities: event.entities,
        createdAt: event.createdAt,
      })
    );
  }, []);

  const handleEmojiUpdated = React.useCallback((rawEvent: unknown) => {
    const event = EmojiUpdated$PusherEvent.parse(rawEvent);
    setState((state) =>
      state.withEmojiUpdated(event.threadMessageCreatedAt, event.emoji)
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
    channel.bind("new-message", handleIncomingMessage);
    channel.bind("emoji-updated", handleEmojiUpdated);
    return () => void channel.unbind("new-message", handleIncomingMessage);
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
          composedAt: Date.now(),
          direction: "from_mortal",
          text,
        };
        setState((state) => state.withNewOutgoingMessage(outgoingMessage));

        const data = await httpPost(
          getUrl(location.origin, "/api/send-message"),
          {
            threadId,
            threadPassword,
            text: outgoingMessage.text,
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

  return {
    state,
    loadPrevMessages,
    loadNextMessages,
    sendMessage,
  };
}
