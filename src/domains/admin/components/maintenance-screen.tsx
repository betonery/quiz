import { Wrench } from "lucide-react";
import { logoutAction } from "@/domains/auth/actions/logout.action";

/**
 * Tela exibida a usuários comuns enquanto o modo manutenção está ligado.
 * Staff da plataforma continua navegando normalmente.
 */
export function MaintenanceScreen({
  message,
  supportEmail,
}: {
  message: string;
  supportEmail: string | null;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#0a0f1a] px-6 text-center text-slate-100">
      <span className="flex size-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-300">
        <Wrench className="size-6" />
      </span>

      <div className="max-w-md">
        <h1 className="text-xl font-semibold text-slate-50">Em manutenção</h1>
        <p className="mt-2 text-sm text-slate-400">{message}</p>
      </div>

      {supportEmail ? (
        <a
          href={`mailto:${supportEmail}`}
          className="text-sm text-cyan-400 hover:underline"
        >
          {supportEmail}
        </a>
      ) : null}

      <form action={logoutAction}>
        <button
          type="submit"
          className="rounded-xl border border-slate-700/70 px-4 py-2 text-sm text-slate-300 transition-colors hover:border-slate-600 hover:text-slate-100"
        >
          Sair da conta
        </button>
      </form>
    </div>
  );
}
