"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updatePasswordAction } from "@/domains/profile/actions/update-password.action";
import {
  updatePasswordSchema,
  type UpdatePasswordInput,
} from "@/domains/profile/schemas/update-password.schema";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const fieldClass =
  "border-slate-700/60 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 focus-visible:border-cyan-500/50 focus-visible:ring-cyan-500/20";

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

export function PasswordForm() {
  const toast = useToast();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = watch("newPassword");
  const strength = useMemo(
    () => getPasswordStrength(newPassword ?? ""),
    [newPassword],
  );

  async function onSubmit(data: UpdatePasswordInput) {
    const result = await updatePasswordAction(data);

    if (!result.success) {
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          if (messages?.[0]) {
            setError(field as keyof UpdatePasswordInput, {
              message: messages[0],
            });
          }
        });
      }
      toast.error(result.error);
      return;
    }

    toast.success("Senha atualizada com sucesso.");
    reset();
  }

  function PasswordField({
    id,
    label,
    visible,
    onToggle,
    registration,
    error,
  }: {
    id: string;
    label: string;
    visible: boolean;
    onToggle: () => void;
    registration: ReturnType<typeof register>;
    error?: string;
  }) {
    return (
      <div className="space-y-2">
        <label htmlFor={id} className="text-sm font-medium text-slate-200">
          {label}
        </label>
        <div className="relative">
          <Input
            id={id}
            type={visible ? "text" : "password"}
            {...registration}
            className={cn(fieldClass, "h-11 pr-11")}
            aria-invalid={!!error}
          />
          <button
            type="button"
            onClick={onToggle}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-200"
            aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          >
            {visible ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <PasswordField
        id="currentPassword"
        label="Senha atual"
        visible={showCurrent}
        onToggle={() => setShowCurrent((v) => !v)}
        registration={register("currentPassword")}
        error={errors.currentPassword?.message}
      />

      <PasswordField
        id="newPassword"
        label="Nova senha"
        visible={showNew}
        onToggle={() => setShowNew((v) => !v)}
        registration={register("newPassword")}
        error={errors.newPassword?.message}
      />

      {strength > 0 ? (
        <p className="text-xs text-slate-400">{strengthLabels[strength]}</p>
      ) : null}

      <PasswordField
        id="confirmPassword"
        label="Confirmar nova senha"
        visible={showConfirm}
        onToggle={() => setShowConfirm((v) => !v)}
        registration={register("confirmPassword")}
        error={errors.confirmPassword?.message}
      />

      <Button
        type="submit"
        variant="outline"
        className="h-11 w-full border-slate-600 bg-slate-900/40 text-slate-100 hover:bg-slate-800 sm:w-auto"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Atualizando...
          </>
        ) : (
          "Atualizar senha"
        )}
      </Button>
    </form>
  );
}
