import { assert } from "wehere-bot/src/utils/assert";
import type {
  IncomingMessage,
  OutgoingMessage,
  ThreadMessage,
} from "wehere-frontend/src/typing/common";

export class ThreadState {
  public readonly epoch: number;
  public readonly priorEpochMessages: ThreadMessage[]; // sorted descending
  public readonly sinceEpochMessages: ThreadMessage[]; // sorted ascending
  public readonly outgoingMessages: OutgoingMessage[]; // order not guaranteed
  public readonly incomingMessages: IncomingMessage[]; // order not guaranteed
  public readonly noMorePrevMessages: boolean;

  constructor(init: {
    epoch: number;
    sinceEpochMessages: ThreadMessage[];
    priorEpochMessages: ThreadMessage[];
    outgoingMessages: OutgoingMessage[];
    incomingMessages: IncomingMessage[];
    noMorePrevMessages: boolean;
  }) {
    this.epoch = init.epoch;
    this.priorEpochMessages = init.priorEpochMessages;
    this.sinceEpochMessages = init.sinceEpochMessages;
    this.outgoingMessages = init.outgoingMessages;
    this.incomingMessages = init.incomingMessages;
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

  withAcknowledgedOutgoingMessage(composedAt: number, createdAt: number) {
    return new ThreadState({
      ...this.toPlainObject(),
      outgoingMessages: this.outgoingMessages.map((item) =>
        item.composedAt === composedAt ? { ...item, createdAt } : item
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
          !item.createdAt ||
          !this.sinceEpochMessages.some(
            (jtem) => jtem.createdAt === item.createdAt
          )
      ),
      incomingMessages: this.incomingMessages.filter(
        (item) =>
          !this.sinceEpochMessages.some(
            (jtem) => jtem.createdAt === item.createdAt
          )
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
