"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type AdminPaginationProps = {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
};

export function AdminPagination({
  page,
  pageCount,
  total,
  pageSize,
}: AdminPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (total === 0) return null;

  function goToPage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 px-5 py-3">
      <p className="text-xs text-slate-500">
        Exibindo <span className="text-slate-300">{first}</span>–
        <span className="text-slate-300">{last}</span> de{" "}
        <span className="text-slate-300">{total}</span>
      </p>

      <div className="flex items-center gap-1">
        <PageButton
          disabled={page <= 1}
          onClick={() => goToPage(page - 1)}
          label="Página anterior"
        >
          <ChevronLeft className="size-4" />
        </PageButton>

        <span className="px-2 text-xs text-slate-400">
          {page} / {pageCount}
        </span>

        <PageButton
          disabled={page >= pageCount}
          onClick={() => goToPage(page + 1)}
          label="Próxima página"
        >
          <ChevronRight className="size-4" />
        </PageButton>
      </div>
    </div>
  );
}

function PageButton({
  children,
  disabled,
  onClick,
  label,
}: {
  children: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "flex size-8 items-center justify-center rounded-lg border border-slate-700/70 text-slate-300 transition-colors",
        disabled
          ? "cursor-not-allowed opacity-40"
          : "hover:border-cyan-500/40 hover:bg-slate-800 hover:text-cyan-300",
      )}
    >
      {children}
    </button>
  );
}
