import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildWhatsAppUrl,
  normalizePhoneNumber,
} from "./whatsapp-widget.utils";

describe("whatsapp-widget.utils", () => {
  it("normalizes BR phone numbers with country code", () => {
    assert.equal(normalizePhoneNumber("(11) 99999-9999"), "5511999999999");
    assert.equal(normalizePhoneNumber("5511999999999"), "5511999999999");
  });

  it("builds wa.me url with encoded message", () => {
    const url = buildWhatsAppUrl("11999999999", "Olá {{nome}}", {
      nome: "Ana",
    });
    assert.match(url, /^https:\/\/wa\.me\/5511999999999\?text=/);
    assert.match(url, /Ana/);
  });
});
