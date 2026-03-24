import { fluxoCasaRepository } from "@/server/repositories/fluxocasa.repository";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { UserFacingError } from "@/server/http/errors";

/**
 * Registra um novo usuário no sistema.
 * @param input Dados do usuário (nome, email, senha pura).
 * @throws Error se o e-mail já estiver em uso.
 * @returns O usuário criado.
 */
export async function registerUser(input: { nome: string; email: string; senha: string }) {
  const existing = await fluxoCasaRepository.findUserByEmail(input.email);

  if (existing) {
    throw new UserFacingError("Ja existe um usuario com este e-mail.");
  }

  const senhaHash = await hashPassword(input.senha);

  return fluxoCasaRepository.createUser({
    nome: input.nome,
    email: input.email,
    senhaHash
  });
}

/**
 * Autentica um usuário via e-mail e senha.
 * @param input Credenciais de login.
 * @throws Error se as credenciais forem inválidas.
 * @returns ID do usuário e ID da casa (se houver).
 */
export async function loginUser(input: { email: string; senha: string }) {
  const user = await fluxoCasaRepository.findUserByEmail(input.email);

  if (!user) {
    throw new UserFacingError("Credenciais invalidas.", 401);
  }

  const passwordMatches = await verifyPassword(input.senha, user.senhaHash);

  if (!passwordMatches) {
    throw new UserFacingError("Credenciais invalidas.", 401);
  }

  return {
    id: user.id,
    casaId: user.casaId
  };
}

/**
 * Sincroniza um usuário autenticado via provedor externo (ex: Supabase/Google).
 * @param input Dados da identidade externa.
 * @returns O usuário sincronizado no banco local.
 */
export async function syncAuthenticatedUser(input: {
  authUserId: string;
  email: string;
  nome: string;
}) {
  return fluxoCasaRepository.syncUserIdentity(input);
}

/**
 * Busca um usuário pelo ID externo do provedor de auth.
 * @param authUserId ID do provedor (Supabase).
 * @returns Morador encontrado ou null.
 */
export async function findAuthenticatedUser(authUserId: string) {
  return fluxoCasaRepository.findUserByAuthUserId(authUserId);
}
