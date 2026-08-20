import { Users } from "lucide-react";
import { Card, EmptyState } from "@/components/ui";
import { AppPage } from "@/components/app/page-shell";
import { NewClientButton } from "@/components/app/new-client";
import { ClientList } from "@/components/app/client-list";
import { getClients, getWorkflows } from "@/lib/queries";

/** B2 — Clients. Search and status filter live in ClientList. */
export default async function ClientsPage({
  searchParams,
}: PageProps<"/app/clients">) {
  const { empty } = await searchParams;
  const clients = empty === "1" ? [] : await getClients();
  const workflows = await getWorkflows();

  if (clients.length === 0) {
    return (
      <AppPage title="Clients">
        <Card>
          <EmptyState
            icon={Users}
            title="No clients yet"
            description="Add your first one and we'll generate their onboarding link straight away."
            action={<NewClientButton workflows={workflows} />}
          />
        </Card>
      </AppPage>
    );
  }

  return (
    <AppPage
      title="Clients"
      description={`${clients.length} ${clients.length === 1 ? "client" : "clients"}`}
      actions={<NewClientButton workflows={workflows} />}
    >
      <ClientList clients={clients} />
    </AppPage>
  );
}
