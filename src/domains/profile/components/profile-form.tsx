"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProfileAction } from "@/domains/profile/actions/update-profile.action";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/domains/profile/schemas/update-profile.schema";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const fieldClass =
  "border-slate-700/60 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 focus-visible:border-cyan-500/50 focus-visible:ring-cyan-500/20";

type ProfileFormProps = {
  email: string;
  defaultFullName: string;
};

export function ProfileForm({ email, defaultFullName }: ProfileFormProps) {
  const router = useRouter();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { full_name: defaultFullName },
  });

  async function onSubmit(data: UpdateProfileInput) {
    const result = await updateProfileAction(data);

    if (!result.success) {
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          if (messages?.[0]) {
            setError(field as keyof UpdateProfileInput, {
              message: messages[0],
            });
          }
        });
      }
      toast.error(result.error);
      return;
    }

    toast.success("Perfil atualizado com sucesso.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="full_name"
          className="text-sm font-medium text-slate-200"
        >
          Nome
        </label>
        <Input
          id="full_name"
          {...register("full_name")}
          className={cn(fieldClass, "h-11")}
          aria-invalid={!!errors.full_name}
        />
        {errors.full_name ? (
          <p className="text-sm text-red-300">{errors.full_name.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-slate-200">
          E-mail
        </label>
        <Input
          id="email"
          value={email}
          disabled
          className={cn(fieldClass, "h-11 opacity-60")}
        />
        <p className="text-xs text-slate-500">
          O e-mail não pode ser alterado aqui.
        </p>
      </div>

      <Button
        type="submit"
        variant="brand"
        className="h-11 w-full sm:w-auto"
        disabled={isSubmitting || !isDirty}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Salvando...
          </>
        ) : (
          "Salvar alterações"
        )}
      </Button>
    </form>
  );
}
