import type { NextConfig } from "next";

// Headers de segurança aplicados a todas as respostas.
// Observação: a CSP é parcial (sem `default-src`) para não quebrar pixels de
// marketing (Meta/UTMify) nem iframes de embed; ainda assim bloqueia
// clickjacking, injeção de <base> e plugins (<object>/<embed>).
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "frame-ancestors 'self'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; "),
  },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["@supabase/supabase-js", "@supabase/ssr"],
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Supabase quiz-assets bucket allows up to 5MB; add headroom for multipart.
      bodySizeLimit: "6mb",
    },
  },
  images: {
    // Formatos modernos: o Next negocia AVIF/WebP automaticamente, reduzindo
    // drasticamente o peso das imagens otimizadas (LCP em conexões móveis).
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
