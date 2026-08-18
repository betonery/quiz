"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { resetPasswordAction } from "@/domains/auth/actions/reset-password.action";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/domains/auth/schemas/reset-password.schema";
import { cn } from "@/lib/utils";

const inputClass = cn(
  "login-input-focus w-full rounded-xl border border-login-outline-variant/50 bg-white py-3.5 pr-4 pl-4 text-base text-login-on-surface transition-all placeholder:text-login-outline/40 focus-visible:ring-0",
);

type PasswordStrength = 0 | 1 | 2 | 3 | 4;

function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score as PasswordStrength;
}

const strengthLabels: Record<PasswordStrength, string> = {
  0: "",
  1: "Senha fraca",
  2: "Senha média",
  3: "Senha forte",
  4: "Senha muito forte",
};

export function ResetPasswordForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [passwordReset, setPasswordReset] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");
  const strength = useMemo(
    () => getPasswordStrength(password ?? ""),
    [password],
  );

  async function onSubmit(data: ResetPasswordInput) {
    setGlobalError(null);

    const result = await resetPasswordAction(data);

    if (!result.success) {
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          if (messages?.[0]) {
            setError(field as keyof ResetPasswordInput, {
              message: messages[0],
            });
          }
        });
      }
      setGlobalError(result.error);
      return;
    }

    setPasswordReset(true);
    router.refresh();
  }

  if (passwordReset) {
    return (
      <div className="w-full space-y-4 rounded-xl border border-login-secondary/20 bg-login-secondary/5 px-6 py-8 text-center">
        <CheckCircle2 className="mx-auto size-10 text-login-secondary" />
        <h2 className="text-lg font-semibold text-login-on-surface">
          Senha redefinida
        </h2>
        <p className="text-sm text-login-on-surface-variant">
          Sua senha foi atualizada com sucesso. Faça login com a nova senha.
        </p>
        <Link
          href={ROUTES.login}
          className="inline-block text-sm font-semibold text-login-secondary hover:underline"
        >
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <form className="w-full space-y-5" onSubmit={handleSubmit(onSubmit)}>
      {globalError && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {globalError}
        </div>
      )}

      <div className="space-y-1">
        <label
          htmlFor="reset-password"
          className="text-sm font-semibold tracking-wide text-login-on-surface"
        >
          Nova senha
        </label>
        <div className="relative">
          <input
            id="reset-password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            className={cn(
              inputClass,
              "pr-12",
              errors.password && "border-destructive/60",
            )}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute top-1/2 right-4 -translate-y-1/2 text-login-outline transition-colors hover:text-login-on-surface"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? (
              <EyeOff className="size-5" />
            ) : (
              <Eye className="size-5" />
            )}
          </button>
        </div>

        {password && password.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            {[1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  strength >= level
                    ? "bg-login-secondary"
                    : "bg-login-outline-variant/40",
                )}
              />
            ))}
            <span className="ml-1 text-xs font-medium text-login-secondary">
              {strengthLabels[strength]}
            </span>
          </div>
        )}
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label
          htmlFor="reset-confirm-password"
          className="text-sm font-semibold tracking-wide text-login-on-surface"
        >
          Confirmar nova senha
        </label>
        <div className="relative">
          <input
            id="reset-confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••"
            aria-invalid={!!errors.confirmPassword}
            className={cn(
              inputClass,
              "pr-12",
              errors.confirmPassword && "border-destructive/60",
            )}
            {...register("confirmPassword")}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute top-1/2 right-4 -translate-y-1/2 text-login-outline transition-colors hover:text-login-on-surface"
            aria-label={
              showConfirmPassword
                ? "Ocultar confirmação"
                : "Mostrar confirmação"
            }
          >
            {showConfirmPassword ? (
              <EyeOff className="size-5" />
            ) : (
              <Eye className="size-5" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-auto w-full gap-2 rounded-xl bg-login-secondary py-4 text-base font-semibold text-white shadow-md hover:bg-login-secondary/90 hover:shadow-lg active:scale-[0.99] disabled:opacity-80"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            Redefinir senha
            <ArrowRight className="size-5" />
          </>
        )}
      </Button>
    </form>
  );
}
