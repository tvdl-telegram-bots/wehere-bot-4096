import React from "react";
import { z } from "zod";
import PageThread from "../../../containers/PageThread";

const Params = z.object({
  threadId: z.string(),
});

// https://nextjs.org/docs/app/api-reference/file-conventions/page
export default function Route(ctx: { params: unknown; searchParams: unknown }) {
  const params = Params.parse(ctx.params);
  const initialTimestamp: number = Date.now();

  return (
    <PageThread
      threadId={params.threadId}
      initialTimestamp={initialTimestamp}
    />
  );
}
