import { redirect } from "next/navigation";

/**
 * The app root, which is now Clients.
 *
 * This was "Waiting on": the same clients, sorted by who had been
 * stuck longest, with a nudge button on each row. The nudge has moved
 * into the Clients table, which is where someone notices a stalled
 * client in the first place — so this page had nothing of its own
 * left, and the nav had two entries showing the same people.
 *
 * Kept as a redirect rather than deleted. `/app` is where login
 * lands, where the middleware sends anyone signed out, and where a
 * year of bookmarks and old emails point.
 */
export default function AppRoot() {
  redirect("/app/clients");
}
