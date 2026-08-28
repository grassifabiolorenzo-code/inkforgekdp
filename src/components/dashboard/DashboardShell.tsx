import { Link, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  User,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { TOOLS } from "@/config/tools";
import { signOut } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

import { ToolIcon } from "@/components/tools/ToolIcon";

interface NavItem {
  to: string;
  label: string;
  icon?: LucideIcon;
  toolIndex?: number;
}

const mainNav: NavItem[] = [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }];
const accountNav: NavItem[] = [
  { to: "/dashboard/usage", label: "Utilizzo", icon: BarChart3 },
  { to: "/dashboard/subscription", label: "Il mio abbonamento", icon: CreditCard },
  { to: "/dashboard/profile", label: "Profilo", icon: User },
  { to: "/dashboard/settings", label: "Impostazioni", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const linkClass =
    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground";
  const activeClass = "bg-sidebar-accent text-foreground";

  return (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
      <div className="space-y-1">
        {mainNav.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={linkClass}
            activeProps={{ className: activeClass }}
            activeOptions={{ exact: true }}
          >
            {item.icon && <item.icon className="size-4" />}
            {item.label}
          </Link>
        ))}
      </div>

      <div className="space-y-1">
        <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
          Tool
        </p>
        {TOOLS.map((tool) => (
          <Link
            key={tool.id}
            to={tool.route}
            onClick={onNavigate}
            className={linkClass}
            activeProps={{ className: activeClass }}
          >
            <ToolIcon tool={tool} size="sm" className="size-7" />
            <span className="truncate">{tool.name}</span>
          </Link>
        ))}
      </div>

      <div className="space-y-1">
        <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
          Account
        </p>
        {accountNav.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={linkClass}
            activeProps={{ className: activeClass }}
          >
            {item.icon && <item.icon className="size-4" />}
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function DashboardShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate({ to: "/" });
  }

  const sidebarInner = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <Link to="/dashboard" onClick={onNavigate}>
          <Logo />
        </Link>
      </div>
      <NavLinks onNavigate={onNavigate} />
      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2.5 text-muted-foreground"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="hidden border-r border-sidebar-border bg-sidebar lg:sticky lg:top-0 lg:block lg:h-screen">
        {sidebarInner()}
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" aria-label="Apri menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0">
              {sidebarInner(() => setOpen(false))}
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold">{title}</h1>
            {description && (
              <p className="truncate text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className={cn("flex items-center gap-2")}>{actions}</div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
