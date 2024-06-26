import React from "react";

import { SWRFallbackProvider } from "../components/SWRFallbackProvider";
import PageHome from "../containers/PageHome";

import { handle$GetStatus } from "./api/get-status/handle";
import { handle$GetTemplates } from "./api/get-templates/handle";

export default async function Route() {
  const [fallback_GetStatus, fallback_GetTemplates] = await Promise.all([
    handle$GetStatus(),
    handle$GetTemplates(),
  ]);

  return (
    <SWRFallbackProvider
      fallback={{
        "/api/get-status": fallback_GetStatus,
        "/api/get-templates": fallback_GetTemplates,
      }}
    >
      <PageHome />
    </SWRFallbackProvider>
  );
}
