import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { ROUTES } from "@/constants/routes";
import { LoginForm } from "./login-form";
import { LoginVisualPanel } from "./login-visual-panel";

export function LoginPageContent() {
  return (
    <div className="flex min-h-screen flex-col overflow-hidden md:flex-row">
      <LoginVisualPanel />

      <section className="flex min-h-screen w-full flex-col bg-login-surface-lowest md:w-1/2">
        <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-12 md:px-16">
          <div className="flex w-full max-w-[420px] flex-col items-center">
            <div className="mb-10">
              <Logo className="text-3xl text-login-on-surface" />
            </div>

            <div className="mb-8 w-full text-center">
              <h1 className="mb-1 text-3xl font-semibold tracking-tight text-login-on-surface">
                Bem-vindo de volta
              </h1>
              <p className="text-base text-login-on-surface-variant">
                Informe suas credenciais para acessar o painel
              </p>
            </div>

            <LoginForm />

            <div className="mt-10 text-center">
              <p className="text-sm text-login-on-surface-variant">
                Não tem uma conta?{" "}
                <Link
                  href={ROUTES.register}
                  className="ml-1 font-semibold text-login-secondary transition-colors hover:text-login-secondary-fixed"
                >
                  Criar conta
                </Link>
              </p>
            </div>
          </div>
        </div>

        <footer className="shrink-0 border-t border-login-outline-variant/20 px-4 py-8 md:px-16">
          <div className="mx-auto flex max-w-[420px] justify-center gap-8">
            <Link
              href="#"
              className="text-xs text-login-outline/60 transition-colors hover:text-login-outline"
            >
              Política de Privacidade
            </Link>
            <Link
              href="#"
              className="text-xs text-login-outline/60 transition-colors hover:text-login-outline"
            >
              Termos de Uso
            </Link>
            <Link
              href="#"
              className="text-xs text-login-outline/60 transition-colors hover:text-login-outline"
            >
              Central de Ajuda
            </Link>
          </div>
        </footer>
      </section>
    </div>
  );
}
