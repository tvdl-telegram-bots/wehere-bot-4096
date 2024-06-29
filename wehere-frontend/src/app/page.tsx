import React from "react";

import { SWRFallbackProvider } from "../components/SWRFallbackProvider";
import { FallbackBuilder } from "../components/SWRFallbackProvider/classes";
import PageHome from "../containers/PageHome";

export default async function Route() {
  const fallback = await new FallbackBuilder()
    .pushPreset("cookie:theme")
    .pushPreset("/api/get-templates")
    .build();

  return (
    <SWRFallbackProvider fallback={fallback}>
      <PageHome />
    </SWRFallbackProvider>
  );
}
