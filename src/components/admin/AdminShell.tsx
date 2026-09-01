import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  Bell,
  ClipboardList,
  CreditCard,
  FileText,
  Flag,
  Gift,
  LayoutDashboard,
  LineChart,
  LogOut,
  Mail,
  Menu,
  Package,
  Search,
  Send,
  Settings,
  Shield,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Logo } from "@/components/brand/Logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { signOut } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABELS, can, type AdminResource, type AdminRole } from "@/lib/adminRbac";
import { getMyAdminIdentity } from "@/lib/admin/dashboard.functions";
import {
  listAdminNotifications,
  markAdminNotificationRead,
} from "@/lib/admin/notifications.functions";
import { globalAdminSearch } from "@/lib/admin/search.functions";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Se assente, la voce è sempre visibile (impostazioni personali, non un permesso legato a un ruolo). */
  resource?: AdminResource;
}

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Panoramica",
    items: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard, resource: "analytics" },
      { to: "/admin/analytics", label: "Analytics", icon: LineChart, resource: "analytics" },
    ],
  },
  {
    title: "Clienti",
    items: [
      { to: "/admin/users", label: "Utenti", icon: Users, resource: "users" },
      {
        to: "/admin/subscriptions",
        label: "Abbonamenti",
        icon: CreditCard,
        resource: "subscriptions",
      },
      { to: "/admin/payments", label: "Pagamenti", icon: CreditCard, resource: "payments" },
      { to: "/admin/referrals", label: "Referral", icon: Gift, resource: "referrals" },
    ],
  },
  {
    title: "Marketing",
    items: [
      { to: "/admin/leads", label: "Lead", icon: Mail, resource: "marketing" },
      {
        to: "/admin/email-templates",
        label: "Modelli email",
        icon: FileText,
        resource: "marketing",
      },
      { to: "/admin/campaigns", label: "Campagne", icon: Send, resource: "marketing" },
    ],
  },
  {
    title: "Prodotto",
    items: [
      { to: "/admin/plans", label: "Piani", icon: Package, resource: "plans" },
      { to: "/admin/features", label: "Feature flags", icon: Flag, resource: "features" },
    ],
  },
  {
    title: "Governance",
    items: [
      { to: "/admin/audit-logs", label: "Audit log", icon: ClipboardList, resource: "audit_logs" },
      {
        to: "/admin/administrators",
        label: "Amministratori",
        icon: Shield,
        resource: "administrators",
      },
    ],
  },
  {
    title: "Sistema",
    items: [
      { to: "/admin/settings", label: "Impostazioni", icon: Settings, resource: "settings" },
      { to: "/admin/system", label: "Stato sistema", icon: AlertTriangle, resource: "system" },
      { to: "/admin/security", label: "Sicurezza", icon: ShieldCheck },
    ],
  },
];

function useAdminIdentity() {
  const fetchIdentity = useServerFn(getMyAdminIdentity);
  return useQuery({
    queryKey: ["admin-identity"],
    queryFn: () => fetchIdentity(),
    staleTime: 60_000,
  });
}

function NavLinks({
  role,
  onNavigate,
}: {
  role: AdminRole | undefined;
  onNavigate?: (() => void) | undefined;
}) {
  const linkClass =
    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground";
  const activeClass = "bg-sidebar-accent text-foreground";

  return (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
      {NAV_SECTIONS.map((section) => {
        const items = section.items.filter(
          (item) => !item.resource || !role || can(role, item.resource, "read"),
        );
        if (items.length === 0) return null;
        return (
          <div key={section.title} className="space-y-1">
            <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
              {section.title}
            </p>
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={linkClass}
                activeProps={{ className: activeClass }}
                activeOptions={{ exact: item.to === "/admin" }}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </div>
        );
      })}
    </nav>
  );
}

