"use client";

import { X } from "lucide-react";
import { useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

type AdminTagsInputProps = {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxTags?: number;
  maxLength?: number;
};

/** Separadores aceitos ao digitar ou colar: vírgula, ponto e vírgula, quebra de linha. */
const SEPARATORS = /[\n,;]+/;

export function AdminTagsInput({
  value,
  onChange,
  placeholder = "Digite e pressione Enter",
  disabled = false,
  maxTags = 50,
  maxLength = 160,
}: AdminTagsInputProps) {
  const [draft, setDraft] = useState("");

  function addTags(raw: string) {
    const candidates = raw
      .split(SEPARATORS)
      .map((item) => item.trim())
      .filter((item) => item.length > 0 && item.length <= maxLength);

    if (candidates.length === 0) return;

    const next = [...value];
    for (const candidate of candidates) {
      if (next.length >= maxTags) break;
      if (next.includes(candidate)) continue;
      next.push(candidate);
    }

    if (next.length !== value.length) onChange(next);
    setDraft("");
  }

  function removeAt(index: number) {
    onChange(value.filter((_, position) => position !== index));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === "," || event.key === ";") {
      // Enter aqui adiciona o código; sem isso o formulário do diálogo submeteria.
      event.preventDefault();
      addTags(draft);
      return;
    }

    if (event.key === "Backspace" && draft === "" && value.length > 0) {
      removeAt(value.length - 1);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const text = event.clipboardData.getData("text");
    if (!SEPARATORS.test(text)) return;
    event.preventDefault();
    addTags(text);
  }

  const isFull = value.length >= maxTags;

  return (
    <div
      className={cn(
        "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/70 px-2 py-1.5 transition-colors focus-within:border-cyan-500/60 focus-within:ring-2 focus-within:ring-cyan-500/20",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      {value.map((tag, index) => (
        <span
          key={tag}
          className="inline-flex max-w-full items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 py-0.5 pr-1 pl-2 text-xs text-slate-200"
        >
          <span className="truncate">{tag}</span>
          <button
            type="button"
            onClick={() => removeAt(index)}
            disabled={disabled}
            aria-label={`Remover ${tag}`}
            className="flex size-4 shrink-0 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-700 hover:text-red-300 disabled:pointer-events-none"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}

      <input
        type="text"
        value={draft}
        disabled={disabled || isFull}
        maxLength={maxLength}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        // Sair do campo não pode descartar o que foi digitado.
        onBlur={() => addTags(draft)}
        placeholder={isFull ? `Limite de ${maxTags} atingido` : placeholder}
        className="h-6 min-w-32 flex-1 bg-transparent px-1 text-sm text-slate-100 outline-none placeholder:text-slate-600 disabled:cursor-not-allowed"
      />
    </div>
  );
}
