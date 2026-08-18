"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { runExpireOverdueSubscriptionsAction } from "@/domains/admin/actions/admin-subscriptions.actions";
import { useToast } from "@/hooks/use-toast";

/** Dispara a rotina `expire_overdue_subscriptions` sem esperar o cron. */
export function AdminExpireJobButton({ canWrite }: { canWrite: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);

  async function handleRun() {
    setPending(true);
    const result = await runExpireOverdueSubscriptionsAction();
    setPending(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Rotina executada.");
    router.refresh();
  }

  return (
    <Button
      variant="outline"
      onClick={handleRun}
      disabled={!canWrite || pending}
      title="Marca como 'em atraso' as assinaturas com período vencido"
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <RefreshCw className="size-4" />
      )}
      Expirar vencidas
    </Button>
  );
}
