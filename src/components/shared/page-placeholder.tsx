type PagePlaceholderProps = {
  title: string;
  description?: string;
};

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-headline text-2xl">{title}</h1>
      {description && (
        <p className="text-body text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
