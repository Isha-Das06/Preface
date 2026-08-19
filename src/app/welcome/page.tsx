import { redirect } from "next/navigation";
import { getBusiness } from "@/lib/queries";
import { WelcomeForm } from "./welcome-form";

/**
 * First run is for people who do not have a business yet.
 *
 * Anyone who already does is sent to the app. Without this the screen
 * is a dead end: Continue tries to create a second business, the
 * bootstrap policy correctly refuses it, and the only thing the
 * person sees is "Couldn't create your business" on a form that looks
 * like it should work. The logo picker was worse — it writes
 * immediately when a business exists, so a stray visit could change
 * the live logo of an account that was only browsing.
 */
export default async function WelcomePage() {
  const business = await getBusiness();
  if (business) redirect("/app");

  return <WelcomeForm />;
}
