import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildMappingFromForm,
  EMPTY_MAPPING_FORM,
  formFromMapping,
  type MappingFormState,
} from "@/domains/admin/utils/integration-form.utils";
import { isMappingComplete } from "@/domains/admin/utils/integration.utils";

const FILLED: MappingFormState = {
  eventFilterPath: "event",
  eventFilterValues: ["order.paid"],
  email: "data.customer.email",
  fullName: "data.customer.name",
  externalPaymentId: "data.order_id",
  amountPath: "data.total",
  amountUnit: "currency",
  paymentMethod: "data.method",
  planMode: "reference_any",
  planId: "",
  planPath: "",
  planArrayPath: "data.items",
  planKey: "product_id",
  accessMode: "fixed",
  accessDays: "30",
  accessPath: "",
};

describe("integration-form.utils", () => {
  it("converte o formulário em mapeamento com caminhos em array", () => {
    const mapping = buildMappingFromForm("purchase", FILLED);

    assert.deepEqual(mapping.email, ["data", "customer", "email"]);
    assert.deepEqual(mapping.externalPaymentId, ["data", "order_id"]);
    assert.deepEqual(mapping.eventFilter, {
      path: ["event"],
      acceptedValues: ["order.paid"],
    });
    assert.deepEqual(mapping.amount, {
      path: ["data", "total"],
      unit: "currency",
    });
    assert.deepEqual(mapping.plan, {
      mode: "reference_any",
      arrayPath: ["data", "items"],
      key: "product_id",
    });
    assert.deepEqual(mapping.access, { mode: "fixed", days: 30 });
  });

  it("faz round-trip sem perder informação", () => {
    const mapping = buildMappingFromForm("purchase", FILLED);
    const restored = formFromMapping(mapping);
    assert.deepEqual(restored, FILLED);
  });

  it("omite campos opcionais vazios", () => {
    const mapping = buildMappingFromForm("purchase", {
      ...FILLED,
      fullName: "",
      amountPath: "",
      paymentMethod: "",
      eventFilterPath: "",
    });

    assert.equal("fullName" in mapping, false);
    assert.equal("amount" in mapping, false);
    assert.equal("paymentMethod" in mapping, false);
    assert.equal("eventFilter" in mapping, false);
  });

  it("reembolso ignora campos exclusivos de compra", () => {
    const mapping = buildMappingFromForm("refund", FILLED);

    assert.deepEqual(mapping.email, ["data", "customer", "email"]);
    assert.deepEqual(mapping.externalPaymentId, ["data", "order_id"]);
    assert.equal("plan" in mapping, false);
    assert.equal("access" in mapping, false);
    assert.equal("amount" in mapping, false);
  });

  it("o mapeamento gerado passa na checagem de completude", () => {
    assert.equal(
      isMappingComplete("purchase", buildMappingFromForm("purchase", FILLED)),
      true,
    );
    assert.equal(
      isMappingComplete("refund", buildMappingFromForm("refund", FILLED)),
      true,
    );
    assert.equal(
      isMappingComplete(
        "purchase",
        buildMappingFromForm("purchase", EMPTY_MAPPING_FORM),
      ),
      false,
    );
  });

  it("mapeamento vazio devolve o formulário inicial", () => {
    assert.deepEqual(formFromMapping({}), EMPTY_MAPPING_FORM);
    assert.deepEqual(formFromMapping(null), EMPTY_MAPPING_FORM);
  });

  it("reconstrói o modo de plano fixo", () => {
    const restored = formFromMapping({
      version: 1,
      email: ["e"],
      externalPaymentId: ["o"],
      plan: { mode: "fixed", planId: "pro" },
      access: { mode: "path", path: ["data", "days"] },
    });

    assert.equal(restored.planMode, "fixed");
    assert.equal(restored.planId, "pro");
    assert.equal(restored.accessMode, "path");
    assert.equal(restored.accessPath, "data.days");
  });
});
