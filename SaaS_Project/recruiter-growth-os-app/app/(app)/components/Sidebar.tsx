"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChartIcon,
  InboxIcon,
  UsersIcon,
  ZapIcon,
} from "./icons";
import { ThemeToggle } from "./ThemeToggle";
import { classNames } from "../lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  disabled?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Today's queue", href: "/", icon: InboxIcon },
  { label: "Candidates", href: "/candidates", icon: UsersIcon },
  { label: "Actions", href: "/actions", icon: ZapIcon },
  {
    label: "Performance",
    href: "/performance",
    icon: BarChartIcon,
    disabled: true,
  },
];

const USER = { name: "Test User", initials: "TU" };

export function Sidebar() {
  const pathname = usePathname();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <aside
      className="sticky top-0 flex h-screen w-[240px] shrink-0 flex-col border-r border-border bg-surface-2"
    >
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="inline-flex h-5 w-5 items-center justify-center text-[11px] font-bold text-white"
                style={{
                  borderRadius: "var(--radius-sm)",
                  background: "var(--accent)",
                }}
              >
                R
              </span>
              <span
                className="truncate text-[13px] font-semibold text-text-primary"
                style={{ letterSpacing: "-0.01em" }}
              >
                Recruiter Growth OS
              </span>
            </div>
            <p
              className="mt-0.5 pl-7 text-[10px]"
              style={{ color: "var(--text-tertiary)" }}
            >
              Execution system
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <nav className="flex-1 px-2 pt-2">
        <ul className="space-y-px">
          {NAV_ITEMS.map((item) => {
            const active =
              !item.disabled &&
              (item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href));
            const Icon = item.icon;

            if (item.disabled) {
              return (
                <li key={item.href}>
                  <span
                    className="group flex cursor-default items-center gap-2 rounded-[var(--radius-sm)] text-[13px] opacity-40"
                    style={{ padding: "8px 12px" }}
                  >
                    <Icon size={15} />
                    <span className="flex-1 truncate" style={{ color: "var(--text-secondary)" }}>
                      {item.label}
                    </span>
                    <span
                      className="
                        rounded-pill border border-border px-1.5 py-px
                        text-[10px] font-medium text-text-muted
                      "
                      style={{ borderRadius: 20 }}
                    >
                      Soon
                    </span>
                  </span>
                </li>
              );
            }

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={classNames(
                    "group flex items-center gap-2 text-[13px] rounded-[var(--radius-sm)] transition-colors",
                    !active && "hover:bg-surface-2 hover:text-text-primary"
                  )}
                  style={
                    active
                      ? {
                          padding: "8px 12px",
                          background: "var(--accent-surface)",
                          color: "var(--accent)",
                          fontWeight: 500,
                        }
                      : {
                          padding: "8px 12px",
                          color: "var(--text-secondary)",
                        }
                  }
                >
                  <Icon size={15} />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border px-3 py-3">
        <div className="flex items-center gap-2.5 rounded-[7px] px-2 py-2">
          <span
            aria-hidden
            className="inline-flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-[10px] font-semibold text-text-secondary"
          >
            {USER.initials}
          </span>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[11px] font-medium text-text-primary">
              {USER.name}
            </div>
            <div className="truncate text-[10px]" style={{ color: "var(--text-tertiary)" }}>
              Personal workspace
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="mt-2 w-full rounded-[var(--radius-sm)] border border-border px-2 py-1.5 text-[11px] font-medium text-text-secondary hover:bg-surface hover:text-text-primary"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
