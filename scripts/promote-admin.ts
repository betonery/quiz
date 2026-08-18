/**
 * Promove um usuário existente a platform admin (service role).
 *
 * Uso:
 *   npm run setup:promote-admin -- --email=dono@empresa.com
 *
 * Lê NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY de .env.local / .env.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFiles() {
  for (const file of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;
    const text = readFileSync(path, "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

function parseEmail(argv: string[]): string | null {
  for (const arg of argv) {
    if (arg.startsWith("--email=")) {
      return arg.slice("--email=".length).trim().toLowerCase();
    }
  }
  const flagIndex = argv.indexOf("--email");
  if (flagIndex !== -1 && argv[flagIndex + 1]) {
    return argv[flagIndex + 1].trim().toLowerCase();
  }
  return null;
}

async function main() {
  loadEnvFiles();

  const email = parseEmail(process.argv.slice(2));
  if (!email) {
    console.error(
      "Informe o e-mail: npm run setup:promote-admin -- --email=seu@email.com",
    );
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error(
      "Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local",
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: profile, error: findError } = await supabase
    .from("profiles")
    .select("id, email, platform_role")
    .eq("email", email)
    .maybeSingle();

  if (findError) {
    console.error("Erro ao buscar perfil:", findError.message);
    process.exit(1);
  }

  if (!profile) {
    console.error(
      `Nenhum perfil com e-mail "${email}". Crie a conta em /register antes.`,
    );
    process.exit(1);
  }

  if (profile.platform_role === "admin") {
    console.log(`OK: ${email} já é admin (id=${profile.id}).`);
    return;
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ platform_role: "admin" })
    .eq("id", profile.id);

  if (updateError) {
    console.error("Falha ao promover:", updateError.message);
    process.exit(1);
  }

  console.log(`OK: ${email} promovido a admin. Acesse /admin.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
