import { fluxoCasaRepository } from "@/server/repositories/fluxocasa.repository";

/**
 * Retorna a lista de moradores da casa e seus metadados (role, status).
 * @param userId Morador que solicita a lista.
 */
export async function getResidentsSnapshot(userId: string) {
  return fluxoCasaRepository.getResidentsSnapshot(userId);
}

/**
 * Transfere a responsabilidade de administrador da casa para outro morador.
 * @param userId Administrador atual.
 * @param residentId Novo administrador.
 * @throws Error se o autor não for o admin atual.
 */
export async function transferHouseAdmin(userId: string, residentId: string) {
  return fluxoCasaRepository.transferHouseAdmin(userId, residentId);
}

/**
 * Remove um morador da casa (expulsão ou saída voluntária).
 * @param userId Autor da ação (pode ser o próprio morador ou o admin).
 * @param residentId Morador a ser removido.
 */
export async function removeHouseResident(userId: string, residentId: string) {
  return fluxoCasaRepository.removeHouseResident(userId, residentId);
}
