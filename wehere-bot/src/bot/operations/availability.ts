import { InlineKeyboard } from "grammy";
import type { Db } from "mongodb";
import type { WithoutId } from "mongodb";
import type { BotContext } from "wehere-bot/src/types";
import type { Locale, Timestamp } from "wehere-bot/src/typing/common";
import type { PersistentAngelSubscription } from "wehere-bot/src/typing/server";
import {
  PersistentThreadMessage,
  type PersistentObjectId,
  PersistentAvailability,
} from "wehere-bot/src/typing/server";
import { html } from "wehere-bot/src/utils/format";
import { getWehereUrlV2 } from "wehere-bot/src/utils/parse";

import { getAngelSubscriptions } from "./angel";
import { getChatLocale } from "./chat_";
import {
  createMessage,
  joinPromisesGracefully,
  notifyNewMessage,
} from "./message";
import { readTemplate } from "./template";

type ParsedAvailability = {
  value: boolean;
  since: Timestamp | null;
};

export async function notifyChangedAvailability(
  ctx: Pick<BotContext, "db" | "api" | "i18n" | "pusher">
) {
  const angels: PersistentAngelSubscription[] =
    await getAngelSubscriptions(ctx);
  const availability = await getAvailability(ctx);
  const promises: Promise<void>[] = angels.map(async (angel) => {
    const locale = await getChatLocale(ctx, angel.chatId);
    await ctx.api.sendMessage(
      angel.chatId,
      availability.value
        ? ctx.i18n.withLocale(locale)("html-we-are-available") //
        : ctx.i18n.withLocale(locale)("html-we-are-unavailable"),
      { parse_mode: "HTML" }
    );
  });
  await joinPromisesGracefully(ctx, promises);
}

export async function setAvailability(
  ctx: { db: Db },
  { value }: { value: boolean }
) {
  const ack = await ctx.db
    .collection("availability") //
    .insertOne({
      createdAt: Date.now(),
      value,
    } satisfies WithoutId<PersistentAvailability>);
  return ack;
}

export async function getAvailability(ctx: {
  db: Db;
}): Promise<ParsedAvailability> {
  const persistentAvailability = await ctx.db
    .collection("availability")
    .findOne({}, { sort: { createdAt: -1 }, limit: 1 })
    .then(PersistentAvailability.parse)
    .catch(() => undefined);

  if (!persistentAvailability) {
    return { value: false, since: null };
  } else {
    return {
      value: persistentAvailability.value,
      since: persistentAvailability.createdAt,
    };
  }
}

async function composeMessage(
  ctx: Pick<BotContext, "db" | "i18n">,
  {
    threadId,
    locale,
    available,
  }: { threadId: PersistentObjectId; locale: Locale; available: boolean }
): Promise<WithoutId<PersistentThreadMessage>> {
  const customTemplate = available
    ? await readTemplate(ctx, "auto_reply_when_available")
    : await readTemplate(ctx, "auto_reply_when_unavailable");
  const text = customTemplate
    ? customTemplate.text
    : available
      ? ctx.i18n.withLocale(locale)("html-auto-reply-when-available")
      : ctx.i18n.withLocale(locale)("html-auto-reply-when-unavailable");
  const entities = customTemplate?.entities || undefined;

  return {
    threadId,
    direction: "from_angel",
    originChatId: null,
    originMessageId: null,
    text,
    entities,
    plainText: !!text && text.length <= 2048 && !entities?.length,
    createdAt: Date.now(),
  };
}

export async function isAutoReplyNeeded(
  ctx: { db: Db },
  { threadId }: { threadId: PersistentObjectId }
) {
  try {
    const availability = await getAvailability(ctx);

    const lastMessage = await ctx.db
      .collection("thread_message")
      .findOne(
        { threadId, direction: "from_mortal" },
        { sort: { createdAt: -1 }, limit: 1 }
      )
      .then(PersistentThreadMessage.parse)
      .catch(() => undefined);

    // We compare two timestamps:
    // 1. the last message from mortal
    // 2. the last update of availability
    // If the last message is newer than the last update of availability,
    // we don't send the auto-reply.

    if (!lastMessage?.createdAt) return true;
    if (!availability.since) return false;
    return lastMessage.createdAt < availability.since;
  } catch (e) {
    // just for safety
    console.error(e);
    return false;
  }
}

export async function autoReply(
  ctx: Pick<BotContext, "db" | "api" | "i18n" | "pusher">,
  { threadId, locale }: { threadId: PersistentObjectId; locale: Locale }
) {
  const availability = await getAvailability(ctx);
  const message = await composeMessage(ctx, {
    threadId,
    locale,
    available: availability.value,
  });
  const persistentThreadMessage = await createMessage(ctx, { message });
  await notifyNewMessage(ctx, { message: persistentThreadMessage });
}

