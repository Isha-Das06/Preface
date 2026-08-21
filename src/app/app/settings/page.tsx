import { Settings as SettingsIcon } from "lucide-react";
import { Card, EmptyState } from "@/components/ui";
import { AppPage } from "@/components/app/page-shell";
import { SettingsForm } from "@/components/app/settings-form";
import { getBusiness } from "@/lib/queries";

/**
 * B9 — Settings. Deliberately short.
 *
 * Branding, email, reminders. No teams, no permissions, no custom
 * domains, no integrations tab. Fifty settings is how a simple
 * product stops feeling simple.
 */
export default async function SettingsPage() {
  const business = await getBusiness();

  if (!business) {
    return (
      <AppPage title="Settings" className="max-w-[720px]">
        <Card>
          <EmptyState
            icon={SettingsIcon}
            title="No business set up yet"
            description="Finish creating your business and your settings will appear here."
          />
        </Card>
      </AppPage>
    );
  }

  return (
    <AppPage
      title="Settings"
      description="Branding, email and reminders."
      className="max-w-[720px]"
    >
      <SettingsForm business={business} />
    </AppPage>
  );
}
