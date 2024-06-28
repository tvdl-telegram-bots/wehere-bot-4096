import { ENV, FTL } from "wehere-backend/src/env";
import { createJsonResponse } from "wehere-backend/src/lib/backend/utils";
import { withDefaultRouteHandler } from "wehere-backend/src/utils/handler";
import { createApi, createI18n } from "wehere-bot/src/bot";
import {
  getAvailability,
  remindAllAngelsToUpdateAvailability,
} from "wehere-bot/src/bot/operations/availability";
import { assert } from "wehere-bot/src/utils/assert";
import { z } from "zod";

type DayRanges = z.infer<typeof DayRanges>;
const DayRanges = z
  .string()
  .regex(/^[0-9]{4}-[0-9]{4}$/)
  .array();

type DayOfWeek = z.infer<typeof DayOfWeek>;
const DayOfWeek = z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);

type HanoiWeeklySchedule = z.infer<typeof HanoiWeeklySchedule>;
const HanoiWeeklySchedule = z.record(DayOfWeek, DayRanges);

type Slot = z.infer<typeof Slot>;
const Slot = z.object({ offset: z.number(), length: z.number() });

type Schedule = z.infer<typeof Schedule>;
const Schedule = z.object({
  period: z.number(),
  slots: Slot.array(),
});

function fromHHMM(value: string): number {
  if (value === "2400") return 86400000;
  const hh = z.coerce.number().int().min(0).max(23).parse(value.slice(0, 2));
  const mm = z.coerce.number().int().min(0).max(59).parse(value.slice(2, 4));
  return hh * 3600000 + mm * 60000;
}

const DAY_OF_WEEK_TO_OFFSET: Record<DayOfWeek, number> = {
  thu: 0 * 86400000,
  fri: 1 * 86400000,
  sat: 2 * 86400000,
  sun: 3 * 86400000,
  mon: 4 * 86400000,
  tue: 5 * 86400000,
  wed: 6 * 86400000,
};

function fromHanoiWeeklySchedule(value: HanoiWeeklySchedule): Schedule {
  const ONE_WEEK = 604800000;
  const HANOI_OFFSET = 25200000; // 7 hours, because of UTC+7

  const slots: Slot[] = [];
  for (const key of Object.values(DayOfWeek.Enum)) {
    for (const dayRange of value[key] || []) {
      const matched = /^([0-9]{4})-([0-9]{4})$/.exec(dayRange);
      assert(matched, "invalid day range");
      const since = fromHHMM(matched[1]);
      const until = fromHHMM(matched[2]);
      assert(until >= since, "until must be greater than since");
      slots.push({
        offset: mod(
          since - HANOI_OFFSET + DAY_OF_WEEK_TO_OFFSET[key],
          ONE_WEEK
        ),
        length: until - since,
      });
    }
  }
  return { period: ONE_WEEK, slots };
}

function mod(dividend: number, divisor: number) {
  return ((dividend % divisor) + divisor) % divisor;
}

function isWithinSchedule(timestamp: number, schedule: Schedule): boolean {
  return schedule.slots.some(
    (slot) => mod(timestamp - slot.offset, schedule.period) < slot.length
  );
}

// TODO: read from db.collection["config"]
const WEHERE_SCHEDULE = fromHanoiWeeklySchedule({
  mon: ["2000-2300"],
  wed: ["2000-2300"],
  fri: ["2000-2300"],
  sun: ["2000-2300"],
});

export const GET = withDefaultRouteHandler(async (_request, ctx) => {
  const timestamp = Date.now();
  const observed = await getAvailability(ctx).then((r) => r.value);
  const expected = isWithinSchedule(timestamp, WEHERE_SCHEDULE);

  if (observed !== expected) {
    const api = await createApi(ENV);
    const i18n = await createI18n(FTL);
    await remindAllAngelsToUpdateAvailability(
      { ...ctx, api, i18n },
      { expected, observed, timestamp }
    );
  }

  return createJsonResponse(200, { timestamp, observed, expected });
});
