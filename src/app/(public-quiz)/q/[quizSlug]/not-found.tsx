import Link from "next/link";
import { ROUTES } from "@/constants/routes";

export default function PublicQuizNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white p-6">
      <h1 className="text-xl font-semibold text-neutral-900">
        Funil não encontrado
      </h1>
      <p className="max-w-md text-center text-neutral-500">
        Este funil ainda não foi publicado ou o link está incorreto.
      </p>
      <Link
        href={ROUTES.home}
        className="text-sm font-medium text-neutral-900 hover:underline"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
