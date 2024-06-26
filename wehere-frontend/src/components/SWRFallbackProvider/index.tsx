"use client";

import React from "react";
import { SWRConfig } from "swr";

type Props = {
  content?: React.ReactNode;
  children?: React.ReactNode;
  fallback: Record<string, unknown>;
};

export function SWRFallbackProvider({
  content,
  children = content,
  fallback,
}: Props) {
  return <SWRConfig value={{ fallback }}>{children}</SWRConfig>;
}
