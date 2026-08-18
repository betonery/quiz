import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canAccessAdminPanel,
  canWriteAdminPanel,
  evaluateRoleChange,
  evaluateUserDeletion,
  evaluateUserSuspension,
  isPlatformAdmin,
  isPlatformStaff,
  parsePlatformRole,
  wouldRemoveLastAdmin,
} from "@/domains/admin/utils/admin-access.utils";

describe("admin-access.utils", () => {
  it("normaliza papéis desconhecidos para user", () => {
    assert.equal(parsePlatformRole("admin"), "admin");
    assert.equal(parsePlatformRole("support"), "support");
    assert.equal(parsePlatformRole("superadmin"), "user");
    assert.equal(parsePlatformRole(null), "user");
    assert.equal(parsePlatformRole(undefined), "user");
  });

  it("separa acesso ao painel de permissão de escrita", () => {
    assert.equal(canAccessAdminPanel("support"), true);
    assert.equal(canWriteAdminPanel("support"), false);
    assert.equal(canAccessAdminPanel("admin"), true);
    assert.equal(canWriteAdminPanel("admin"), true);
    assert.equal(canAccessAdminPanel("user"), false);
    assert.equal(isPlatformAdmin("admin"), true);
    assert.equal(isPlatformStaff("user"), false);
  });

  it("detecta remoção do último administrador", () => {
    assert.equal(
      wouldRemoveLastAdmin({
        currentAdminCount: 1,
        targetIsAdmin: true,
        nextRoleIsAdmin: false,
      }),
      true,
    );
    assert.equal(
      wouldRemoveLastAdmin({
        currentAdminCount: 2,
        targetIsAdmin: true,
        nextRoleIsAdmin: false,
      }),
      false,
    );
    assert.equal(
      wouldRemoveLastAdmin({
        currentAdminCount: 1,
        targetIsAdmin: false,
        nextRoleIsAdmin: false,
      }),
      false,
    );
  });

  it("bloqueia auto-rebaixamento", () => {
    const result = evaluateRoleChange({
      actorId: "u1",
      actorRole: "admin",
      targetId: "u1",
      targetRole: "admin",
      nextRole: "user",
      currentAdminCount: 3,
    });
    assert.equal(result.allowed, false);
  });

  it("bloqueia suporte alterando papéis", () => {
    const result = evaluateRoleChange({
      actorId: "u1",
      actorRole: "support",
      targetId: "u2",
      targetRole: "user",
      nextRole: "admin",
      currentAdminCount: 2,
    });
    assert.equal(result.allowed, false);
  });

  it("permite promoção legítima", () => {
    const result = evaluateRoleChange({
      actorId: "u1",
      actorRole: "admin",
      targetId: "u2",
      targetRole: "user",
      nextRole: "support",
      currentAdminCount: 1,
    });
    assert.deepEqual(result, { allowed: true });
  });

  it("recusa alteração para o mesmo papel", () => {
    const result = evaluateRoleChange({
      actorId: "u1",
      actorRole: "admin",
      targetId: "u2",
      targetRole: "support",
      nextRole: "support",
      currentAdminCount: 2,
    });
    assert.equal(result.allowed, false);
  });

  it("impede excluir a própria conta ou o último admin", () => {
    assert.equal(
      evaluateUserDeletion({
        actorId: "u1",
        actorRole: "admin",
        targetId: "u1",
        targetRole: "admin",
        currentAdminCount: 5,
      }).allowed,
      false,
    );

    assert.equal(
      evaluateUserDeletion({
        actorId: "u1",
        actorRole: "admin",
        targetId: "u2",
        targetRole: "admin",
        currentAdminCount: 1,
      }).allowed,
      false,
    );

    assert.equal(
      evaluateUserDeletion({
        actorId: "u1",
        actorRole: "admin",
        targetId: "u2",
        targetRole: "user",
        currentAdminCount: 1,
      }).allowed,
      true,
    );
  });

  it("impede auto-suspensão", () => {
    assert.equal(
      evaluateUserSuspension({
        actorId: "u1",
        actorRole: "admin",
        targetId: "u1",
      }).allowed,
      false,
    );
    assert.equal(
      evaluateUserSuspension({
        actorId: "u1",
        actorRole: "admin",
        targetId: "u2",
      }).allowed,
      true,
    );
  });
});
