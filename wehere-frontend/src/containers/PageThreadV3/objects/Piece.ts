import type { MessageDirection } from "wehere-bot/src/typing/common";
import type {
  IncomingMessage,
  OutgoingMessage,
  ThreadMessage,
} from "wehere-frontend/src/typing/common";

import type { ThreadState } from "../classes/ThreadState";

export type Piece =
  | { type: "ThreadMessage"; payload: ThreadMessage }
  | { type: "OutgoingMessage"; payload: OutgoingMessage }
  | { type: "IncomingMessage"; payload: IncomingMessage };

function fromThreadMessage(message: ThreadMessage): Piece {
  return { type: "ThreadMessage", payload: message };
}

function fromOutgoingMessage(message: OutgoingMessage): Piece {
  return { type: "OutgoingMessage", payload: message };
}

function fromIncomingMessage(message: IncomingMessage): Piece {
  return { type: "IncomingMessage", payload: message };
}

export function getPieceDirection(piece: Piece): MessageDirection {
  switch (piece.type) {
    case "ThreadMessage":
      return piece.payload.direction;
    case "OutgoingMessage":
      return piece.payload.direction;
    case "IncomingMessage":
      return piece.payload.direction;
  }
}

export function getPieceTime(piece: Piece): number {
  switch (piece.type) {
    case "ThreadMessage":
      return piece.payload.createdAt;
    case "OutgoingMessage":
      return piece.payload.createdAt || piece.payload.composedAt;
    case "IncomingMessage":
      return piece.payload.createdAt;
  }
}

export function toSortedPieces(state: ThreadState): Piece[] {
  // sorted and unique items from priorEpochMessages and sinceEpochMessages
  const a = [
    ...state.priorEpochMessages.toReversed().map(fromThreadMessage),
    ...state.sinceEpochMessages.map(fromThreadMessage),
  ];

  // sorted and unique items from incomingMessages and outgoingMessages
  const b = [
    ...state.incomingMessages.map(fromIncomingMessage),
    ...state.outgoingMessages
      .filter((m) => !state.incomingMessages.some((m0) => m0.text === m.text)) // TODO: use composedAt to compare instead
      .map(fromOutgoingMessage),
  ]
    .toSorted((a, b) => getPieceTime(a) - getPieceTime(b))
    .filter((_, i, z) => !i || getPieceTime(z[i]) != getPieceTime(z[i - 1]));

  // merge two sorted lists, remove duplicates if needed
  const c = [];
  for (let i = 0, j = 0; i < a.length || j < b.length; ) {
    const p = i == a.length ? Number.MAX_VALUE : getPieceTime(a[i]);
    const q = j == b.length ? Number.MAX_VALUE : getPieceTime(b[j]);
    p < q ? c.push(a[i++]) : p > q ? c.push(b[j++]) : j++;
  }

  c.forEach((piece, index, array) => {
    const timestamp = piece.payload.createdAt;
    if (typeof timestamp === "number") {
      const newEmoji = state.emojiDict.get(timestamp);
      if (newEmoji !== undefined) {
        array[index] = {
          ...piece,
          payload: { ...piece.payload, emoji: newEmoji },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
      }
    }
  });
  return c;
}
