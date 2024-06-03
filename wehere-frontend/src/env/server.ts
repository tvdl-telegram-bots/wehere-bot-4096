import { z } from "zod";

export type ServerEnv = z.infer<typeof ServerEnv>;
export const ServerEnv = z.object({
  WEHERE_BACKEND_ORIGIN: z.string().url(),
});

export const SERVER_ENV = ServerEnv.parse({
  WEHERE_BACKEND_ORIGIN: process.env.WEHERE_BACKEND_ORIGIN,
});
