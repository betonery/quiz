"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { loginAction } from "@/domains/auth/actions/login.action";
import {
  loginSchema,
  type LoginInput,
} from "@/domains/auth/schemas/login.schema";
import { cn } from "@/lib/utils";

const inputClass = cn(
  "login-input-focus w-full rounded-xl border border-login-outline-variant/50 bg-white py-3.5 pr-4 pl-11 text-base text-login-on-surface transition-all placeholder:text-login-outline/40 focus-visible:ring-0",
);

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginInput) {
    setGlobalError(null);

    const result = await loginAction(data);

    if (!result.success) {
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          if (messages?.[0]) {
            setError(field as keyof LoginInput, { message: messages[0] });
          }
        });
      }
      setGlobalError(result.error);
      return;
    }

    router.push(ROUTES.dashboard);
    router.refresh();
  }

  return (
    <form className="w-full space-y-6" onSubmit={handleSubmit(onSubmit)}>
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
          htmlFor="email"
          className="text-sm font-semibold tracking-wide text-login-on-surface"
        >
          E-mail
        </label>
        <div className="relative">
          <Mail className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-login-outline" />
          <input
            id="email"
            type="email"
            placeholder="seu@empresa.com"
            aria-invalid={!!errors.email}
            className={cn(inputClass, errors.email && "border-destructive/60")}
            {...register("email")}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="text-sm font-semibold tracking-wide text-login-on-surface"
          >
            Senha
          </label>
          <Link
            href={ROUTES.forgotPassword}
            className="text-xs font-medium text-login-secondary transition-colors hover:text-login-secondary-fixed"
          >
            Esqueceu a senha?
          </Link>
        </div>
        <div className="relative">
          <Lock className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-login-outline" />
          <input
            id="password"
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
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          id="remember"
          name="remember"
          type="checkbox"
          className="login-checkbox size-4 shrink-0 rounded-md"
        />
        <label
          htmlFor="remember"
          className="cursor-pointer text-xs font-medium text-login-on-surface-variant"
        >
          Lembrar de mim por 30 dias
        </label>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-auto w-full gap-2 rounded-xl bg-[#2563EB] py-4 text-base font-semibold text-white shadow-md hover:bg-[#1D4ED8] hover:shadow-lg active:scale-[0.99] disabled:opacity-80"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            Autenticando...
          </>
        ) : (
          <>
            Entrar
            <ArrowRight className="size-5" />
          </>
        )}
      </Button>
    </form>
  );
}
