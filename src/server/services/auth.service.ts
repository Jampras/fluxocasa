import { fluxoCasaRepository } from "@/server/repositories/fluxocasa.repository";

export async function syncAuthenticatedUser(input: {
  authUserId: string;
  email: string;
  nome: string;
  emailVerified: boolean;
}) {
  return fluxoCasaRepository.syncUserIdentity(input);
}

export async function findAuthenticatedUser(authUserId: string) {
  return fluxoCasaRepository.findUserByAuthUserId(authUserId);
}
