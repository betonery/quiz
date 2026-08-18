"use client";

import { Copy, RefreshCw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import {
  deleteIntegrationAction,
  regenerateIntegrationTokenAction,
} from "@/domains/admin/actions/admin-integrations.actions";
import { AdminConfirmDialog } from "@/domains/admin/components/ui/admin-confirm-dialog";
import {
  AdminCard,
  AdminCardHeader,
} from "@/domains/admin/components/ui/admin-primitives";
import { useToast } from "@/hooks/use-toast";

export function AdminWebhookUrlCard({
  integrationId,
  integrationName,
  webhookUrl,
  eventCount,
}: {
  integrationId: string;
  integrationName: string;
  webhookUrl: string | null;
  eventCount: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <AdminCard>
        <AdminCardHeader
          title="URL do webhook"
          description="Cole este endereço no campo de postback da plataforma de vendas."
        />

        <div className="flex flex-col gap-3 px-5 py-4">
          {webhookUrl === null ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              <p className="font-medium">Não foi possível montar a URL.</p>
              <p className="mt-1 text-xs">
                A variável{" "}
                <code className="rounded bg-slate-900/60 px-1">
                  NEXT_PUBLIC_SUPABASE_URL
                </code>{" "}
                não está definida no ambiente do app. Preencha-a no{" "}
                <code className="rounded bg-slate-900/60 px-1">.env.local</code>{" "}
                (ou nas variáveis da Vercel) e reinicie o servidor.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
                {webhookUrl}
              </code>
              <Button
                variant="outline"
                onClick={() => {
                  void navigator.clipboard.writeText(webhookUrl);
                  toast.success("URL copiada.");
                }}
              >
                <Copy className="size-4" />
                Copiar
              </Button>
            </div>
          )}

          {eventCount === 0 ? (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              Nenhum evento recebido ainda. Cole a URL na plataforma e dispare
              um evento de teste — o payload aparece aqui e libera o mapeamento
              dos campos.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setRegenerateOpen(true)}>
              <RefreshCw className="size-4" />
              Gerar nova URL
            </Button>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="size-4" />
              Excluir integração
            </Button>
          </div>
        </div>
      </AdminCard>

      <AdminConfirmDialog
        open={regenerateOpen}
        onOpenChange={setRegenerateOpen}
        title="Gerar nova URL"
        description="A URL atual para de funcionar imediatamente. Você precisará atualizá-la na plataforma de vendas, senão as vendas param de chegar."
        confirmLabel="Gerar nova URL"
        successMessage="Nova URL gerada."
        destructive
        onConfirm={() => regenerateIntegrationTokenAction(integrationId)}
        onSuccess={() => router.refresh()}
      />

      <AdminConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir integração"
        description={`"${integrationName}" e todo o histórico de eventos recebidos serão apagados. As assinaturas já concedidas permanecem.`}
        confirmLabel="Excluir"
        successMessage="Integração excluída."
        destructive
        confirmationPhrase={integrationName}
        onConfirm={() => deleteIntegrationAction(integrationId)}
        onSuccess={() => router.push(ROUTES.admin.integrations)}
      />
    </>
  );
}
