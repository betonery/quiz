"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getWorkspaceNavigation } from "@/config/navigation";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

type SidebarProps = {
  workspaceSlug: string;
};

export function Sidebar({ workspaceSlug }: SidebarProps) {
  const pathname = usePathname();
  const navigation = getWorkspaceNavigation(workspaceSlug);

  return (
    <aside className="hidden w-64 flex-col border-r bg-sidebar md:flex">
      <div className="flex h-14 items-center border-b px-4">
        <Logo />
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href.endsWith("/quizzes") &&
              pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent",
                isActive &&
                  "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
              )}
            >
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
