/**
 * Helpers multi-tenant — placeholders para implementação futura.
 * Tenant key: workspace_id resolvido via workspaceSlug na URL.
 */

export type TenantContext = {
  workspaceId: string;
  workspaceSlug: string;
};

export function resolveTenantFromSlug(
  workspaceSlug: string,
): Pick<TenantContext, "workspaceSlug"> {
  return { workspaceSlug };
}
