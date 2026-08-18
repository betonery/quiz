export function RegisterVisualPanel() {
  const avatars = [
    { initials: "AM", color: "bg-[#3B82F6]" },
    { initials: "RC", color: "bg-[#6366F1]" },
    { initials: "LS", color: "bg-[#0F172A]" },
  ];

  return (
    <section className="login-visual-bg relative hidden min-h-screen overflow-hidden md:flex md:w-1/2 md:items-center md:justify-center">
      <div className="login-visual-grid absolute inset-0 opacity-30" />

      <div className="login-glow absolute -top-1/4 -left-1/4 h-2/3 w-2/3 rounded-full bg-[#3B82F6]/25 blur-[120px]" />
      <div className="login-glow absolute -right-1/4 -bottom-1/4 h-3/4 w-3/4 rounded-full bg-login-secondary-container/30 blur-[160px]" />
      <div className="absolute top-1/3 right-1/4 h-48 w-48 rounded-full bg-[#6366F1]/20 blur-[80px]" />

      <div className="pointer-events-none absolute top-1/2 left-1/2 z-0 size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 z-0 size-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.07]" />

      <div className="login-glass-card relative z-10 mx-12 max-w-lg rounded-2xl px-8 py-12">
        <h2 className="mb-4 text-4xl leading-tight font-bold tracking-tight text-white md:text-5xl">
          Faça parte do futuro da{" "}
          <span className="text-login-secondary-fixed">criação de quizzes</span>
        </h2>
        <p className="mb-8 text-lg leading-relaxed text-white/80">
          Potencialize seu marketing com insights de IA e funis de alta
          conversão.
        </p>

        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
            {avatars.map((avatar) => (
              <div
                key={avatar.initials}
                className={`flex size-8 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold text-white ${avatar.color}`}
              >
                {avatar.initials}
              </div>
            ))}
          </div>
          <span className="text-xs font-medium text-white/70">
            Mais de 2.000 criadores entraram esta semana
          </span>
        </div>
      </div>
    </section>
  );
}
