type QuizUnavailableProps = {
  title?: string;
  description?: string;
};

export function QuizUnavailable({
  title = "Funil indisponível",
  description = "Este funil não está disponível no momento porque o workspace não possui uma assinatura ativa.",
}: QuizUnavailableProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      <p className="max-w-md text-muted-foreground">{description}</p>
    </div>
  );
}
