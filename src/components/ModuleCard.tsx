import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type { WmsModule } from "@/lib/modules";

interface Props {
  module: WmsModule;
}

export function ModuleCard({ module }: Props) {
  const Icon = module.icon;
  const to = module.id === "dashboard" ? "/" : "/modules/$moduleId";
  return (
    <Link
      to={to}
      params={{ moduleId: module.id }}
      className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border/60 bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div
        className="absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-25"
        style={{ background: module.accent }}
      />
      <div className="flex items-start justify-between">
        <div
          className="grid h-12 w-12 place-items-center rounded-xl border border-border/60"
          style={{ background: `color-mix(in oklab, ${module.accent} 12%, transparent)` }}
        >
          <Icon className="h-6 w-6" style={{ color: module.accent }} />
        </div>
        <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          Alt+{module.shortcut}
        </kbd>
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-semibold leading-tight">{module.name}</h3>
        <p className="text-sm text-muted-foreground">{module.description}</p>
      </div>

      <div className="mt-auto flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
        Abrir módulo
        <ArrowUpRight className="h-4 w-4" />
      </div>
    </Link>
  );
}
