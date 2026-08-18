import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { updatePasswordSchema } from "@/domains/profile/schemas/update-password.schema";

describe("update-password.schema", () => {
  it("accepts valid password change", () => {
    const result = updatePasswordSchema.safeParse({
      currentPassword: "oldpass123",
      newPassword: "newpass123",
      confirmPassword: "newpass123",
    });
    assert.equal(result.success, true);
  });

  it("rejects mismatched confirmation", () => {
    const result = updatePasswordSchema.safeParse({
      currentPassword: "oldpass123",
      newPassword: "newpass123",
      confirmPassword: "otherpass",
    });
    assert.equal(result.success, false);
  });

  it("rejects when new password equals current", () => {
    const result = updatePasswordSchema.safeParse({
      currentPassword: "samepass123",
      newPassword: "samepass123",
      confirmPassword: "samepass123",
    });
    assert.equal(result.success, false);
  });
});
