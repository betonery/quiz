import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { ROUTES } from "@/constants/routes";
import { ResetPasswordForm } from "./reset-password-form";
import { ResetPasswordVisualPanel } from "./reset-password-visual-panel";

export function ResetPasswordPageContent() {
  return (
    <div className="flex min-h-screen flex-col overflow-hidden md:flex-row">
      <ResetPasswordVisualPanel />

      <section className="flex min-h-screen w-full flex-col bg-login-surface-lowest md:w-1/2">
        <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-12 md:px-16">
          <div className="flex w-full max-w-[420px] flex-col items-center">
            <div className="mb-10">
              <Logo className="text-3xl text-login-on-surface" />
            </div>

            <div className="mb-8 w-full text-center">
              <h1 className="mb-1 text-3xl font-semibold tracking-tight text-login-on-surface">
                Nova senha
              </h1>
              <p className="text-base text-login-on-surface-variant">
                Crie uma nova senha para acessar sua conta.
              </p>
            </div>

            <ResetPasswordForm />

            <div className="mt-10 text-center">
              <p className="text-sm text-login-on-surface-variant">
                <Link
                  href={ROUTES.login}
                  className="font-semibold text-login-secondary transition-colors hover:text-login-secondary-fixed"
                >
                  Voltar para o login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
