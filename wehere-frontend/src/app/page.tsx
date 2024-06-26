import React from "react";

import { SWRFallbackProvider } from "../components/SWRFallbackProvider";
import PageHome from "../containers/PageHome";

import { handle$GetTemplates } from "./api/get-templates/handle";

export default async function Route() {
  const fallback_GetTemplates = await handle$GetTemplates();

  return (
    <SWRFallbackProvider
      fallback={{ "/api/get-templates": fallback_GetTemplates }}
    >
      <PageHome />
    </SWRFallbackProvider>
  );
}
