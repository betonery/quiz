import type { IntegrationKind } from "@/domains/admin/types/integration.types";
import {
  labelToPath,
  pathToLabel,
} from "@/domains/admin/utils/integration.utils";

/**
 * Estado do formulário de mapeamento. Os caminhos vivem aqui em notação de
 * ponto ("data.customer.email") porque é o que os `<select>` carregam; a
 * conversão para o array que o banco espera acontece no build.
 */
export type MappingFormState = {
  eventFilterPath: string;
  eventFilterValues: string[];
  email: string;
  fullName: string;
  externalPaymentId: string;
  amountPath: string;
  amountUnit: "cents" | "currency";
  paymentMethod: string;
  planMode: "fixed" | "reference" | "reference_any";
  planId: string;
  planPath: string;
  planArrayPath: string;
  planKey: string;
  accessMode: "fixed" | "path";
  accessDays: string;
  accessPath: string;
};

export const EMPTY_MAPPING_FORM: MappingFormState = {
  eventFilterPath: "",
  eventFilterValues: [],
  email: "",
  fullName: "",
  externalPaymentId: "",
  amountPath: "",
  amountUnit: "currency",
  paymentMethod: "",
  planMode: "reference",
  planId: "",
  planPath: "",
  planArrayPath: "",
  planKey: "",
  accessMode: "fixed",
  accessDays: "30",
  accessPath: "",
};

function optionalPath(label: string): string[] | undefined {
  const path = labelToPath(label);
  return path.length > 0 ? path : undefined;
}

/** Monta o objeto que vai para `field_mapping`. */
export function buildMappingFromForm(
  kind: IntegrationKind,
  form: MappingFormState,
): Record<string, unknown> {
  const mapping: Record<string, unknown> = { version: 1 };

  const filterPath = optionalPath(form.eventFilterPath);
  if (filterPath) {
    mapping.eventFilter = {
      path: filterPath,
      acceptedValues: form.eventFilterValues,
    };
  }

  const email = optionalPath(form.email);
  if (email) mapping.email = email;

  const externalPaymentId = optionalPath(form.externalPaymentId);
  if (externalPaymentId) mapping.externalPaymentId = externalPaymentId;

  if (kind === "refund") return mapping;

  const fullName = optionalPath(form.fullName);
  if (fullName) mapping.fullName = fullName;

  const amountPath = optionalPath(form.amountPath);
  if (amountPath) {
    mapping.amount = { path: amountPath, unit: form.amountUnit };
  }

  const paymentMethod = optionalPath(form.paymentMethod);
  if (paymentMethod) mapping.paymentMethod = paymentMethod;

  if (form.planMode === "fixed") {
    mapping.plan = { mode: "fixed", planId: form.planId };
  } else if (form.planMode === "reference") {
    mapping.plan = { mode: "reference", path: labelToPath(form.planPath) };
  } else {
    mapping.plan = {
      mode: "reference_any",
      arrayPath: labelToPath(form.planArrayPath),
      key: form.planKey,
    };
  }

  if (form.accessMode === "fixed") {
    mapping.access = { mode: "fixed", days: Number(form.accessDays) };
  } else {
    mapping.access = { mode: "path", path: labelToPath(form.accessPath) };
  }

  return mapping;
}

function labelFrom(value: unknown): string {
  return Array.isArray(value) ? pathToLabel(value as string[]) : "";
}

/** Reconstrói o formulário a partir do mapeamento salvo. */
export function formFromMapping(
  mapping: Record<string, unknown> | null | undefined,
): MappingFormState {
  if (!mapping || Object.keys(mapping).length === 0) {
    return { ...EMPTY_MAPPING_FORM };
  }

  const form: MappingFormState = { ...EMPTY_MAPPING_FORM };

  const filter = mapping.eventFilter as Record<string, unknown> | undefined;
  if (filter) {
    form.eventFilterPath = labelFrom(filter.path);
    form.eventFilterValues = Array.isArray(filter.acceptedValues)
      ? (filter.acceptedValues as string[])
      : [];
  }

  form.email = labelFrom(mapping.email);
  form.fullName = labelFrom(mapping.fullName);
  form.externalPaymentId = labelFrom(mapping.externalPaymentId);
  form.paymentMethod = labelFrom(mapping.paymentMethod);

  const amount = mapping.amount as Record<string, unknown> | undefined;
  if (amount) {
    form.amountPath = labelFrom(amount.path);
    form.amountUnit = amount.unit === "cents" ? "cents" : "currency";
  }

  const plan = mapping.plan as Record<string, unknown> | undefined;
  if (plan?.mode === "fixed") {
    form.planMode = "fixed";
    form.planId = typeof plan.planId === "string" ? plan.planId : "";
  } else if (plan?.mode === "reference_any") {
    form.planMode = "reference_any";
    form.planArrayPath = labelFrom(plan.arrayPath);
    form.planKey = typeof plan.key === "string" ? plan.key : "";
  } else if (plan?.mode === "reference") {
    form.planMode = "reference";
    form.planPath = labelFrom(plan.path);
  }

  const access = mapping.access as Record<string, unknown> | undefined;
  if (access?.mode === "path") {
    form.accessMode = "path";
    form.accessPath = labelFrom(access.path);
  } else if (access?.mode === "fixed") {
    form.accessMode = "fixed";
    form.accessDays = String(access.days ?? 30);
  }

  return form;
}
