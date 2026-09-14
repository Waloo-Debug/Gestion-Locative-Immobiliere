"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { OwnerProfileProvider } from "@/components/profile/OwnerProfileProvider";

const MARKETING_PREFIXES = ["/", "/accueil", "/connexion", "/inscription", "/invitation"];

function isMarketingPath(pathname: string) {
  if (pathname === "/") return true;
  return MARKETING_PREFIXES.some((prefix) => prefix !== "/" && (pathname === prefix || pathname.startsWith(`${prefix}/`)));
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const marketing = isMarketingPath(pathname);

  if (marketing) {
    return <>{children}</>;
  }

  return (
    <OwnerProfileProvider>
      <AppShell>{children}</AppShell>
    </OwnerProfileProvider>
  );
}
