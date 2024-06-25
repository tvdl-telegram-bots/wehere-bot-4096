import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withSentryConfig(nextConfig, {
  org: "wehere",
  project: "wehere-bot",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: false,
});
