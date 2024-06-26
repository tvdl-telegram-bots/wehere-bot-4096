import { PusherClientConfig, Timestamp } from "wehere-bot/src/typing/common";
import { Availability } from "wehere-frontend/src/typing/common";
import { z } from "zod";

export type Result$GetStatus = z.infer<typeof Result$GetStatus>;
export const Result$GetStatus = z.object({
  availability: Availability,
  pusherClientConfig: PusherClientConfig,
  serverTimestamp: Timestamp,
});
