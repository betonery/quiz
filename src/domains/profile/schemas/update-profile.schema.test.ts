import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { updateProfileSchema } from "@/domains/profile/schemas/update-profile.schema";

describe("update-profile.schema", () => {
  it("accepts valid full name", () => {
    const result = updateProfileSchema.safeParse({ full_name: "João Silva" });
    assert.equal(result.success, true);
  });

  it("trims full name", () => {
    const result = updateProfileSchema.safeParse({ full_name: "  Ana  " });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.full_name, "Ana");
    }
  });

  it("rejects short names", () => {
    const result = updateProfileSchema.safeParse({ full_name: "A" });
    assert.equal(result.success, false);
  });
});
