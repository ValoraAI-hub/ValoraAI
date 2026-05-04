"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChartIcon,
  InboxIcon,
  UsersIcon,
  ZapIcon,
} from "./icons";
import { ThemeToggle } from "./ThemeToggle";

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

  return (
    <aside
      className="
        sticky top-0 flex h-screen w-[220px] shrink-0 flex-col
        border-r border-border bg-surface
      "
    >
      <div className="flex items-start justify-between gap-2 px-4 pt-5 pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="
                inline-flex h-5 w-5 items-center justify-center rounded
                bg-accent text-[11px] font-semibold text-white
              "
            >
              R
            </span>
            <span className="truncate text-[13px] font-semibold tracking-tight text-text-primary">
              Recruiter Growth OS
            </span>
          </div>
          <p className="mt-0.5 pl-7 text-[11px] text-text-muted">
            Execution system
          </p>
        </div>
        <ThemeToggle />
      </div>

      <nav className="flex-1 px-2 pt-2">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active =
              !item.disabled &&
              (item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href));
            const Icon = item.icon;

            const baseClasses =
              "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px]";

            if (item.disabled) {
              return (
                <li key={item.href}>
                  <span
                    className={`${baseClasses} cursor-not-allowed text-text-muted`}
                  >
                    <Icon size={14} />
                    <span className="flex-1 truncate">{item.label}</span>
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
                  className={`${baseClasses} ${
                    active
                      ? "bg-surface-2 text-text-primary font-medium"
                      : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
                  }`}
                >
                  <Icon size={14} />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border px-3 py-3">
        <div className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5">
          <span
            aria-hidden
            className="
              inline-flex h-7 w-7 items-center justify-center rounded-full
              bg-surface-2 text-[11px] font-semibold text-text-primary
              border border-border
            "
          >
            {USER.initials}
          </span>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[13px] font-medium text-text-primary">
              {USER.name}
            </div>
            <div className="truncate text-[11px] text-text-muted">
              Personal workspace
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
