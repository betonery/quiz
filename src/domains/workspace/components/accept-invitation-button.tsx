"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { acceptWorkspaceInvitationAction } from "@/domains/workspace/actions/workspace.actions";

type AcceptInvitationButtonProps = {
  token: string;
};

export function AcceptInvitationButton({ token }: AcceptInvitationButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setLoading(true);
    setError(null);

    const result = await acceptWorkspaceInvitationAction(token);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.push(
      `${ROUTES.dashboard}?workspace=${encodeURIComponent(result.workspaceSlug)}`,
    );
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        className="w-full"
        disabled={loading}
        onClick={() => void handleAccept()}
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Aceitando...
          </>
        ) : (
          "Aceitar convite"
        )}
      </Button>
      {error ? (
        <p className="text-center text-sm text-red-300">{error}</p>
      ) : null}
    </div>
  );
}
