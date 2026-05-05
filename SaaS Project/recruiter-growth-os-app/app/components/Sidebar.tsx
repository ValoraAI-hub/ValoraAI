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
    <aside className="sticky top-0 flex h-screen w-[200px] shrink-0 flex-col border-r border-border bg-surface">
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-[5px] bg-accent text-[11px] font-bold text-white"
              >
                R
              </span>
              <span className="truncate text-[12px] font-semibold tracking-tight text-text-primary">
                Recruiter Growth OS
              </span>
            </div>
            <p className="mt-0.5 pl-[30px] text-[10px] text-text-muted">
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
                  <span className="group flex items-center gap-2 rounded-[7px] px-2.5 py-[6px] text-[12px] cursor-not-allowed text-text-muted opacity-40">
                    <Icon size={13} />
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
                  className={
                    active
                      ? "group flex items-center gap-2 rounded-[7px] px-2.5 py-[6px] text-[12px] bg-surface-2 text-text-primary font-medium"
                      : "group flex items-center gap-2 rounded-[7px] px-2.5 py-[6px] text-[12px] text-text-muted hover:bg-surface-2 hover:text-text-primary"
                  }
                >
                  <Icon size={13} />
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
            className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-full bg-surface-2 text-[10px] font-semibold text-text-secondary border border-border flex-shrink-0"
          >
            {USER.initials}
          </span>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[12px] font-medium text-text-primary">
              {USER.name}
            </div>
            <div className="truncate text-[10px] text-text-muted">
              Personal workspace
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
