"use client";

import { CheckCircle2, Loader2, Save, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  previewMappingAction,
  updateIntegrationAction,
} from "@/domains/admin/actions/admin-integrations.actions";
import {
  AdminField,
  AdminFormError,
  AdminInput,
  AdminSelect,
  AdminSwitch,
} from "@/domains/admin/components/ui/admin-form-fields";
import {
  AdminCard,
  AdminCardHeader,
} from "@/domains/admin/components/ui/admin-primitives";
import { AdminTagsInput } from "@/domains/admin/components/ui/admin-tags-input";
import type { AdminPlanRow } from "@/domains/admin/types/admin.types";
import type {
  AdminIntegrationEventRow,
  AdminIntegrationRow,
  DetectedPath,
  MappingPreview,
} from "@/domains/admin/types/integration.types";
import { formatCents } from "@/domains/admin/utils/admin-format.utils";
import {
  buildMappingFromForm,
  formFromMapping,
  type MappingFormState,
} from "@/domains/admin/utils/integration-form.utils";
import {
  extractArrayItemKeys,
  extractArrayPaths,
  extractPayloadPaths,
  labelToPath,
} from "@/domains/admin/utils/integration.utils";
import { useToast } from "@/hooks/use-toast";

type Props = {
  integration: AdminIntegrationRow;
  events: AdminIntegrationEventRow[];
  plans: AdminPlanRow[];
};

/** Select de caminho, alimentado pelos campos detectados no evento escolhido. */
function PathSelect({
  value,
  onChange,
  paths,
  allowEmpty = true,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  paths: DetectedPath[];
  allowEmpty?: boolean;
  disabled?: boolean;
}) {
  // Um caminho salvo que não existe no evento atual continua listado, senão
  // trocar de evento apagaria silenciosamente o mapeamento.
  const options = useMemo(() => {
    const labels = paths.map((p) => p.label);
    if (value && !labels.includes(value)) {
      return [
        { label: value, preview: "(não encontrado neste evento)" },
        ...paths,
      ];
    }
    return paths;
  }, [paths, value]);

  return (
    <AdminSelect
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    >
      {allowEmpty ? <option value="">— não usar —</option> : null}
      {options.map((option) => (
        <option key={option.label} value={option.label}>
          {option.label} · {option.preview}
        </option>
      ))}
    </AdminSelect>
  );
}

