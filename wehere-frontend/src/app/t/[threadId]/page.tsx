import React from "react";
import { SWRFallbackProvider } from "wehere-frontend/src/components/SWRFallbackProvider";
import { FallbackBuilder } from "wehere-frontend/src/components/SWRFallbackProvider/classes";
import PageThreadV3 from "wehere-frontend/src/containers/PageThreadV3";
import { z } from "zod";

const Params = z.object({
  threadId: z.string(),
});

// https://nextjs.org/docs/app/api-reference/file-conventions/page
export default async function Route(ctx: { params: unknown }) {
  const params = Params.parse(ctx.params);
  const fallback = await new FallbackBuilder()
    .pushPreset("cookie:theme")
    .build();
  return (
    <SWRFallbackProvider fallback={fallback}>
      <PageThreadV3 threadId={params.threadId} epoch={Date.now()} />
    </SWRFallbackProvider>
  );
}
