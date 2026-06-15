import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Construction, Upload } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/recebimento/IconButton";
import { getModule, modules } from "@/lib/modules";
import { eventBus } from "@/lib/event-bus";
import { useTenant } from "@/lib/tenant";
import { FeatureNav } from "@/components/recebimento/FeatureNav";
import { ImportarXml } from "@/components/recebimento/ImportarXml";
import { HistoricoXml } from "@/components/recebimento/HistoricoXml";
import type { RecebimentoFeature } from "@/lib/recebimento/types";

export const Route = createFileRoute("/modules/$moduleId")({
  loader: ({ params }) => {
    const mod = getModule(params.moduleId);
    if (!mod) throw notFound();
    return { module: mod };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.module.name ?? "Módulo"} — WMS Platform` },
      {
        name: "description",
        content: loaderData?.module.description ?? "Módulo do sistema WMS.",
      },
    ],
  }),
  component: ModulePage,
  notFoundComponent: ModuleNotFound,
  errorComponent: ModuleError,
});

function RecebimentoModule() {
  const [feature, setFeature] = useState<RecebimentoFeature>("importar-xml");

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "1") setFeature("importar-xml");
    else if (e.key === "2") setFeature("historico-xml");
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  return (
    <section className="mt-8 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <FeatureNav active={feature} onSelect={setFeature} />
        <IconButton
          icon={Upload}
          label="Importar XML"
          description="Selecionar arquivo XML para processamento"
          size="md"
          onClick={() => setFeature("importar-xml")}
        />
      </div>
      <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
        {feature === "importar-xml" && <ImportarXml />}
        {feature === "historico-xml" && <HistoricoXml />}
      </div>
    </section>
  );
}

function ModulePage() {
  const { module } = Route.useLoaderData();
  const { tenant } = useTenant();
  const Icon = module.icon;

  useEffect(() => {
    eventBus.publish({ type: "module.opened", moduleId: module.id, tenantId: tenant.id });
  }, [module.id, tenant.id]);

  return (
    <AppShell>
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar ao dashboard
      </Link>

      <header className="mt-4 flex items-center gap-4">
        <div
          className="grid h-14 w-14 place-items-center rounded-xl border border-border/60"
          style={{ background: `color-mix(in oklab, ${module.accent} 12%, transparent)` }}
        >
          <Icon className="h-7 w-7" style={{ color: module.accent }} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{module.name}</h1>
          <p className="text-muted-foreground">{module.description}</p>
        </div>
      </header>

      {module.id === "recebimento" ? (
        <RecebimentoModule />
      ) : (
        <>
          <section className="mt-10 rounded-2xl border border-dashed border-border/70 bg-card/40 p-10 text-center">
            <Construction className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">Estrutura pronta para funcionalidades</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Este módulo já está integrado à arquitetura MultiTenant, ao Event Bus e ao controle
              de acesso. Futuras funcionalidades operacionais serão plugadas aqui sem alterações
              estruturais.
            </p>
          </section>
        </>
      )}

      <section className="mt-10">
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Outros módulos</h3>
        <div className="flex flex-wrap gap-2">
          {modules
            .filter((m) => m.id !== module.id && m.id !== "dashboard")
            .map((m) => (
              <Link
                key={m.id}
                to="/modules/$moduleId"
                params={{ moduleId: m.id }}
                className="rounded-full border border-border bg-card px-3 py-1 text-sm hover:border-primary/40"
              >
                {m.name}
              </Link>
            ))}
        </div>
      </section>
    </AppShell>
  );
}

function ModuleNotFound() {
  const { moduleId } = Route.useParams();
  return (
    <AppShell>
      <div className="py-20 text-center">
        <h1 className="text-2xl font-semibold">Módulo não encontrado</h1>
        <p className="mt-2 text-muted-foreground">"{moduleId}" não existe no registro.</p>
        <Button asChild className="mt-6">
          <Link to="/">Voltar ao dashboard</Link>
        </Button>
      </div>
    </AppShell>
  );
}

function ModuleError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <AppShell>
      <div className="py-20 text-center">
        <h1 className="text-2xl font-semibold">Erro ao carregar módulo</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <Button
          className="mt-6"
          onClick={() => {
            router.invalidate();
            reset();
          }}
        >
          Tentar novamente
        </Button>
      </div>
    </AppShell>
  );
}
