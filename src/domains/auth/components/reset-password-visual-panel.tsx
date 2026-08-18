export function ResetPasswordVisualPanel() {
  return (
    <section className="login-visual-bg relative hidden min-h-screen overflow-hidden md:flex md:w-1/2 md:items-center md:justify-center">
      <div className="login-visual-grid absolute inset-0 opacity-30" />

      <div className="login-glow absolute -top-1/4 -left-1/4 h-2/3 w-2/3 rounded-full bg-[#3B82F6]/25 blur-[120px]" />
      <div className="login-glow absolute -right-1/4 -bottom-1/4 h-3/4 w-3/4 rounded-full bg-login-secondary-container/30 blur-[160px]" />

      <div className="pointer-events-none absolute top-1/2 left-1/2 z-0 size-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.07]" />

      <div className="login-glass-card relative z-10 mx-12 max-w-lg rounded-2xl px-8 py-12">
        <h2 className="mb-4 text-4xl leading-tight font-bold tracking-tight text-white md:text-5xl">
          Defina uma{" "}
          <span className="text-login-secondary-fixed">nova senha</span> forte.
        </h2>
        <p className="text-lg leading-relaxed text-white/80">
          Escolha uma senha segura com pelo menos 8 caracteres para proteger sua
          conta.
        </p>
      </div>
    </section>
  );
}
