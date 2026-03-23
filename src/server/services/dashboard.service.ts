import { fluxoCasaRepository } from "@/server/repositories/fluxocasa.repository";

/**
 * Retorna o snapshot unificado para a tela principal (Visão Geral).
 * Inclui dados condensados de Pessoal e Casa.
 */
export async function getDashboardSnapshot(userId: string) {
  return fluxoCasaRepository.getDashboardSnapshot(userId);
}

/**
 * Retorna o feed de atividades recentes da casa (Auditoria).
 */
export async function getRecentActivity(userId: string) {
  return fluxoCasaRepository.getRecentActivity(userId);
}
