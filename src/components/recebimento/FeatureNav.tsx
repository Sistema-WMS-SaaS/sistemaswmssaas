import { Upload, History } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecebimentoFeature } from "@/lib/recebimento/types";

interface FeatureItem {
  id: RecebimentoFeature;
  name: string;
  description: string;
  icon: typeof Upload;
  shortcut: string;
}

const features: FeatureItem[] = [
  {
    id: "importar-xml",
    name: "Importar XML",
    description: "Upload e validação de arquivos XML",
    icon: Upload,
    shortcut: "1",
  },
  {
    id: "historico-xml",
    name: "Histórico XML",
    description: "Consulta e auditoria de XMLs importados",
    icon: History,
    shortcut: "2",
  },
];

interface FeatureNavProps {
  active: RecebimentoFeature;
  onSelect: (id: RecebimentoFeature) => void;
}

export function FeatureNav({ active, onSelect }: FeatureNavProps) {
  return (
    <nav aria-label="Funcionalidades do Recebimento">
      <div className="flex flex-wrap gap-3">
        {features.map((f) => {
          const Icon = f.icon;
          const isActive = active === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onSelect(f.id)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-5 py-3.5 text-left transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                isActive
                  ? "border-primary/40 bg-primary/5 shadow-sm"
                  : "border-border/60 bg-card hover:border-primary/30 hover:shadow-sm",
              )}
            >
              <div
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-lg border",
                  isActive ? "border-primary/30" : "border-border/60",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                />
              </div>
              <div className="min-w-0">
                <div
                  className={cn(
                    "text-sm font-semibold leading-tight",
                    isActive ? "text-foreground" : "text-foreground/90",
                  )}
                >
                  {f.name}
                </div>
                <div className="text-xs text-muted-foreground">{f.description}</div>
              </div>
              <kbd className="ml-auto shrink-0 self-start rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                {f.shortcut}
              </kbd>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
