"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { AdminSelect } from "@/domains/admin/components/ui/admin-form-fields";
import { useDebounce } from "@/hooks/use-debounce";

/** Aplica um patch nos search params preservando o resto e voltando à página 1. */
function useQueryPatch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return function patch(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(next)) {
      if (value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    if (!("page" in next)) params.delete("page");

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };
}

export function AdminSearchInput({
  placeholder = "Buscar...",
}: {
  placeholder?: string;
}) {
  const searchParams = useSearchParams();
  const patch = useQueryPatch();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const debounced = useDebounce(value, 350);
  const [, startTransition] = useTransition();

  // Só dispara quando o termo debounced diverge da URL — evita loop com o
  // valor que o próprio replace acabou de escrever.
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (debounced === current) return;
    startTransition(() => patch({ q: debounced || undefined }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className="relative w-full sm:w-72">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500" />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-xl border border-slate-700/80 bg-slate-900/70 pr-9 pl-9 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20"
      />
      {value ? (
        <button
          type="button"
          onClick={() => setValue("")}
          className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
          aria-label="Limpar busca"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

export function AdminFilterSelect({
  paramKey,
  label,
  options,
  allLabel = "Todos",
}: {
  paramKey: string;
  label: string;
  options: { value: string; label: string }[];
  allLabel?: string;
}) {
  const searchParams = useSearchParams();
  const patch = useQueryPatch();
  const current = searchParams.get(paramKey) ?? "";

  return (
    <AdminSelect
      aria-label={label}
      value={current}
      onChange={(event) =>
        patch({ [paramKey]: event.target.value || undefined })
      }
      className="w-full sm:w-48"
    >
      <option value="">{allLabel}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </AdminSelect>
  );
}

export function AdminFilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      {children}
    </div>
  );
}
