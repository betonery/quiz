import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canManageWorkspaceTeam,
  formatWorkspaceOwnerLabel,
  getWorkspaceOwnerDisplayName,
} from "./workspace.utils";

describe("workspace.utils", () => {
  it("allows team management for owner and admin", () => {
    assert.equal(canManageWorkspaceTeam("owner"), true);
    assert.equal(canManageWorkspaceTeam("admin"), true);
    assert.equal(canManageWorkspaceTeam("member"), false);
    assert.equal(canManageWorkspaceTeam(null), false);
  });

  it("formats owner label for current user and others", () => {
    assert.equal(
      formatWorkspaceOwnerLabel({
        ownerName: "Mateus",
        ownerId: "user-1",
        currentUserId: "user-1",
      }),
      "Você é o proprietário",
    );
    assert.equal(
      formatWorkspaceOwnerLabel({
        ownerName: "Mateus",
        ownerId: "user-1",
        currentUserId: "user-2",
      }),
      "Dono: Mateus",
    );
  });

  it("derives owner display name from profile", () => {
    assert.equal(
      getWorkspaceOwnerDisplayName({
        full_name: " Mateus Vodan ",
        email: "mateus@example.com",
      }),
      "Mateus Vodan",
    );
    assert.equal(
      getWorkspaceOwnerDisplayName({
        full_name: null,
        email: "mateus@example.com",
      }),
      "mateus",
    );
  });
});
