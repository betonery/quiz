"use client";

import { ChevronDown, ChevronRight, Loader2, RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { reprocessEventAction } from "@/domains/admin/actions/admin-integrations.actions";
import {
  AdminBadge,
  AdminCard,
  AdminCardHeader,
  AdminEmpty,
} from "@/domains/admin/components/ui/admin-primitives";
import { INTEGRATION_EVENT_STATUS_LABELS } from "@/domains/admin/constants/admin.constants";
import type {
  AdminIntegrationEventRow,
  IntegrationEventStatus,
} from "@/domains/admin/types/integration.types";
import { formatDateTime } from "@/domains/admin/utils/admin-format.utils";
import { useToast } from "@/hooks/use-toast";

const STATUS_TONE: Record<
  IntegrationEventStatus,
  "success" | "warning" | "danger" | "neutral"
> = {
  processed: "success",
  captured: "neutral",
  ignored: "warning",
  failed: "danger",
};

export function AdminIntegrationEvents({
  events,
}: {
  events: AdminIntegrationEventRow[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reprocessing, setReprocessing] = useState<string | null>(null);

  async function handleReprocess(eventId: string) {
    setReprocessing(eventId);
    const result = await reprocessEventAction({ eventId });
    setReprocessing(null);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Evento reprocessado.");
    router.refresh();
  }

  return (
    <AdminCard>
      <AdminCardHeader
        title="Eventos recebidos"
        description="Os 30 mais recentes. Eventos com falha podem ser reprocessados."
      />

      {events.length === 0 ? (
        <AdminEmpty
          title="Nenhum evento recebido"
          description="Dispare um evento de teste pela plataforma para começar."
        />
      ) : (
        <ul className="divide-y divide-slate-800/50">
          {events.map((event) => {
            const isOpen = expanded === event.id;

            return (
              <li key={event.id} className="px-5 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : event.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    {isOpen ? (
                      <ChevronDown className="size-4 shrink-0 text-slate-500" />
                    ) : (
                      <ChevronRight className="size-4 shrink-0 text-slate-500" />
                    )}
                    <span className="min-w-0">
                      <span className="block text-xs text-slate-400">
                        {formatDateTime(event.createdAt)}
                      </span>
                      <span className="block truncate text-sm text-slate-300">
                        {event.outcome ??
                          event.errorMessage ??
                          "Evento capturado"}
                      </span>
                    </span>
                  </button>

                  <AdminBadge tone={STATUS_TONE[event.status]}>
                    {INTEGRATION_EVENT_STATUS_LABELS[event.status] ??
                      event.status}
                  </AdminBadge>

                  {event.status !== "processed" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={reprocessing !== null}
                      onClick={() => handleReprocess(event.id)}
                    >
                      {reprocessing === event.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <RotateCw className="size-3.5" />
                      )}
                      Reprocessar
                    </Button>
                  ) : null}
                </div>

                {isOpen ? (
                  <div className="mt-3 flex flex-col gap-2">
                    {event.errorMessage ? (
                      <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                        {event.errorMessage}
                      </p>
                    ) : null}

                    <div>
                      <p className="mb-1 text-xs text-slate-500">
                        Payload recebido
                      </p>
                      <pre className="max-h-80 overflow-auto rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-300">
                        {JSON.stringify(event.payload, null, 2)}
                      </pre>
                    </div>

                    {event.resolved ? (
                      <div>
                        <p className="mb-1 text-xs text-slate-500">
                          Campos resolvidos pelo mapeamento
                        </p>
                        <pre className="max-h-60 overflow-auto rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-300">
                          {JSON.stringify(event.resolved, null, 2)}
                        </pre>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </AdminCard>
  );
}
