import Link from "next/link";
import { ROUTES } from "@/constants/routes";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold">Página não encontrada</h2>
      <p className="text-sm text-muted-foreground">
        A página que você procura não existe.
      </p>
      <Link
        href={ROUTES.home}
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
