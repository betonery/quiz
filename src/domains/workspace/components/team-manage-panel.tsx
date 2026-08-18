"use client";

import { Copy, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getWorkspaceTeamDataAction,
  inviteWorkspaceMemberAction,
  revokeWorkspaceInvitationAction,
} from "@/domains/workspace/actions/workspace.actions";
import type {
  InviteRole,
  WorkspaceInvitation,
  WorkspaceMemberWithProfile,
} from "@/domains/workspace/types/workspace.types";
import { WORKSPACE_ROLE_LABELS } from "@/constants/workspace";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

type TeamManagePanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceSlug: string;
};

export function TeamManagePanel({
  open,
  onOpenChange,
  workspaceSlug,
}: TeamManagePanelProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("member");
  const [members, setMembers] = useState<WorkspaceMemberWithProfile[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const loadTeam = useCallback(async () => {
    if (!workspaceSlug) return;
    setLoading(true);
    setError(null);
    const result = await getWorkspaceTeamDataAction(workspaceSlug);
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "Erro ao carregar equipe");
      return;
    }

    setMembers(result.members);
    setInvitations(result.invitations);
    setCanManage(result.canManage);
    setWorkspaceName(result.workspace.name);
  }, [workspaceSlug]);

  useEffect(() => {
    if (open) {
      void loadTeam();
      setFeedback(null);
      setLastInviteLink(null);
    }
  }, [open, loadTeam]);

  async function handleInvite(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    setFeedback(null);
    setError(null);

    const result = await inviteWorkspaceMemberAction(
      workspaceSlug,
      email,
      role,
    );
    setSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "Erro ao criar convite");
      return;
    }

    const link = `${siteConfig.url}/invite/${result.invitation.token}`;
    setLastInviteLink(link);
    setFeedback("Convite criado. Copie o link e envie ao convidado.");
    setEmail("");
    await loadTeam();
  }

  async function handleRevoke(invitationId: string) {
    const result = await revokeWorkspaceInvitationAction(
      workspaceSlug,
      invitationId,
    );
    if (!result.success) {
      setError(result.error ?? "Erro ao revogar convite");
      return;
    }
    await loadTeam();
  }

  async function copyInviteLink() {
    if (!lastInviteLink) return;
    await navigator.clipboard.writeText(lastInviteLink);
    setFeedback("Link copiado para a área de transferência.");
  }

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4 sm:p-6">
      <button
        type="button"
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Fechar"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-10 my-auto flex max-h-[min(640px,calc(100vh-2rem))] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-700/70 bg-[#0c1220] shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-700/60 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Gerenciar equipe
            </h2>
            <p className="text-sm text-slate-400">{workspaceName}</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex size-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {error ? (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {error}
                </p>
              ) : null}
              {feedback ? (
                <p className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100">
                  {feedback}
                </p>
              ) : null}
              {lastInviteLink ? (
                <div className="flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-900/50 p-2">
                  <code className="min-w-0 flex-1 truncate text-xs text-slate-300">
                    {lastInviteLink}
                  </code>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="shrink-0 border-slate-600"
                    onClick={() => void copyInviteLink()}
                  >
                    <Copy className="size-3.5" />
                  </Button>
                </div>
              ) : null}

              {canManage ? (
                <form
                  onSubmit={(e) => void handleInvite(e)}
                  className="space-y-3"
                >
                  <h3 className="text-sm font-medium text-slate-200">
                    Convidar membro
                  </h3>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    className="border-slate-700 bg-slate-900/60 text-slate-100"
                  />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as InviteRole)}
                    className="flex h-9 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 text-sm text-slate-100"
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Membro</option>
                  </select>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Criar convite"
                    )}
                  </Button>
                </form>
              ) : null}

              <section className="space-y-2">
                <h3 className="text-sm font-medium text-slate-200">Membros</h3>
                <ul className="space-y-2">
                  {members.map((member) => (
                    <li
                      key={member.id}
                      className="flex items-center justify-between rounded-xl border border-slate-700/50 bg-slate-900/40 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          {member.profile.full_name?.trim() ||
                            member.profile.email}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {member.profile.email}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium uppercase",
                          member.role === "owner"
                            ? "bg-amber-500/15 text-amber-300"
                            : member.role === "admin"
                              ? "bg-cyan-500/15 text-cyan-300"
                              : "bg-slate-500/15 text-slate-300",
                        )}
                      >
                        {WORKSPACE_ROLE_LABELS[
                          member.role as keyof typeof WORKSPACE_ROLE_LABELS
                        ] ?? member.role}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              {canManage && invitations.length > 0 ? (
                <section className="space-y-2">
                  <h3 className="text-sm font-medium text-slate-200">
                    Convites pendentes
                  </h3>
                  <ul className="space-y-2">
                    {invitations.map((invitation) => (
                      <li
                        key={invitation.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-slate-700/50 bg-slate-900/40 px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm text-white">
                            {invitation.email}
                          </p>
                          <p className="text-xs text-slate-400">
                            {invitation.role === "admin" ? "Admin" : "Membro"}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="shrink-0 border-slate-600 text-xs"
                          onClick={() => void handleRevoke(invitation.id)}
                        >
                          Revogar
                        </Button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
