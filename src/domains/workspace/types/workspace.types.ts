import type { Database } from "@/types/database.types";

export type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];

export type WorkspaceMember =
  Database["public"]["Tables"]["workspace_members"]["Row"];

export type WorkspaceRole = "owner" | "admin" | "member";

export type InviteRole = "admin" | "member";

export type WorkspaceInvitationStatus = "pending" | "accepted" | "revoked";

export type WorkspaceInvitation = {
  id: string;
  workspace_id: string;
  email: string;
  role: InviteRole;
  token: string;
  invited_by: string;
  status: WorkspaceInvitationStatus;
  expires_at: string;
  created_at: string;
};

export type UserWorkspace = Workspace & {
  role: WorkspaceRole;
  owner: WorkspaceOwnerSummary;
};

export type WorkspaceOwnerSummary = {
  id: string;
  full_name: string | null;
  email: string;
};

export type WorkspaceMemberWithProfile = WorkspaceMember & {
  profile: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
};

export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
};
