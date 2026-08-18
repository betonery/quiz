function getSupabaseOrigin(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export default function PublicQuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabaseOrigin = getSupabaseOrigin();

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      {/* Aquece a conexão (DNS + TLS) com as origens críticas do funil antes
          de a fonte do Google e a imagem de LCP (Supabase Storage) serem
          requisitadas, reduzindo FCP/LCP. */}
      <link
        rel="preconnect"
        href="https://fonts.googleapis.com"
        crossOrigin="anonymous"
      />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      {supabaseOrigin ? (
        <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" />
      ) : null}
      {children}
    </div>
  );
}
