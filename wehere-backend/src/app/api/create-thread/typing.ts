import {
  PersistentPusherSubscription,
  PersistentThread,
} from "wehere-bot/src/typing/server";
import { z } from "zod";

export type Result$CreateThread$WehereBackend = z.input<
  typeof Result$CreateThread$WehereBackend
>;
export const Result$CreateThread$WehereBackend = z.object({
  thread: PersistentThread,
  pusherSubscription: PersistentPusherSubscription,
});
