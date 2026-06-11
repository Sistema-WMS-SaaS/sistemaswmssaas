import type { LucideIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: { button: "h-8 w-8", icon: "h-4 w-4" },
  md: { button: "h-10 w-10", icon: "h-5 w-5" },
  lg: { button: "h-12 w-12", icon: "h-6 w-6" },
} as const;

const variantStyles = {
  default:
    "border-border/60 text-muted-foreground hover:border-primary/50 hover:text-foreground hover:shadow-sm",
  destructive:
    "border-destructive/40 text-destructive/70 hover:border-destructive hover:text-destructive hover:shadow-sm",
} as const;

export interface IconButtonProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  size?: keyof typeof sizeMap;
  variant?: keyof typeof variantStyles;
  type?: "button" | "submit" | "reset";
}

export function IconButton({
  icon: Icon,
  label,
  description,
  shortcut,
  onClick,
  disabled = false,
  className,
  size = "md",
  variant = "default",
  type = "button",
}: IconButtonProps) {
  const dims = sizeMap[size];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type={type}
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          title={label}
          className={cn(
            "inline-flex items-center justify-center rounded-lg border bg-transparent transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
            "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
            variantStyles[variant],
            dims.button,
            className,
          )}
        >
          <Icon className={cn(dims.icon, "shrink-0")} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="center" className="max-w-56 text-xs">
        <div className="font-medium">{label}</div>
        {description && (
          <div className="mt-0.5 text-muted-foreground">{description}</div>
        )}
        {shortcut && (
          <kbd className="mt-1.5 inline-block rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider">
            {shortcut}
          </kbd>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
