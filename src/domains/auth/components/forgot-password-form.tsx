"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2, Mail, MailCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { forgotPasswordAction } from "@/domains/auth/actions/forgot-password.action";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/domains/auth/schemas/forgot-password.schema";
import { cn } from "@/lib/utils";

const inputClass = cn(
  "login-input-focus w-full rounded-xl border border-login-outline-variant/50 bg-white py-3.5 pr-4 pl-11 text-base text-login-on-surface transition-all placeholder:text-login-outline/40 focus-visible:ring-0",
);

export function ForgotPasswordForm() {
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(data: ForgotPasswordInput) {
    setGlobalError(null);

    const result = await forgotPasswordAction(data);

    if (!result.success) {
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          if (messages?.[0]) {
            setError(field as keyof ForgotPasswordInput, {
              message: messages[0],
            });
          }
        });
      }
      setGlobalError(result.error);
      return;
    }

    setSentEmail(data.email);
    setEmailSent(true);
  }

  if (emailSent) {
    return (
      <div className="w-full space-y-4 rounded-xl border border-login-secondary/20 bg-login-secondary/5 px-6 py-8 text-center">
        <MailCheck className="mx-auto size-10 text-login-secondary" />
        <h2 className="text-lg font-semibold text-login-on-surface">
          Verifique seu e-mail
        </h2>
        <p className="text-sm text-login-on-surface-variant">
          Se existir uma conta com{" "}
          <span className="font-medium text-login-on-surface">{sentEmail}</span>
          , você receberá um link para redefinir sua senha.
        </p>
        <Link
          href={ROUTES.login}
          className="inline-block text-sm font-semibold text-login-secondary hover:underline"
        >
          Voltar para o login
        </Link>
      </div>
    );
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
          htmlFor="forgot-email"
          className="text-sm font-semibold tracking-wide text-login-on-surface"
        >
          E-mail
        </label>
        <div className="relative">
          <Mail className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-login-outline" />
          <input
            id="forgot-email"
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

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-auto w-full gap-2 rounded-xl bg-[#2563EB] py-4 text-base font-semibold text-white shadow-md hover:bg-[#1D4ED8] hover:shadow-lg active:scale-[0.99] disabled:opacity-80"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            Enviar link de recuperação
            <ArrowRight className="size-5" />
          </>
        )}
      </Button>
    </form>
  );
}
