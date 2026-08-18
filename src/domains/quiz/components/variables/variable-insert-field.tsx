"use client";

import { Braces, ChevronDown } from "lucide-react";
import {
  useRef,
  useState,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { Input } from "@/components/ui/input";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import {
  applyTextFieldInsertion,
  buildVariableSnippet,
  getTextFieldSelection,
  type TextFieldSelection,
} from "@/domains/quiz/utils/insert-at-cursor.utils";
import { cn } from "@/lib/utils";

type VariableInsertFieldBaseProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  inputClassName?: string;
  showVariablePicker?: boolean;
  variablePickerLabel?: string;
};

type VariableInsertInputProps = VariableInsertFieldBaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
    multiline?: false;
  };

type VariableInsertTextareaProps = VariableInsertFieldBaseProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> & {
    multiline: true;
    rows?: number;
  };

export type VariableInsertFieldProps =
  | VariableInsertInputProps
  | VariableInsertTextareaProps;

export function VariableInsertField(props: VariableInsertFieldProps) {
  const {
    value,
    onChange,
    className,
    inputClassName,
    showVariablePicker = true,
    variablePickerLabel = "Inserir variável",
    multiline,
    ...rest
  } = props;

  const variables = useBuilderStore((s) => s.variables);
  const fieldRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const savedSelectionRef = useRef<TextFieldSelection | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  function rememberSelection() {
    const element = fieldRef.current;
    if (!element) return;
    savedSelectionRef.current = getTextFieldSelection(element);
  }

  function insertSnippet(snippet: string, cursorOffset?: number) {
    const element = fieldRef.current;
    if (!element) return;

    applyTextFieldInsertion(
      element,
      value,
      snippet,
      onChange,
      savedSelectionRef.current ?? undefined,
      cursorOffset,
    );
    savedSelectionRef.current = null;
    setPickerOpen(false);
  }

  function insertVariableKey(key: string) {
    insertSnippet(buildVariableSnippet(key));
  }

  const trailingPadding = multiline ? "pr-10" : "pr-10";

  const field = multiline ? (
    <textarea
      ref={fieldRef as React.RefObject<HTMLTextAreaElement>}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onSelect={rememberSelection}
      onKeyUp={rememberSelection}
      onMouseUp={rememberSelection}
      onFocus={rememberSelection}
      rows={props.rows ?? 4}
      className={cn(
        "min-h-[120px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
        trailingPadding,
        inputClassName,
      )}
      {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
    />
  ) : (
    <Input
      ref={fieldRef as React.RefObject<HTMLInputElement>}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onSelect={rememberSelection}
      onKeyUp={rememberSelection}
      onMouseUp={rememberSelection}
      onFocus={rememberSelection}
      className={cn("bg-background shadow-sm", trailingPadding, inputClassName)}
      {...(rest as InputHTMLAttributes<HTMLInputElement>)}
    />
  );

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        {field}
        <button
          type="button"
          className={cn(
            "absolute flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground",
            multiline ? "top-2 right-2" : "top-1/2 right-2 -translate-y-1/2",
          )}
          aria-label="Inserir variável"
          onMouseDown={(event) => {
            event.preventDefault();
            rememberSelection();
          }}
          onClick={() => insertSnippet("{{", 2)}
        >
          <Braces className="size-4" />
        </button>
      </div>

      {showVariablePicker && variables.length > 0 ? (
        <VariablePicker
          label={variablePickerLabel}
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onBeforeOpen={rememberSelection}
          onSelect={insertVariableKey}
          variables={variables}
        />
      ) : null}
    </div>
  );
}

function VariablePicker({
  label,
  open,
  onOpenChange,
  onBeforeOpen,
  onSelect,
  variables,
}: {
  label: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBeforeOpen: () => void;
  onSelect: (key: string) => void;
  variables: { key: string; label?: string }[];
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          onBeforeOpen();
          onOpenChange(!open);
        }}
        className="flex h-9 w-full items-center justify-between rounded-lg border border-border bg-background px-3 text-sm shadow-sm hover:bg-muted"
      >
        <span className="text-muted-foreground">{label}</span>
        <ChevronDown className="size-4 text-muted-foreground" />
      </button>
      {open ? (
        <div className="absolute z-50 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-border bg-background shadow-lg">
          {variables.map((item) => (
            <button
              key={item.key}
              type="button"
              className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSelect(item.key)}
            >
              <span className="font-medium">{item.key}</span>
              {item.label ? (
                <span className="text-xs text-muted-foreground">
                  {item.label}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
