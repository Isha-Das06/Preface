import { AppPage } from "@/components/app/page-shell";
import { NewClientButton } from "@/components/app/new-client";
import { ClientList } from "@/components/app/client-list";
import { FirstRun } from "@/components/app/first-run";
import { getClients, getWorkflows } from "@/lib/queries";

/**
 * B2 — Clients. The app root. Search and status filter live in
 * ClientList, and so does the nudge, so a stalled client can be
 * chased from the screen where you notice they are stalled.
 */
export default async function ClientsPage({
  searchParams,
}: PageProps<"/app/clients">) {
  const { empty } = await searchParams;
  const clients = empty === "1" ? [] : await getClients();
  const workflows = await getWorkflows();

  /**
   * Day one gets the activation checklist rather than a bare "no
   * clients yet" card. It used to live on the old Waiting-on page,
   * which was the app root; this is the root now, so it comes here
   * rather than being lost with that page.
   */
  if (clients.length === 0) {
    return (
      <AppPage
        title="Welcome to Preface"
        description="One link between a client saying yes and the work starting."
      >
        <FirstRun workflows={workflows} />
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
