import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://f814f068bb503107e8220e62fcd1b724@o4507493268324352.ingest.us.sentry.io/4507493594693632",

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  // ...

  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps
});