export function AdminMappingForm({ integration, events, plans }: Props) {
  const router = useRouter();
  const toast = useToast();

  const isPurchase = integration.kind === "purchase";

  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? "");
  const [form, setForm] = useState<MappingFormState>(() =>
    formFromMapping(integration.fieldMapping),
  );
  const [name, setName] = useState(integration.name);
  const [providerSlug, setProviderSlug] = useState(integration.providerSlug);
  const [enabled, setEnabled] = useState(integration.enabled);
  const [password, setPassword] = useState("");
  const [changePassword, setChangePassword] = useState(false);

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [preview, setPreview] = useState<MappingPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedEvent = events.find((event) => event.id === selectedEventId);

  // Referência estável: sem isto o objeto novo a cada render invalidaria os
  // useMemo abaixo e o payload seria reprocessado o tempo todo.
  const payload = useMemo(() => selectedEvent?.payload ?? {}, [selectedEvent]);

  const paths = useMemo(() => extractPayloadPaths(payload), [payload]);
  const arrayPaths = useMemo(() => extractArrayPaths(payload), [payload]);
  const itemKeys = useMemo(
    () => extractArrayItemKeys(payload, labelToPath(form.planArrayPath)),
    [payload, form.planArrayPath],
  );

  function patch(next: Partial<MappingFormState>) {
    setForm((current) => ({ ...current, ...next }));
    setPreview(null);
  }

  async function handleTest() {
    if (!selectedEvent) {
      toast.error("Selecione um evento capturado para testar.");
      return;
    }

    setTesting(true);
    setError(null);

    const result = await previewMappingAction({
      mapping: buildMappingFromForm(integration.kind, form),
      payload: selectedEvent.payload,
      kind: integration.kind,
    });

    setTesting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setPreview(result.data ?? null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    const result = await updateIntegrationAction({
      integrationId: integration.id,
      name,
      providerSlug,
      enabled,
      defaultPassword: changePassword ? password : null,
      fieldMapping: buildMappingFromForm(integration.kind, form),
    });

    setSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    toast.success("Integração salva.");
    setChangePassword(false);
    setPassword("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminCard>
        <AdminCardHeader title="Identificação" />
        <div className="grid gap-3 px-5 py-4 sm:grid-cols-2">
          <AdminField label="Nome">
            <AdminInput
              value={name}
              maxLength={80}
              onChange={(event) => setName(event.target.value)}
            />
          </AdminField>
          <AdminField
            label="Identificador da plataforma"
            hint="Mesmo valor na compra e no reembolso da mesma plataforma."
          >
            <AdminInput
              value={providerSlug}
              onChange={(event) => setProviderSlug(event.target.value)}
            />
          </AdminField>
        </div>
      </AdminCard>

      <AdminCard>
        <AdminCardHeader
          title="Mapeamento de campos"
          description="Escolha de onde vem cada informação no payload da plataforma."
          action={
            events.length > 0 ? (
              <AdminSelect
                value={selectedEventId}
                onChange={(event) => {
                  setSelectedEventId(event.target.value);
                  setPreview(null);
                }}
                className="w-56"
              >
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {new Date(event.createdAt).toLocaleString("pt-BR")} ·{" "}
                    {event.status}
                  </option>
                ))}
              </AdminSelect>
            ) : null
          }
        />

        {events.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-400">
            Nenhum evento recebido ainda. Cole a URL na plataforma e dispare um
            evento de teste — os campos aparecem aqui automaticamente.
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-5 py-4">
            <AdminField
              label="Campo que identifica o tipo do evento"
              hint="A plataforma manda vários tipos na mesma URL. Sem filtro, todos são processados."
            >
              <PathSelect
                value={form.eventFilterPath}
                onChange={(value) => patch({ eventFilterPath: value })}
                paths={paths}
              />
            </AdminField>

            {form.eventFilterPath ? (
              <AdminField
                label="Eventos aceitos"
                hint="Só estes serão processados. Os demais ficam registrados como ignorados."
              >
                <AdminTagsInput
                  value={form.eventFilterValues}
                  onChange={(values) => patch({ eventFilterValues: values })}
                  placeholder="ex.: order.paid"
                  maxTags={30}
                />
              </AdminField>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <AdminField label="E-mail do comprador">
                <PathSelect
                  value={form.email}
                  onChange={(value) => patch({ email: value })}
                  paths={paths}
                />
              </AdminField>

              <AdminField
                label="Identificador do pedido"
                hint="Chave contra reenvios duplicados da plataforma."
              >
                <PathSelect
                  value={form.externalPaymentId}
                  onChange={(value) => patch({ externalPaymentId: value })}
                  paths={paths}
                />
              </AdminField>
            </div>

            {isPurchase ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <AdminField label="Nome do comprador">
                    <PathSelect
                      value={form.fullName}
                      onChange={(value) => patch({ fullName: value })}
                      paths={paths}
                    />
                  </AdminField>

                  <AdminField label="Forma de pagamento">
                    <PathSelect
                      value={form.paymentMethod}
                      onChange={(value) => patch({ paymentMethod: value })}
                      paths={paths}
                    />
                  </AdminField>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
                  <AdminField
                    label="Valor pago"
                    hint="Opcional. Sem valor, o acesso é liberado sem registrar o pagamento."
                  >
                    <PathSelect
                      value={form.amountPath}
                      onChange={(value) => patch({ amountPath: value })}
                      paths={paths}
                    />
                  </AdminField>

                  <AdminField label="Formato do valor">
                    <AdminSelect
                      value={form.amountUnit}
                      onChange={(event) =>
                        patch({
                          amountUnit: event.target.value as
                            | "cents"
                            | "currency",
                        })
                      }
                    >
                      <option value="currency">Reais (97,00)</option>
                      <option value="cents">Centavos (9700)</option>
                    </AdminSelect>
                  </AdminField>
                </div>

                <div className="rounded-xl border border-slate-800 p-3">
                  <p className="mb-3 text-xs font-medium tracking-wide text-slate-400 uppercase">
                    Qual plano liberar
                  </p>

                  <div className="flex flex-col gap-3">
                    <AdminSelect
                      value={form.planMode}
                      onChange={(event) =>
                        patch({
                          planMode: event.target
                            .value as MappingFormState["planMode"],
                        })
                      }
                    >
                      <option value="reference">
                        Pelo código do produto no payload
                      </option>
                      <option value="reference_any">
                        Procurar em uma lista de itens (order bump)
                      </option>
                      <option value="fixed">Sempre o mesmo plano</option>
                    </AdminSelect>

                    {form.planMode === "fixed" ? (
                      <AdminField label="Plano">
                        <AdminSelect
                          value={form.planId}
                          onChange={(event) =>
                            patch({ planId: event.target.value })
                          }
                        >
                          <option value="">— selecione —</option>
                          {plans.map((plan) => (
                            <option key={plan.id} value={plan.id}>
                              {plan.name} — {formatCents(plan.priceCents)}
                            </option>
                          ))}
                        </AdminSelect>
                      </AdminField>
                    ) : null}

                    {form.planMode === "reference" ? (
                      <AdminField
                        label="Campo com o código do produto"
                        hint="O código precisa estar em Referências externas de algum plano."
                      >
                        <PathSelect
                          value={form.planPath}
                          onChange={(value) => patch({ planPath: value })}
                          paths={paths}
                        />
                      </AdminField>
                    ) : null}

                    {form.planMode === "reference_any" ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <AdminField
                          label="Lista de itens"
                          hint="Todos os itens viram candidatos."
                        >
                          <PathSelect
                            value={form.planArrayPath}
                            onChange={(value) =>
                              patch({ planArrayPath: value, planKey: "" })
                            }
                            paths={arrayPaths}
                          />
                        </AdminField>

                        <AdminField label="Campo do código no item">
                          <AdminSelect
                            value={form.planKey}
                            onChange={(event) =>
                              patch({ planKey: event.target.value })
                            }
                          >
                            <option value="">— selecione —</option>
                            {itemKeys.map((key) => (
                              <option key={key} value={key}>
                                {key}
                              </option>
                            ))}
                          </AdminSelect>
                        </AdminField>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 p-3">
                  <p className="mb-3 text-xs font-medium tracking-wide text-slate-400 uppercase">
                    Por quantos dias
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <AdminSelect
                      value={form.accessMode}
                      onChange={(event) =>
                        patch({
                          accessMode: event.target
                            .value as MappingFormState["accessMode"],
                        })
                      }
                    >
                      <option value="fixed">Sempre a mesma quantidade</option>
                      <option value="path">Vem no payload</option>
                    </AdminSelect>

                    {form.accessMode === "fixed" ? (
                      <AdminInput
                        type="number"
                        min={1}
                        max={3650}
                        value={form.accessDays}
                        onChange={(event) =>
                          patch({ accessDays: event.target.value })
                        }
                      />
                    ) : (
                      <PathSelect
                        value={form.accessPath}
                        onChange={(value) => patch({ accessPath: value })}
                        paths={paths}
                      />
                    )}
                  </div>
                </div>
              </>
            ) : null}

            <div>
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={testing || !selectedEvent}
              >
                {testing ? <Loader2 className="size-4 animate-spin" /> : null}
                Testar mapeamento
              </Button>
            </div>

            {preview ? <MappingPreviewPanel preview={preview} /> : null}
          </div>
        )}
      </AdminCard>

      {isPurchase ? (
        <AdminCard>
          <AdminCardHeader
            title="Senha das contas novas"
            description="Aplicada apenas a compradores que ainda não têm conta."
          />
          <div className="flex flex-col gap-3 px-5 py-4">
            <p className="text-xs text-slate-500">
              {integration.hasDefaultPassword
                ? "Uma senha já está configurada. Ela não é exibida."
                : "Nenhuma senha configurada — sem ela, contas novas não podem ser criadas."}
            </p>

            {changePassword ? (
              <AdminField
                label="Nova senha padrão"
                hint="Mínimo de 8 caracteres. Oriente o comprador a trocá-la no primeiro acesso."
              >
                <AdminInput
                  type="text"
                  value={password}
                  autoComplete="new-password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                />
              </AdminField>
            ) : (
              <div>
                <Button
                  variant="outline"
                  onClick={() => setChangePassword(true)}
                >
                  {integration.hasDefaultPassword
                    ? "Alterar senha"
                    : "Definir senha"}
                </Button>
              </div>
            )}
          </div>
        </AdminCard>
      ) : null}

      <AdminCard>
        <AdminCardHeader title="Ativação" />
        <div className="flex flex-col gap-3 px-5 py-4">
          <AdminSwitch
            checked={enabled}
            onChange={setEnabled}
            label="Integração ativa"
            description="Desativada, os eventos continuam sendo registrados mas nada é aplicado."
          />

          <AdminFormError message={error} />

          <div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Salvar integração
            </Button>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}

