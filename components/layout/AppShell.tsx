"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Building2,
  Calculator,
  ChevronDown,
  FileText,
  LayoutDashboard,
  LogOut,
  Receipt,
  Search,
  Users,
} from "lucide-react";
import { SettingsMenu } from "@/components/layout/SettingsMenu";
import { useOwnerProfile } from "@/components/profile/OwnerProfileProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAutoGenerateReceipts } from "@/hooks/useAutoGenerateReceipts";
import { createClient } from "@/lib/supabase/client";
import { ownerDisplayName, ownerInitials } from "@/lib/owners";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/biens", label: "Biens", icon: Building2 },
  { href: "/locataires", label: "Locataires", icon: Users },
  { href: "/baux", label: "Baux", icon: FileText },
  { href: "/quittances", label: "Quittances", icon: Receipt },
  { href: "/calculateur", label: "Calculateur", icon: Calculator },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/biens") return pathname.startsWith("/biens") || pathname.startsWith("/bien");
  return pathname.startsWith(href);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useOwnerProfile();
  const [navReady, setNavReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  useAutoGenerateReceipts();

  useEffect(() => {
    setNavReady(true);
    createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/accueil");
    router.refresh();
  }

  const displayName = ownerDisplayName(profile);
  const initials = ownerInitials(profile);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 border-r border-sidebar-border bg-sidebar print:hidden md:flex md:flex-col">
        <Link href="/accueil" className="flex h-14 items-center gap-2 px-4 hover:bg-sidebar-accent/40">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="size-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Locagest</span>
        </Link>
        <Separator />
        <nav className="flex flex-1 flex-col gap-1 p-3">
          <p className="px-2 pb-2 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
            Gestion
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = navReady && isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/15 text-foreground shadow-xs ring-1 ring-primary/25"
                    : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-border px-4 print:hidden md:px-6">
          <Link href="/accueil" className="flex items-center gap-2 md:hidden">
            <Building2 className="size-4 text-primary" />
            <span className="text-sm font-semibold">Locagest</span>
          </Link>
          <div className="relative mx-auto hidden w-full max-w-xl md:block">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-9 bg-muted/40 pl-9" placeholder="Rechercher..." />
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell />
            </Button>
            <SettingsMenu />
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" className="gap-2 px-2" />}>
                <span className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                  {initials}
                </span>
                <span className="hidden text-sm sm:inline">{displayName}</span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-52">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Compte</DropdownMenuLabel>
                </DropdownMenuGroup>
                {email && <p className="px-1.5 pb-1 text-xs text-muted-foreground">{email}</p>}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/profil")}>Profil</DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2 print:hidden md:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = navReady && isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs",
                  active ? "bg-primary/15 text-foreground ring-1 ring-primary/25" : "text-muted-foreground",
                )}
              >
                <Icon className="size-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
