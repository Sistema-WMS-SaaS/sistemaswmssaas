import { Link } from "@tanstack/react-router";
import { Search, Boxes } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlobalSearch } from "./GlobalSearch";
import { TenantProvider, useTenant } from "@/lib/tenant";

function Header() {
  const { tenant } = useTenant();
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Boxes className="h-5 w-5" />
          </div>
          <span className="hidden sm:inline">WMS Platform</span>
        </Link>

        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
          }}
          className="ml-auto flex h-10 flex-1 max-w-md items-center gap-2 rounded-lg border border-input bg-muted/40 px-3 text-sm text-muted-foreground transition hover:bg-muted"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Pesquisar módulos...</span>
          <kbd className="rounded bg-background px-1.5 py-0.5 text-[10px] font-mono">⌘K</kbd>
        </button>

        <div className="hidden items-center gap-2 md:flex">
          <Badge variant={tenant.environment === "production" ? "default" : "secondary"}>
            {tenant.environment === "production" ? "Produção" : "Homologação"}
          </Badge>
          <Badge variant="outline">{tenant.name}</Badge>
        </div>

        <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
          Sair
        </Button>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <TenantProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <GlobalSearch />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
        <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
          WMS Platform · MultiTenant SaaS · v0.1
        </footer>
      </div>
    </TenantProvider>
  );
}
