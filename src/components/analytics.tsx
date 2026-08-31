"use client";

import { Analytics as VercelAnalytics } from "@vercel/analytics/next";

/**
 * Visitor counts for the marketing site and the app — never the
 * client portal.
 *
 * A portal URL is /o/<token>, and that token IS the credential: it
 * is the entire reason the link opens without a password. Handing
 * those paths to an analytics service would file a working key in
 * a third party's logs, so portal events are dropped outright
 * rather than trusted to be stripped somewhere downstream.
 *
 * Cookie-free and anonymous, which is what keeps this off the list
 * of things needing a consent banner.
 */
export function Analytics() {
  return (
    <VercelAnalytics
      beforeSend={(event) =>
        new URL(event.url).pathname.startsWith("/o/") ? null : event
      }
    />
  );
}