function MappingPreviewPanel({ preview }: { preview: MappingPreview }) {
  const hasErrors = preview.errors.length > 0;

  return (
    <div
      className={`rounded-xl border p-3 ${
        hasErrors
          ? "border-red-500/30 bg-red-500/5"
          : "border-emerald-500/30 bg-emerald-500/5"
      }`}
    >
      <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
        {hasErrors ? (
          <>
            <XCircle className="size-4 text-red-400" />
            <span className="text-red-300">Mapeamento incompleto</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="size-4 text-emerald-400" />
            <span className="text-emerald-300">Mapeamento válido</span>
          </>
        )}
      </p>

      <dl className="grid gap-2 text-xs sm:grid-cols-2">
        <PreviewRow label="E-mail" value={preview.email} />
        <PreviewRow label="Nome" value={preview.fullName} />
        <PreviewRow label="Pedido" value={preview.externalPaymentId} />
        <PreviewRow
          label="Valor"
          value={
            preview.amountCents != null
              ? formatCents(preview.amountCents)
              : null
          }
        />
        <PreviewRow
          label="Código do plano"
          value={
            preview.planId ??
            (preview.planRefs && preview.planRefs.length > 0
              ? preview.planRefs.join(", ")
              : null)
          }
        />
        <PreviewRow
          label="Dias"
          value={preview.days != null ? String(preview.days) : null}
        />
        <PreviewRow label="Tipo do evento" value={preview.eventValue} />
      </dl>

      {preview.eventAccepted === false ? (
        <p className="mt-2 text-xs text-amber-300">
          Este evento não está na lista aceita e seria ignorado.
        </p>
      ) : null}

      {hasErrors ? (
        <ul className="mt-2 flex flex-col gap-0.5">
          {preview.errors.map((message) => (
            <li key={message} className="text-xs text-red-300">
              • {message}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function PreviewRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="shrink-0 text-slate-500">{label}:</dt>
      <dd className="min-w-0 truncate text-slate-200">
        {value ?? <span className="text-slate-600">—</span>}
      </dd>
    </div>
  );
}
