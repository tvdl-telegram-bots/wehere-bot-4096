/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import type { MessageDirection, Timestamp } from "wehere-bot/src/typing/common";

import {
  Result$GetPrevMessages,
  type Params$GetPrevMessages,
} from "../../../app/api/get-prev-messages/typing";
import type { ThreadMessage } from "../../../typing";
import { getUrl } from "../../../utils/frontend";

type IncomingMessage = {
  createdAt: Timestamp;
  direction: MessageDirection;
  text: string;
};

type OutgoingMessage = {
  sentAt: Timestamp;
  text: string;
  abortController: AbortController;
};

type State = {
  since: number;
  until: number;
  threadMessages: ThreadMessage[];
  incomingMessages: IncomingMessage[];
  outgoingMessages: OutgoingMessage[];
};

export function useThreadLogic({
  threadId,
  threadPassword,
  pusherChannelId,
  initialTimestamp,
}: {
  threadId: string;
  threadPassword: string | null | undefined;
  pusherChannelId: string | null | undefined;
  initialTimestamp: number;
}) {
  const [state, setState] = React.useState<State>({
    since: initialTimestamp,
    until: initialTimestamp,
    threadMessages: [],
    incomingMessages: [],
    outgoingMessages: [],
  });

  const sendMessage =
    threadPassword == null
      ? null
      : async (text: string) => {
          const abortController = new AbortController();
          const abortSignal = abortController.signal;
          const outgoingMessage: OutgoingMessage = {
            sentAt: Date.now(),
            abortController,
            text,
          };
          setState((state) => ({
            ...state,
            outgoingMessages: [...state.outgoingMessages, outgoingMessage],
          }));

          try {
            const response = await fetch("/api/send-message", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              signal: abortSignal,
              body: JSON.stringify({ threadId, threadPassword, text }),
            });
            const data = await response.json();
            console.log({ data });
          } catch (e) {
            console.error({ error: e });
            setState((state) => ({
              ...state,
              outgoingMessages: state.outgoingMessages.filter(
                (m) => m !== outgoingMessage
              ),
            }));
          }
        };

  const loadPreviousMessages = async () => {
    try {
      const response = await fetch(
        getUrl("/api/get-prev-messages", {
          threadId,
          threadPassword: threadPassword,
          currentSince: state.since,
        } satisfies Params$GetPrevMessages)
      );
      // TODO: race condition
      const data = await response.json().then(Result$GetPrevMessages.parse);
      setState((state) => ({
        ...state,
        threadMessages: [...data.messages, ...state.threadMessages],
        since: Math.min(state.since, ...data.messages.map((m) => m.createdAt)),
      }));
      console.log(data);
    } catch (e) {
      console.error({ error: e });
    }
  };

  return { state, actions: { sendMessage, loadPreviousMessages } };
}
