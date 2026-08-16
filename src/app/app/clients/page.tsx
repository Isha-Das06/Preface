import { Users } from "lucide-react";
import { Card, EmptyState } from "@/components/ui";
import { AppPage } from "@/components/app/page-shell";
import { NewClientButton } from "@/components/app/new-client";
import { ClientList } from "@/components/app/client-list";
import { clients } from "@/lib/mock-app";

/** B2 — Clients. Search and status filter live in ClientList. */
export default async function ClientsPage({
  searchParams,
}: PageProps<"/app/clients">) {
  const { empty } = await searchParams;
  const rows = empty === "1" ? [] : clients;

  if (rows.length === 0) {
    return (
      <AppPage title="Clients">
        <Card>
          <EmptyState
            icon={Users}
            title="No clients yet"
            description="Add your first one and we'll generate their onboarding link straight away."
            action={<NewClientButton />}
          />
        </Card>
      </AppPage>
    );
  }

  return (
    <AppPage
      title="Clients"
      description={`${rows.length} clients`}
      actions={<NewClientButton />}
    >
      <ClientList clients={rows} />
    </AppPage>
  );
}
