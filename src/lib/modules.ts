import {
  PackageOpen,
  Warehouse,
  MapPin,
  ListChecks,
  Truck,
  ClipboardList,
  Users,
  Radio,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";

export interface WmsModule {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  shortcut: string; // alphanumeric quick key
  accent: string; // CSS color token reference
}

/**
 * Central module registry. Adding a new module here automatically
 * exposes it in the dashboard, global search and keyboard shortcuts —
 * no structural changes required in other modules.
 */
export const modules: WmsModule[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    description: "Visão geral de indicadores e operações.",
    icon: LayoutDashboard,
    shortcut: "0",
    accent: "var(--chart-1)",
  },
  {
    id: "recebimento",
    name: "Recebimento",
    description: "Entrada de mercadorias e conferência de cargas.",
    icon: PackageOpen,
    shortcut: "1",
    accent: "var(--chart-2)",
  },
  {
    id: "armazenagem",
    name: "Armazenagem",
    description: "Guarda e controle físico de estoque.",
    icon: Warehouse,
    shortcut: "2",
    accent: "var(--chart-3)",
  },
  {
    id: "enderecamento",
    name: "Endereçamento",
    description: "Mapeamento de posições e localização de itens.",
    icon: MapPin,
    shortcut: "3",
    accent: "var(--chart-4)",
  },
  {
    id: "separacao",
    name: "Separação",
    description: "Picking e preparação de pedidos.",
    icon: ListChecks,
    shortcut: "4",
    accent: "var(--chart-5)",
  },
  {
    id: "expedicao",
    name: "Expedição",
    description: "Saída de cargas e roteirização.",
    icon: Truck,
    shortcut: "5",
    accent: "var(--chart-1)",
  },
  {
    id: "inventario",
    name: "Inventário",
    description: "Contagens cíclicas e ajustes de estoque.",
    icon: ClipboardList,
    shortcut: "6",
    accent: "var(--chart-2)",
  },
  {
    id: "mao-de-obra",
    name: "Gestão de Mão de Obra",
    description: "Produtividade, escalas e desempenho operacional.",
    icon: Users,
    shortcut: "7",
    accent: "var(--chart-3)",
  },
  {
    id: "radiofrequencia",
    name: "Radiofrequência",
    description: "Operações por coletores RF e dispositivos móveis.",
    icon: Radio,
    shortcut: "8",
    accent: "var(--chart-4)",
  },
];

export const getModule = (id: string) => modules.find((m) => m.id === id);
