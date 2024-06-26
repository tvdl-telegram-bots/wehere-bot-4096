import React from "react";
import { SWRFallbackProvider } from "wehere-frontend/src/components/SWRFallbackProvider";
import PageThreadV3 from "wehere-frontend/src/containers/PageThreadV3";
import { z } from "zod";

import { handle$GetStatus } from "../../api/get-status/handle";

const Params = z.object({
  threadId: z.string(),
});

// https://nextjs.org/docs/app/api-reference/file-conventions/page
export default async function Route(ctx: { params: unknown }) {
  const fallback_GetStatus = await handle$GetStatus();

  const params = Params.parse(ctx.params);
  return (
    <SWRFallbackProvider
      fallback={{
        "/api/get-status": fallback_GetStatus,
      }}
    >
      <PageThreadV3 threadId={params.threadId} epoch={Date.now()} />;
    </SWRFallbackProvider>
  );
}
