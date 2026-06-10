import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { modules } from "@/lib/modules";
import { eventBus } from "@/lib/event-bus";
import { useTenant } from "@/lib/tenant";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { tenant } = useTenant();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K opens global search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      // Alt + <digit> jumps to module by shortcut
      if (e.altKey && !e.metaKey && !e.ctrlKey) {
        const mod = modules.find((m) => m.shortcut === e.key);
        if (mod) {
          e.preventDefault();
          navigate({ to: "/modules/$moduleId", params: { moduleId: mod.id } });
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const go = (id: string) => {
    setOpen(false);
    eventBus.publish({ type: "search.performed", query: id, tenantId: tenant.id });
    if (id === "dashboard") navigate({ to: "/" });
    else navigate({ to: "/modules/$moduleId", params: { moduleId: id } });
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Pesquisar módulos e funcionalidades..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado.</CommandEmpty>
        <CommandGroup heading="Módulos">
          {modules.map((m) => (
            <CommandItem key={m.id} value={`${m.name} ${m.description}`} onSelect={() => go(m.id)}>
              <m.icon className="mr-2 h-4 w-4" />
              <span>{m.name}</span>
              <kbd className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                Alt+{m.shortcut}
              </kbd>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
