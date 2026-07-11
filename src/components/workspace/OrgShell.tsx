import React from "react";
import { Link, useNavigate } from "@tanstack/react-router";
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
import { supabase } from "@/lib/client/supabase";

export type OrgNavId = "dashboard" | "setup" | "tasks" | "earnings" | "help" | "settings";

type OrgShellProps = {
  applicationId?: string;
  candidateName: string;
  roleTitle: string;
  activeNav: OrgNavId;
  children: React.ReactNode;
};

const NAV: { id: OrgNavId; label: string; icon: typeof LayoutDashboard; to: string }[] = [
  { id: "dashboard", label: "Dashboard",       icon: LayoutDashboard, to: "/workspace" },
  { id: "setup",     label: "Workspace setup", icon: FileSignature,   to: "/onboarding/workspace-setup" },
  { id: "tasks",     label: "Tasks available", icon: ClipboardList,   to: "/workspace/tasks" },
  { id: "earnings",  label: "Earnings",         icon: DollarSign,      to: "/workspace/earnings" },
  { id: "help",      label: "Help center",      icon: HelpCircle,      to: "/workspace/support" },
  { id: "settings",  label: "Settings",         icon: Settings,        to: "/workspace/settings" },
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
            ? "bg-gray-900 font-medium text-white"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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
  const navigate = useNavigate();
  const displayName = candidateName.trim() || "Contractor";
  const displayRole = displayRoleTitle(roleTitle);
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  async function handleSignOut() {
    await supabase.auth.signOut();
    void navigate({ to: "/" });
  }

  const userFooter = (
    <>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime text-xs font-bold text-ink">
          {initials || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">{displayName}</p>
          <p className="truncate text-xs text-gray-500">{displayRole}</p>
        </div>
      </div>
      <button
        onClick={() => void handleSignOut()}
        className="mt-4 flex items-center gap-2 text-xs text-gray-400 hover:text-gray-700 transition"
      >
        <LogOut className="h-3.5 w-3.5" />
        Sign out
      </button>
    </>
  );

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-gray-50">
      {/* Sidebar — desktop */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-gray-200 bg-white md:flex">
        <div className="shrink-0 border-b border-gray-200 px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{BRAND_NAME}</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">Contractor workspace</p>
        </div>
        <NavLinks activeNav={activeNav} className="min-h-0 flex-1 space-y-0.5 overflow-hidden p-3" />
        <div className="shrink-0 border-t border-gray-200 p-4">{userFooter}</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="shrink-0 border-b border-gray-200 bg-white px-4 py-3 md:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lime/20 md:hidden">
                <Briefcase className="h-4 w-4 text-lime" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{displayName}</p>
                <p className="truncate text-xs text-gray-500">{displayRole}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <Link
                to="/workspace/support"
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 sm:gap-2 sm:px-3 transition"
              >
                <HelpCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline sm:inline">Support</span>
              </Link>
              <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 sm:inline">
                Session active
              </span>
            </div>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="shrink-0 border-b border-gray-200 bg-white md:hidden">
          <div className="flex gap-1 overflow-x-auto px-2 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = activeNav === item.id;
              return (
                <Link
                  key={item.id}
                  to={item.to}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                    active
                      ? "bg-gray-900 text-white"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">
          {children}
        </main>

        {/* Mobile footer */}
        <div className="shrink-0 border-t border-gray-200 bg-white p-3 md:hidden">
          {userFooter}
        </div>
      </div>
    </div>
  );
}
