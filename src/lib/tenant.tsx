import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * Tenant context — single source of truth for the active tenant.
 * In production this will be hydrated from the authenticated session
 * (JWT claim / subdomain). For now we expose a stub so the UI is
 * already tenant-aware.
 */
export interface Tenant {
  id: string;
  name: string;
  environment: "production" | "staging";
}

interface TenantContextValue {
  tenant: Tenant;
  setTenant: (t: Tenant) => void;
}

const defaultTenant: Tenant = {
  id: "demo",
  name: "Demo Tenant",
  environment: (import.meta.env.MODE === "production" ? "production" : "staging"),
};

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant>(defaultTenant);
  const value = useMemo(() => ({ tenant, setTenant }), [tenant]);
  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used within TenantProvider");
  return ctx;
}