function NotificationBell() {
  const queryClient = useQueryClient();
  const fetchNotifications = useServerFn(listAdminNotifications);
  const markRead = useServerFn(markAdminNotificationRead);
  const { data } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: () => fetchNotifications(),
    refetchInterval: 60_000,
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const severityDot: Record<string, string> = {
    info: "bg-sky-500",
    warning: "bg-amber-500",
    critical: "bg-red-500",
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifiche">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-4 py-3 text-sm font-semibold">Notifiche</div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">Nessuna notifica.</p>
          )}
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={async () => {
                if (!n.isRead) {
                  await markRead({ data: { id: n.id } });
                  void queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
                }
              }}
              className={cn(
                "flex w-full items-start gap-2.5 border-b border-border/60 px-4 py-3 text-left text-sm last:border-b-0 hover:bg-secondary",
                !n.isRead && "bg-secondary/40",
              )}
            >
              <span
                className={cn(
                  "mt-1.5 size-2 shrink-0 rounded-full",
                  severityDot[n.severity] ?? "bg-muted",
                )}
              />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{n.title}</span>
                {n.body && (
                  <span className="block truncate text-xs text-muted-foreground">{n.body}</span>
                )}
                <span className="block text-[11px] text-muted-foreground/70">
                  {new Date(n.created_at).toLocaleString("it-IT")}
                </span>
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function GlobalSearch() {
  const navigate = useNavigate();
  const search = useServerFn(globalAdminSearch);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Awaited<ReturnType<typeof search>> | null>(null);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults(null);
      return;
    }
    const timer = setTimeout(() => {
      search({ data: { query: query.trim() } })
        .then(setResults)
        .catch(() => setResults(null));
    }, 300);
    return () => clearTimeout(timer);
  }, [query, open, search]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="hidden gap-2 text-muted-foreground sm:flex"
        onClick={() => setOpen(true)}
      >
        <Search className="size-3.5" />
        Cerca
        <kbd className="ml-2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px]">
          ⌘K
        </kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="sm:hidden"
        onClick={() => setOpen(true)}
        aria-label="Cerca"
      >
        <Search className="size-5" />
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Cerca utenti, abbonamenti, pagamenti…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {query.trim().length < 2 ? "Digita almeno 2 caratteri…" : "Nessun risultato."}
          </CommandEmpty>
          {results && results.users.length > 0 && (
            <CommandGroup heading="Utenti">
              {results.users.map((u) => (
                <CommandItem
                  key={u.id}
                  onSelect={() => {
                    setOpen(false);
                    void navigate({ to: "/admin/users/$id", params: { id: u.id } });
                  }}
                >
                  {u.name || u.email || u.id}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {results && results.subscriptions.length > 0 && (
            <CommandGroup heading="Abbonamenti">
              {results.subscriptions.map((s) => (
                <CommandItem key={s.id} onSelect={() => setOpen(false)}>
                  {s.user_email} — {s.status}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {results && results.payments.length > 0 && (
            <CommandGroup heading="Pagamenti">
              {results.payments.map((p) => (
                <CommandItem key={p.id} onSelect={() => setOpen(false)}>
                  {p.user_email} — {p.amount ?? "?"} — {p.status}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

function MfaNudgeBanner({ pathname }: { pathname: string }) {
  const { data: hasFactor, isLoading } = useQuery({
    queryKey: ["admin-mfa-factors-check"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) return true; // In dubbio non disturbare: il blocco reale è server-side su requireStepUpMfa.
      return (data?.totp ?? []).some((f) => f.status === "verified");
    },
    staleTime: 60_000,
  });

  if (isLoading || hasFactor || pathname === "/admin/security") return null;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
      <span>
        La verifica in due passaggi non è attiva sul tuo account. Alcune azioni (gestione
        amministratori, eliminazione utenti) resteranno bloccate finché non la attivi.
      </span>
      <Link to="/admin/security" className="shrink-0 font-medium underline underline-offset-2">
        Attiva ora
      </Link>
    </div>
  );
}

export function AdminShell({
  title,
  description,
  breadcrumb,
  actions,
  children,
}: {
  title: string;
  description?: string;
  breadcrumb?: string[];
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const identity = useAdminIdentity();

  async function handleLogout() {
    await signOut();
    void navigate({ to: "/" });
  }

  const crumbs = breadcrumb ?? ["Admin", title];

  const sidebarInner = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <Link to="/admin" onClick={onNavigate} className="flex items-center gap-2">
          <Logo className="h-7 w-auto" />
          <Badge variant="outline" className="text-[10px]">
            ADMIN
          </Badge>
        </Link>
      </div>
      <NavLinks role={identity.data?.role} onNavigate={onNavigate} />
      <div className="border-t border-sidebar-border p-3">
        <Link
          to="/dashboard"
          className="block px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          ← Torna all'app
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]" key={location.pathname}>
      <aside className="hidden border-r border-sidebar-border bg-sidebar lg:sticky lg:top-0 lg:block lg:h-screen">
        {sidebarInner()}
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" aria-label="Menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0">
              {sidebarInner(() => setOpen(false))}
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] text-muted-foreground">{crumbs.join(" / ")}</p>
            <h1 className="truncate text-base font-semibold">{title}</h1>
            {description && <p className="truncate text-xs text-muted-foreground">{description}</p>}
          </div>

          <div className="flex items-center gap-1.5">
            {actions}
            <GlobalSearch />
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <span className="hidden max-w-[10rem] truncate sm:inline">
                    {identity.data?.email ?? "…"}
                  </span>
                  {identity.data?.role && (
                    <Badge variant="secondary" className="text-[10px]">
                      {ROLE_LABELS[identity.data.role]}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="truncate">{identity.data?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 size-4" />
                  Esci
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8">
          <MfaNudgeBanner pathname={location.pathname} />
          {children}
        </main>
      </div>
    </div>
  );
}
