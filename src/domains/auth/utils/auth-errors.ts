const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "Invalid login credentials": "E-mail ou senha incorretos",
  "User already registered": "Este e-mail já está cadastrado",
  "Password should be at least 6 characters": "Senha muito curta",
  "Email not confirmed": "Confirme seu e-mail antes de entrar",
  "Signup requires a valid password": "Informe uma senha válida",
  "Auth session missing":
    "Sessão expirada. Solicite um novo link de recuperação.",
  "New password should be different from the old password.":
    "A nova senha deve ser diferente da senha atual",
};

export function translateAuthError(message: string): string {
  return AUTH_ERROR_MESSAGES[message] ?? "Ocorreu um erro. Tente novamente.";
}
