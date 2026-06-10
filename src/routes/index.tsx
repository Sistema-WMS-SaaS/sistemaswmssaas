import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ModuleCard } from "@/components/ModuleCard";
import { modules } from "@/lib/modules";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WMS Platform — Dashboard" },
      {
        name: "description",
        content:
          "Plataforma WMS MultiTenant SaaS — central de módulos: recebimento, armazenagem, separação, expedição e mais.",
      },
      { property: "og:title", content: "WMS Platform — Dashboard" },
      {
        property: "og:description",
        content: "Plataforma WMS MultiTenant SaaS modular e escalável.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const operational = modules.filter((m) => m.id !== "dashboard");

  return (
    <AppShell>
      <section className="mb-10">
        <p className="text-sm font-medium text-muted-foreground">Painel principal</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
          Bem-vindo à WMS Platform
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Selecione um módulo para começar. Use{" "}
          <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">⌘K</kbd> para
          pesquisar ou{" "}
          <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">Alt + número</kbd>{" "}
          para acesso rápido.
        </p>
      </section>

      <section aria-label="Módulos">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {operational.map((m) => (
            <ModuleCard key={m.id} module={m} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
