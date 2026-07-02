import React from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Briefcase,
  ClipboardList,
  DollarSign,
  FileSignature,
  HelpCircle,
  LayoutDashboard,
  Loader2,
  LogOut,
  Settings,
} from "lucide-react";
import { displayRoleTitle } from "@/lib/careersPipeline";
import { BRAND_NAME } from "@/lib/brand";

export type OrgNavId = "dashboard" | "setup" | "tasks" | "earnings" | "help" | "settings";

type OrgShellProps = {
  applicationId?: string;
  candidateName: string;
  roleTitle: string;
  activeNav: OrgNavId;
  children: React.ReactNode;
};

const NAV: { id: OrgNavId; label: string; icon: typeof LayoutDashboard; to: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, to: "/workspace" },
  { id: "setup", label: "Workspace setup", icon: FileSignature, to: "/onboarding/workspace-setup" },
  { id: "tasks", label: "Tasks available", icon: ClipboardList, to: "/workspace/tasks" },
  { id: "earnings", label: "Earnings", icon: DollarSign, to: "/workspace/earnings" },
  { id: "help", label: "Help center", icon: HelpCircle, to: "/workspace/support" },
  { id: "settings", label: "Settings", icon: Settings, to: "/workspace/settings" },
];

export function OrgShellLoading({
  activeNav = "setup",
}: {
  applicationId?: string;
  activeNav?: OrgNavId;
}) {
  return (
    <OrgShell candidateName="…" roleTitle="Loading…" activeNav={activeNav}>
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    </OrgShell>
  );
}

function NavLinks({
  activeNav,
  className,
  onNavigate,
}: {
  activeNav: OrgNavId;
  className?: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className={className}>
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = activeNav === item.id;
        const linkClass = `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
          active
            ? "bg-white/10 font-medium text-white"
            : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
        }`;
        return (
          <Link key={item.id} to={item.to} className={linkClass} onClick={onNavigate}>
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function OrgShell({
  candidateName,
  roleTitle,
  activeNav,
  children,
}: OrgShellProps) {
  const displayName = candidateName.trim() || "Contractor";
  const displayRole = displayRoleTitle(roleTitle);
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  const userFooter = (
    <>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime text-xs font-bold text-ink">
          {initials || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{displayName}</p>
          <p className="truncate text-xs text-slate-400">{displayRole}</p>
        </div>
      </div>
      <a
        href="/api/auth/signout"
        className="mt-4 flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300"
      >
        <LogOut className="h-3.5 w-3.5" />
        Sign out
      </a>
    </>
  );

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#0f1419] text-slate-100">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-white/10 bg-[#0b1015] md:flex">
        <div className="shrink-0 border-b border-white/10 px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{BRAND_NAME}</p>
          <p className="mt-1 text-sm font-medium text-white">Contractor workspace</p>
        </div>
        <NavLinks activeNav={activeNav} className="min-h-0 flex-1 space-y-1 overflow-hidden p-3" />
        <div className="shrink-0 border-t border-white/10 p-4">{userFooter}</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="shrink-0 border-b border-white/10 bg-[#0b1015] px-4 py-3 md:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lime/20 md:hidden">
                <Briefcase className="h-4 w-4 text-lime" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{displayName}</p>
                <p className="truncate text-xs text-slate-400">{displayRole}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <Link
                to="/workspace/support"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/10 sm:gap-2 sm:px-3"
              >
                <HelpCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline sm:inline">Support</span>
              </Link>
              <span className="hidden rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 sm:inline">
                Session active
              </span>
            </div>
          </div>
        </header>

        <nav className="shrink-0 border-b border-white/10 bg-[#0b1015] md:hidden">
          <div className="flex gap-1 overflow-x-auto px-2 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = activeNav === item.id;
              return (
                <Link
                  key={item.id}
                  to={item.to}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                    active ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">{children}</main>

        <div className="shrink-0 border-t border-white/10 bg-[#0b1015] p-3 md:hidden">{userFooter}</div>
      </div>
    </div>
  );
}
