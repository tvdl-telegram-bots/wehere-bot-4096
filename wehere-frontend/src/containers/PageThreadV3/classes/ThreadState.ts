import type { Emoji, Nonce, Timestamp } from "wehere-bot/src/typing/common";
import { assert } from "wehere-bot/src/utils/assert";
import type {
  IncomingMessage,
  OutgoingMessage,
  ThreadMessage,
} from "wehere-frontend/src/typing/common";

import { ImmutableMap } from "./ImmutableMap";

// TODO: Let's change ThreadState to:
// - oldCursor (nullable), newCursor, oldMessages, newMessages
// - optimisticUpdates (OutgoingMessage, IncomingMessage, MessageUpdate, MessageReactionUpdate)
// - dirtyMessages: Map<Timestamp, Timestamp>

export class ThreadState {
  public readonly epoch: number;
  public readonly priorEpochMessages: ThreadMessage[]; // sorted descending
  public readonly sinceEpochMessages: ThreadMessage[]; // sorted ascending
  // optimistic updates
  public readonly outgoingMessages: OutgoingMessage[]; // order not guaranteed
  public readonly incomingMessages: IncomingMessage[]; // order not guaranteed
  public readonly angelEmojiDict: ImmutableMap<Timestamp, Emoji | null>;
  public readonly mortalEmojiDict: ImmutableMap<Timestamp, Emoji | null>;
  // flags
  public readonly noMorePrevMessages: boolean;

  constructor(init: {
    epoch: number;
    sinceEpochMessages: ThreadMessage[];
    priorEpochMessages: ThreadMessage[];
    outgoingMessages: OutgoingMessage[];
    incomingMessages: IncomingMessage[];
    angelEmojiDict: ImmutableMap<Timestamp, Emoji | null>;
    mortalEmojiDict: ImmutableMap<Timestamp, Emoji | null>;
    noMorePrevMessages: boolean;
  }) {
    this.epoch = init.epoch;
    this.priorEpochMessages = init.priorEpochMessages;
    this.sinceEpochMessages = init.sinceEpochMessages;
    this.outgoingMessages = init.outgoingMessages;
    this.incomingMessages = init.incomingMessages;
    this.angelEmojiDict = init.angelEmojiDict;
    this.mortalEmojiDict = init.mortalEmojiDict;
    this.noMorePrevMessages = init.noMorePrevMessages;

    if (process.env.NODE_ENV !== "production") {
      this.check();
    }
  }

  static createByEpoch(epoch: number) {
    return new ThreadState({
      epoch,
      sinceEpochMessages: [],
      priorEpochMessages: [],
      outgoingMessages: [],
      incomingMessages: [],
      angelEmojiDict: new ImmutableMap(),
      mortalEmojiDict: new ImmutableMap(),
      noMorePrevMessages: false,
    });
  }

  check() {
    assert(
      this.priorEpochMessages.every(
        (item, index, array) =>
          item.createdAt < (index ? array[index - 1].createdAt : this.epoch)
      )
    );
    assert(
      this.sinceEpochMessages.every(
        (item, index, array) =>
          item.createdAt > (index ? array[index - 1].createdAt : this.epoch)
      )
    );
  }

  toPlainObject() {
    return {
      epoch: this.epoch,
      sinceEpochMessages: this.sinceEpochMessages,
      priorEpochMessages: this.priorEpochMessages,
      outgoingMessages: this.outgoingMessages,
      incomingMessages: this.incomingMessages,
      angelEmojiDict: this.angelEmojiDict,
      mortalEmojiDict: this.mortalEmojiDict,
      noMorePrevMessages: this.noMorePrevMessages,
    };
  }

  oldestTimestamp(): number {
    return this.priorEpochMessages.reduce(
      (result, item) => Math.min(result, item.createdAt),
      this.epoch
    );
  }

  newestTimestamp(): number {
    return this.sinceEpochMessages.reduce(
      (result, item) => Math.max(result, item.createdAt),
      this.epoch
    );
  }

  withNewPriorEpochMessages(messages: ThreadMessage[]) {
    const oldestTimestamp = this.oldestTimestamp();
    return new ThreadState({
      ...this.toPlainObject(),
      priorEpochMessages: [
        ...this.priorEpochMessages,
        ...messages.filter((item) => item.createdAt < oldestTimestamp),
      ],
    });
  }

  withNewSinceEpochMessages(messages: ThreadMessage[]) {
    const newestTimestamp = this.newestTimestamp();
    return new ThreadState({
      ...this.toPlainObject(),
      sinceEpochMessages: [
        ...this.sinceEpochMessages,
        ...messages.filter((item) => item.createdAt > newestTimestamp),
      ],
    });
  }

  withNewOutgoingMessage(message: OutgoingMessage) {
    return new ThreadState({
      ...this.toPlainObject(),
      outgoingMessages: [...this.outgoingMessages, message],
    });
  }

  withAcknowledgedOutgoingMessage(nonce: Nonce, createdAt: number) {
    return new ThreadState({
      ...this.toPlainObject(),
      outgoingMessages: this.outgoingMessages.map((item) =>
        item.nonce === nonce ? { ...item, sentAt: createdAt } : item
      ),
    });
  }

  withNoMorePrevMessages(value: boolean) {
    return new ThreadState({
      ...this.toPlainObject(),
      noMorePrevMessages: value,
    });
  }

  cleaned() {
    return new ThreadState({
      ...this.toPlainObject(),
      outgoingMessages: this.outgoingMessages.filter(
        (item) =>
          !this.sinceEpochMessages.some((jtem) => jtem.nonce === item.nonce)
      ),
      incomingMessages: this.incomingMessages.filter(
        (item) =>
          !this.sinceEpochMessages.some((jtem) => jtem.nonce === item.nonce)
      ),
    });
  }

  withNewIncomingMessage(message: IncomingMessage) {
    return new ThreadState({
      ...this.toPlainObject(),
      incomingMessages: [...this.incomingMessages, message],
    });
  }
}
