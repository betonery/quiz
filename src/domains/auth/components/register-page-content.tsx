import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { siteConfig } from "@/config/site";
import { ROUTES } from "@/constants/routes";
import { RegisterForm } from "./register-form";
import { RegisterVisualPanel } from "./register-visual-panel";

export function RegisterPageContent() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex min-h-screen flex-col overflow-hidden md:flex-row">
      <RegisterVisualPanel />

      <section className="flex min-h-screen w-full flex-col bg-login-surface-lowest md:w-1/2">
        <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-12 md:px-16">
          <div className="flex w-full max-w-[440px] flex-col">
            <div className="mb-10 flex justify-center md:justify-start">
              <Logo className="text-3xl text-login-on-surface" />
            </div>

            <div className="mb-8 text-center md:text-left">
              <h1 className="mb-1 text-3xl font-semibold tracking-tight text-login-on-surface">
                Crie sua conta
              </h1>
              <p className="text-base text-login-on-surface-variant">
                Comece a criar quizzes em minutos.
              </p>
            </div>

            <RegisterForm />

            <div className="mt-10 text-center md:text-left">
              <p className="text-sm text-login-on-surface-variant">
                Já tem uma conta?{" "}
                <Link
                  href={ROUTES.login}
                  className="font-semibold text-login-secondary transition-colors hover:text-login-secondary-fixed hover:underline"
                >
                  Entrar
                </Link>
              </p>
            </div>
          </div>
        </div>

        <footer className="shrink-0 border-t border-login-outline-variant/20 px-4 py-8 md:px-16">
          <div className="mx-auto flex w-full max-w-[440px] flex-col items-center justify-between gap-4 opacity-70 md:flex-row">
            <span className="text-xs text-login-on-surface-variant">
              © {currentYear} {siteConfig.name}. Todos os direitos reservados.
            </span>
            <div className="flex gap-6">
              <Link
                href="#"
                className="text-xs text-login-on-surface-variant transition-colors hover:text-login-secondary"
              >
                Ajuda
              </Link>
              <Link
                href="#"
                className="text-xs text-login-on-surface-variant transition-colors hover:text-login-secondary"
              >
                Privacidade
              </Link>
              <Link
                href="#"
                className="text-xs text-login-on-surface-variant transition-colors hover:text-login-secondary"
              >
                Termos
              </Link>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}
