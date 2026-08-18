import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <h3 className="text-headline text-lg">{title}</h3>
      {description && (
        <p className="text-body max-w-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
