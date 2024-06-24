import { z } from "zod";

export type ServerEnv = z.infer<typeof ServerEnv>;
export const ServerEnv = z.object({
  WEHERE_BACKEND_ORIGIN: z.string().url(),
  METADATA_BASE: z.string().url().nullish(),
});

export const SERVER_ENV = ServerEnv.parse({
  WEHERE_BACKEND_ORIGIN:
    process.env.WEHERE_BACKEND_ORIGIN ||
    decodeURIComponent(process.env.WEHERE_BACKEND_ORIGIN__URLENCODED || "") ||
    undefined,
  METADATA_BASE:
    process.env.METADATA_BASE ||
    decodeURIComponent(process.env.METADATA_BASE__URLENCODED || "") ||
    undefined,
});
