import React from "react";
import { SWRFallbackProvider } from "wehere-frontend/src/components/SWRFallbackProvider";
import { FallbackBuilder } from "wehere-frontend/src/components/SWRFallbackProvider/classes";
import PageAbout from "wehere-frontend/src/containers/PageAbout";

export default async function Route() {
  const fallback = await new FallbackBuilder()
    .pushPreset("cookie:theme")
    .build();

  return (
    <SWRFallbackProvider fallback={fallback}>
      <PageAbout />
    </SWRFallbackProvider>
  );
}
