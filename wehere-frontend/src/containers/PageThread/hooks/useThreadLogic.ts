import Pusher from "pusher-js";
import React from "react";
import { NewMessage$PusherEvent } from "wehere-bot/src/typing/common";
import type { Params$GetNextMessages } from "wehere-frontend/src/app/api/get-next-messages/typing";
import { Result$GetNextMessages } from "wehere-frontend/src/app/api/get-next-messages/typing";
import type { Params$GetPrevMessages } from "wehere-frontend/src/app/api/get-prev-messages/typing";
import { Result$GetPrevMessages } from "wehere-frontend/src/app/api/get-prev-messages/typing";
import type { Params$SendMessage } from "wehere-frontend/src/app/api/send-message/typing";
import { Result$SendMessage } from "wehere-frontend/src/app/api/send-message/typing";
import type { OutgoingMessage } from "wehere-frontend/src/typing/common";
import { getUrl, httpGet, httpPost } from "wehere-frontend/src/utils/shared";

import { ThreadState } from "../classes/ThreadState";

export function useThreadLogic({
  threadId,
  threadPassword,
  pusherChannelId,
  epoch,
}: {
  threadId: string;
  threadPassword: string | null | undefined;
  pusherChannelId: string | null | undefined;
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
        createdAt: event.createdAt,
      })
    );
  }, []);

  React.useEffect(() => {
    if (!pusherChannelId) return;
    // TODO: get app id from env
    const pusher = new Pusher("efe46299f5b76a02250a", { cluster: "ap1" });
    const channel = pusher.subscribe(pusherChannelId);
    channel.bind("new-message", handleIncomingMessage);
    return () => void channel.unbind("new-message", handleIncomingMessage);
  }, [pusherChannelId]);

  const loadPrevMessages = threadPassword
    ? async () => {
        const data = await httpGet(
          getUrl(location.origin, "/api/get-prev-messages", {
            threadId,
            threadPassword: threadPassword,
            prior: state.oldestTimestamp(),
          } satisfies Params$GetPrevMessages)
        ).then(Result$GetPrevMessages.parse);
        setState((state) => state.withNewPriorEpochMessages(data.messages));
      }
    : undefined;

  const loadNextMessages = threadPassword
    ? async () => {
        const data = await httpGet(
          getUrl(location.origin, "/api/get-next-messages", {
            threadId,
            threadPassword: threadPassword,
            after: state.newestTimestamp(),
          } satisfies Params$GetNextMessages)
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

  return {
    state,
    loadPrevMessages,
    loadNextMessages,
    sendMessage,
  };
}