export async function remindAllAngelsToUpdateAvailability(
  ctx: Pick<BotContext, "db" | "api" | "i18n">,
  params: { expected: boolean; observed: boolean; timestamp: number }
) {
  const angels = await getAngelSubscriptions(ctx);
  const promises = angels.map(async (angel) => {
    const locale = await getChatLocale(ctx, angel.chatId);
    await ctx.api.sendMessage(
      angel.chatId,
      html.i(
        locale == "vi" && params.expected
          ? getRandomElement(FRIENDLY_START_DUTY_REMINDERS)
          : locale == "vi" && !params.expected
            ? getRandomElement(FRIENDLY_END_DUTY_REMINDERS)
            : ctx.i18n.withLocale(locale)("html-please-update-availability")
      ),
      {
        parse_mode: "HTML",
        reply_markup: params.expected
          ? new InlineKeyboard().text(
              ctx.i18n.withLocale(locale)("text-set-available"),
              getWehereUrlV2("availability", "/set", { value: true })
            )
          : new InlineKeyboard().text(
              ctx.i18n.withLocale(locale)("text-set-unavailable"),
              getWehereUrlV2("availability", "/set", { value: false })
            ),
      }
    );
  });
  await joinPromisesGracefully(ctx, promises);
}

function getRandomElement<T>(choices: T[]): T {
  if (!choices.length) throw new RangeError();
  const i = Math.floor(Math.random() * choices.length);
  return choices[i];
}

const FRIENDLY_START_DUTY_REMINDERS = [
  "20:00 rồi! Đến giờ trực rồi mọi người nhé!",
  "Chào buổi tối, đã đến giờ trực rồi!",
  "Đồng hồ điểm 8 giờ tối! Sẵn sàng hỗ trợ nhé!",
  "Chúc mọi người buổi trực hiệu quả!",
  "Giờ trực tối đã đến, hãy luôn sẵn sàng!",
  "Thời gian trực đã đến, hãy cùng nhau hỗ trợ nhé!",
  "20:00, chuẩn bị đón nhận những chia sẻ từ mọi người!",
  "Chào mọi người, đã đến giờ trực tối!",
  "Buổi trực tối bắt đầu, hãy giữ tinh thần hỗ trợ!",
  "Chào cả nhà, giờ trực đã đến, chúng ta cùng cố gắng nhé!",
  "Đến giờ trực rồi, chuẩn bị nhé mọi người!",
  "20:00 rồi, chúng ta cùng bắt đầu trực tối!",
  "Chúc buổi trực tối của bạn trôi qua nhẹ nhàng!",
  "Đã đến giờ trực, hãy luôn bên cạnh để lắng nghe!",
  "Thời gian trực tối bắt đầu, hãy cùng nhau hỗ trợ!",
  "Mọi người ơi, giờ trực đã đến!",
  "Chúng ta cùng nhau bắt đầu buổi trực tối nào!",
  "Đã đến giờ trực, hãy sẵn sàng lắng nghe và chia sẻ!",
  "Chào cả nhà, giờ trực tối đã bắt đầu!",
  "20:00, cùng nhau sẵn sàng hỗ trợ nhé!",
  "Chúc mọi người buổi trực tối đầy ý nghĩa!",
  "Giờ trực tối đã điểm, hãy luôn sẵn sàng!",
  "Chúc các bạn buổi trực tối thành công!",
  "Chúng ta cùng bắt đầu buổi trực tối nhé!",
  "Đã đến giờ trực, hãy cùng nhau hỗ trợ tối nay!",
  "Chào cả nhà, đến giờ trực rồi!",
  "Buổi trực tối đã bắt đầu, chúng ta hãy sẵn sàng!",
  "20:00 rồi, chuẩn bị đón nhận những chia sẻ từ mọi người!",
  "Đã đến giờ trực tối, hãy cùng nhau cố gắng!",
  "Chào buổi tối, giờ trực đã đến!",
  "Giờ trực tối bắt đầu, hãy sẵn sàng nhé!",
  "Thời gian trực đã đến, chuẩn bị thôi!",
  "20:00 rồi, chúc mọi người buổi trực hiệu quả!",
  "Chúng ta cùng nhau bắt đầu buổi trực tối nào!",
  "Giờ trực đã đến, hãy cùng nhau chia sẻ!",
  "Chào cả nhà, giờ trực tối bắt đầu!",
  "Chúc các bạn buổi trực tối trôi qua nhẹ nhàng!",
  "20:00 rồi, chuẩn bị đón nhận những chia sẻ từ mọi người!",
  "Đã đến giờ trực tối, hãy cùng nhau hỗ trợ!",
  "Giờ trực đã đến, hãy luôn sẵn sàng nhé!",
  "Buổi trực tối đã bắt đầu, chúc mọi người sức khỏe!",
  "Đến giờ trực rồi, hãy luôn bên cạnh để lắng nghe!",
  "20:00 rồi, hãy cùng nhau chia sẻ và hỗ trợ!",
  "Chúc mọi người buổi trực tối thành công và ý nghĩa!",
  "Đã đến giờ trực tối, chuẩn bị nhé mọi người!",
  "Giờ trực tối đã bắt đầu, hãy luôn sẵn sàng!",
  "Chúc các bạn buổi trực tối trôi qua nhẹ nhàng và hiệu quả!",
  "20:00 rồi, chúng ta cùng bắt đầu trực tối!",
  "Thời gian trực tối đã đến, hãy cùng nhau hỗ trợ!",
  "Chào buổi tối, giờ trực đã đến, chúng ta cùng cố gắng nhé!",
];

