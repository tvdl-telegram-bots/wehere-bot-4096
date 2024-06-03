import type { Document } from "mongodb";

type StageKey =
  | "$addFields"
  | "$bucket"
  | "$bucketAuto"
  | "$changeStream"
  | "$changeStreamSplitLargeEvent"
  | "$collStats"
  | "$count"
  | "$densify"
  | "$documents"
  | "$facet"
  | "$fill"
  | "$geoNear"
  | "$graphLookup"
  | "$group"
  | "$indexStats"
  | "$limit"
  | "$listSampledQueries"
  | "$listSearchIndexes"
  | "$listSessions"
  | "$lookup"
  | "$match"
  | "$merge"
  | "$out"
  | "$planCacheStats"
  | "$project"
  | "$redact"
  | "$replaceRoot"
  | "$replaceWith"
  | "$sample"
  | "$search"
  | "$searchMeta"
  | "$set"
  | "$setWindowFields"
  | "$skip"
  | "$sort"
  | "$sortByCount"
  | "$unionWith"
  | "$unset"
  | "$unwind";

type Stage = Partial<Record<StageKey, unknown>>;

export function notNullish<T>(value: T | null | undefined): value is T {
  return value != null;
}

export function toPipeline(
  cb: () => Generator<Stage | null | undefined>
): Document[] {
  return Array.from(cb()).filter(notNullish);
}
