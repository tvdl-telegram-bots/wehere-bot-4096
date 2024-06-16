import type { UseStore } from "idb-keyval";
import * as IdbKeyval from "idb-keyval";
import React from "react";
import type { ThreadSecret } from "wehere-frontend/src/typing/common";
import { z } from "zod";

type EncodedThreadSecret = z.infer<typeof EncodedThreadSecret>;
const EncodedThreadSecret = z.tuple([
  z.string(),
  z.string().nullish(),
  z.string().nullish(),
  z.string().nullish(),
  z.number(),
  z.string().nullish(),
]);

function encode(x: ThreadSecret): EncodedThreadSecret {
  return [
    x.threadId,
    x.threadPassword,
    x.threadName,
    x.threadEmoji,
    x.threadCreatedAt,
    x.pusherChannelId,
  ];
}

function decode(y: EncodedThreadSecret): ThreadSecret {
  return {
    threadId: y[0],
    threadPassword: y[1],
    threadName: y[2],
    threadEmoji: y[3],
    threadCreatedAt: y[4],
    pusherChannelId: y[5],
  };
}

function doesExist<T>(value: T | null | undefined): value is T {
  return value != null;
}

class ThreadDb {
  private readonly store: UseStore;

  constructor() {
    // Do not change the names here. If needed, read this article carefully:
    // https://github.com/jakearchibald/idb-keyval/blob/main/custom-stores.md
    this.store = IdbKeyval.createStore("thread-db", "keyval");
  }

  async get(threadId: string): Promise<ThreadSecret | undefined> {
    const tail = await IdbKeyval.get(threadId, this.store);
    if (!Array.isArray(tail)) return undefined;
    const sp = EncodedThreadSecret.safeParse([threadId, ...tail]);
    if (!sp.success) return undefined;
    return decode(sp.data);
  }

  async getAll(): Promise<ThreadSecret[]> {
    const rawEntries = await IdbKeyval.entries(this.store);
    const parsedEntries = rawEntries.map(([threadId, tail]) => {
      if (!Array.isArray(tail)) return undefined;
      const sp = EncodedThreadSecret.safeParse([threadId, ...tail]);
      if (!sp.success) return undefined;
      return decode(sp.data);
    });
    return parsedEntries.filter(doesExist);
  }

  async set(threadSecret: ThreadSecret): Promise<void> {
    const [head, ...tail] = encode(threadSecret);
    await IdbKeyval.set(head, tail, this.store);
  }
}

export function useThreadDb() {
  const [threadDb, setThreadDb] = React.useState<ThreadDb>();
  React.useEffect(() => {
    setThreadDb(new ThreadDb());
    return () => setThreadDb(undefined);
  }, []);
  return threadDb;
}