const FRIENDLY_END_DUTY_REMINDERS = [
  "23:00 rồi, mọi người tắt máy nghỉ ngơi nhé!",
  "Ca trực đã kết thúc, chúc mọi người ngủ ngon!",
  "Đã hết giờ trực, mọi người nghỉ ngơi nhé!",
  "Cảm ơn vì ca trực hôm nay, giờ thì nghỉ ngơi thôi!",
  "Đã 23:00, đến giờ nghỉ rồi, tắt máy thôi!",
  "Ca trực tối nay đã hoàn thành, chúc mọi người ngủ ngon!",
  "Thời gian trực đã hết, tắt máy và nghỉ ngơi nào!",
  "23:00 rồi, giờ là lúc để nghỉ ngơi!",
  "Ca trực đã kết thúc, chúc mọi người một đêm yên bình!",
  "Cảm ơn mọi người, giờ là lúc tắt máy nghỉ ngơi!",
  "Ca trực đã xong, chúc bạn ngủ ngon!",
  "23:00 rồi, nghỉ ngơi thôi mọi người!",
  "Đã hết giờ trực, cảm ơn và chúc mọi người ngủ ngon!",
  "Ca trực hôm nay đã hoàn thành, nghỉ ngơi nhé!",
  "Đã 23:00, chúc bạn một đêm an lành!",
  "Ca trực đã kết thúc, hãy dành thời gian nghỉ ngơi!",
  "23:00 rồi, đến lúc nghỉ ngơi và phục hồi sức khỏe!",
  "Cảm ơn vì đã hoàn thành ca trực, giờ thì nghỉ ngơi thôi!",
  "Giờ trực đã hết, tắt máy và thư giãn nào!",
  "23:00 rồi, ca trực đã kết thúc, nghỉ ngơi nhé!",
  "Ca trực đã xong, chúc mọi người một giấc ngủ ngon!",
  "Hết giờ trực rồi, tắt máy và nghỉ ngơi thôi!",
  "Cảm ơn vì ca trực tối nay, giờ là lúc nghỉ ngơi!",
  "23:00 rồi, đến lúc kết thúc ca trực và thư giãn!",
  "Ca trực đã kết thúc, chúc mọi người nghỉ ngơi tốt!",
  "Hết giờ trực, tắt máy và có một đêm yên bình nhé!",
  "Cảm ơn mọi người, đã đến lúc nghỉ ngơi rồi!",
  "23:00, đã đến lúc kết thúc ca trực và nghỉ ngơi!",
  "Ca trực hôm nay đã xong, chúc bạn ngủ ngon!",
  "Hết giờ trực rồi, cảm ơn và nghỉ ngơi nhé!",
  "Đã 23:00, đến lúc nghỉ ngơi và tắt máy!",
  "Ca trực đã hoàn thành, chúc mọi người một đêm an lành!",
  "Đã hết giờ trực, tắt máy và thư giãn nhé!",
  "23:00 rồi, ca trực đã kết thúc, chúc mọi người ngủ ngon!",
  "Ca trực hôm nay đã kết thúc, giờ là lúc nghỉ ngơi!",
  "Cảm ơn vì đã hoàn thành ca trực, giờ thì tắt máy thôi!",
  "Hết giờ trực rồi, đến lúc nghỉ ngơi và phục hồi sức khỏe!",
  "23:00 rồi, tắt máy và nghỉ ngơi nhé!",
  "Ca trực đã xong, chúc bạn một giấc ngủ ngon!",
  "Cảm ơn mọi người vì ca trực hôm nay, giờ là lúc nghỉ ngơi!",
  "23:00 rồi, đã đến lúc tắt máy và nghỉ ngơi!",
  "Ca trực hôm nay đã hoàn thành, chúc mọi người ngủ ngon!",
  "Đã hết giờ trực, giờ thì tắt máy và nghỉ ngơi nhé!",
  "Cảm ơn mọi người, đến lúc nghỉ ngơi rồi!",
  "23:00, giờ là lúc kết thúc ca trực và thư giãn!",
  "Ca trực đã kết thúc, chúc mọi người một đêm yên bình!",
  "Hết giờ trực rồi, cảm ơn và nghỉ ngơi thôi!",
  "Đã 23:00, đến lúc nghỉ ngơi và tắt máy!",
  "Ca trực đã hoàn thành, giờ là lúc thư giãn và ngủ ngon!",
  "23:00 rồi, chúc mọi người ngủ ngon và nghỉ ngơi tốt!",
];
