import { z } from "zod";

import * as Telegram from "./telegram";

export type Env = z.infer<typeof Env>;
export const Env = z.object({
  TELEGRAM_BOT_TOKEN: z.string(),
  MONGODB_URI: z.string().startsWith("mongodb"),
  MONGODB_DBNAME: z.string().min(1),
  PORT: z.coerce.number().default(3070),
  HOST: z.string().default("0.0.0.0"),
  PUSHER_URI: z.string().startsWith("pusher"),
});

export type Ftl = z.infer<typeof Ftl>;
export const Ftl = z.object({
  en: z.string(),
  vi: z.string(),
});

export const UserId = z.coerce.number().int().safe();
export type UserId = z.infer<typeof UserId>;

export const Timestamp = z.coerce.number().int().safe();
export type Timestamp = z.infer<typeof Timestamp>;

export const ChatId = z.coerce.number().int().safe();
export type ChatId = z.infer<typeof UserId>;

export const MessageId = z.coerce.number().int().safe();
export type MessageId = z.infer<typeof UserId>;

export const MessageDirection = z.enum(["from_mortal", "from_angel"]);
export type MessageDirection = z.infer<typeof MessageDirection>;

export const ThreadPlatform = z.enum(["web", "telegram"]);
export type ThreadPlatform = z.infer<typeof ThreadPlatform>;

export const Role = z.enum(["mortal", "angel", "admin"]);
export type Role = z.infer<typeof Role>;

export const Locale = z.enum(["en", "vi"]);
export type Locale = z.infer<typeof Locale>;

export type Entities = z.infer<typeof Entities>;
export const Entities = Telegram.MessageEntity.array();

export type ImageHandle = z.infer<typeof ImageHandle>;
export const ImageHandle = z.object({
  id: z.string(),
  extension: z.string(),
  filesize: z.number(),
  height: z.number(),
  width: z.number(),
  url: z.string(),
});

export type PusherOptions = z.infer<typeof PusherOptions>;
export const PusherOptions = z.object({
  appId: z.string().regex(/^[0-9]+$/),
  key: z.string().regex(/^[0-9a-f]+$/),
  secret: z.string().regex(/^[0-9a-f]+$/),
  cluster: z.enum([
    "mt1",
    "us2",
    "us3",
    "eu",
    "ap1",
    "ap2",
    "ap3",
    "ap4",
    "sa1",
  ]),
  useTLS: z.any().transform((value) => value === true || value === "true"),
});

export type PusherClientConfig = z.infer<typeof PusherClientConfig>;
export const PusherClientConfig = z.object({
  appKey: z.string(),
  cluster: z.string(),
});

export type NewMessage$PusherEvent = z.infer<typeof NewMessage$PusherEvent>;
export const NewMessage$PusherEvent = z.object({
  direction: MessageDirection,
  text: z.string().nullish(),
  entities: Telegram.MessageEntity.array().nullish(),
  createdAt: Timestamp,
});

export type TemplateKey = z.infer<typeof TemplateKey>;
export const TemplateKey = z.enum([
  "auto_reply_when_available",
  "auto_reply_when_unavailable",
  "starting_question_1_prompt",
  "starting_question_1_answer",
  "starting_question_2_prompt",
  "starting_question_2_answer",
  "starting_question_3_prompt",
  "starting_question_3_answer",
  "starting_question_4_prompt",
  "starting_question_4_answer",
]);
