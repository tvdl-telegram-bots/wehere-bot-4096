import React from "react";
import PageThread from "wehere-frontend/src/containers/PageThread";
import { z } from "zod";

const Params = z.object({
  threadId: z.string(),
});

// https://nextjs.org/docs/app/api-reference/file-conventions/page
export default function Route(ctx: { params: unknown; searchParams: unknown }) {
  const params = Params.parse(ctx.params);
  return <PageThread threadId={params.threadId} epoch={Date.now()} />;
}
