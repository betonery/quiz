"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import {
  slugifyVariableKey,
  validateVariableKey,
} from "@/domains/quiz/utils/variable-registry.utils";
import { cn } from "@/lib/utils";

export type VariableKeyComboboxIntent = "bind" | "reference";

type VariableKeyComboboxProps = {
  value?: string;
  onChange?: (key: string) => void;
  onSelect?: (key: string) => void;
  intent?: VariableKeyComboboxIntent;
  labelHint?: string;
  placeholder?: string;
  allowCreate?: boolean;
};

export function VariableKeyCombobox({
  value = "",
  onChange,
  onSelect,
  intent = "bind",
  labelHint,
  placeholder,
  allowCreate = true,
}: VariableKeyComboboxProps) {
  const resolvedPlaceholder =
    placeholder ??
    (allowCreate
      ? "Buscar ou adicionar variável..."
      : "Selecionar variável...");
  const variables = useBuilderStore((s) => s.variables);
  const ensureQuizVariable = useBuilderStore((s) => s.ensureQuizVariable);
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (intent === "bind") {
      setQuery(value);
    }
  }, [intent, value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalizedQuery = query.trim();
  const filtered = variables.filter((item) => {
    if (!normalizedQuery) return true;
    const q = normalizedQuery.toLowerCase();
    return (
      item.key.toLowerCase().includes(q) ||
      (item.label?.toLowerCase().includes(q) ?? false)
    );
  });

  const slugCandidate = slugifyVariableKey(normalizedQuery);
  const canCreate =
    allowCreate &&
    normalizedQuery.length > 0 &&
    !variables.some((item) => item.key === slugCandidate) &&
    (intent === "reference" || slugCandidate !== value);

  function finishSelection(key: string) {
    if (intent === "reference") {
      onSelect?.(key);
      onChange?.(key);
      setQuery("");
      setError(null);
      setOpen(false);
      return;
    }

    ensureQuizVariable(key, labelHint);
    onChange?.(key);
    setQuery(key);
    setError(null);
    setOpen(false);
  }

  function commitKey(key: string) {
    const existsInRegistry = variables.some((item) => item.key === key);

    if (existsInRegistry) {
      finishSelection(key);
      return;
    }

    if (!allowCreate) {
      return;
    }

    const validationError = validateVariableKey(key);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (variables.some((item) => item.key === key)) {
      setError("Já existe uma variável com este nome");
      return;
    }

    finishSelection(key);
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={query}
        placeholder={resolvedPlaceholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setError(null);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (filtered.some((item) => item.key === normalizedQuery)) {
              commitKey(normalizedQuery);
            } else if (allowCreate && canCreate) {
              commitKey(slugCandidate);
            } else if (allowCreate && normalizedQuery) {
              commitKey(slugCandidate);
            }
          }
          if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className="bg-background shadow-sm"
      />

      {open && (allowCreate ? filtered.length > 0 || canCreate : true) && (
        <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-background shadow-lg">
          {filtered.length === 0 && !allowCreate ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              Nenhuma variável cadastrada
            </p>
          ) : null}
          {filtered.map((item) => (
            <button
              key={item.key}
              type="button"
              className={cn(
                "flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted",
                intent === "bind" && item.key === value && "bg-primary/5",
              )}
              onClick={() => commitKey(item.key)}
            >
              <span className="font-medium">{item.key}</span>
              {item.label ? (
                <span className="text-xs text-muted-foreground">
                  {item.label}
                </span>
              ) : null}
            </button>
          ))}
          {canCreate && (
            <button
              type="button"
              className="flex w-full items-center px-3 py-2 text-left text-sm text-primary hover:bg-muted"
              onClick={() => commitKey(slugCandidate)}
            >
              Criar &quot;{slugCandidate}&quot;
            </button>
          )}
        </div>
      )}

      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
