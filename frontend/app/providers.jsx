"use client";

// eslint-disable-next-line import/no-extraneous-dependencies
import posthog from "posthog-js";
// eslint-disable-next-line import/no-extraneous-dependencies
import { PostHogProvider } from "posthog-js/react";

if (typeof window !== "undefined") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
  });
}

export default function PHProvider({ children }) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
