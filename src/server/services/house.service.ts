import { fluxoCasaRepository } from "@/server/repositories/fluxocasa.repository";

/**
 * Cria uma nova casa e define o usuário como administrador.
 * @param userId ID do morador criador.
 * @param nome Nome da casa.
 */
export async function createHouseForUser(userId: string, nome: string) {
  return fluxoCasaRepository.createHouseForUser(userId, { nome });
}

/**
 * Vincula um usuário a uma casa existente via código de convite.
 * @param userId ID do morador.
 * @param codigoConvite Código alfanumérico da casa destino.
 */
export async function joinHouseByInviteCode(userId: string, codigoConvite: string) {
  return fluxoCasaRepository.joinHouseByInviteCode(userId, { codigoConvite });
}

/**
 * Remove o morador da casa atual.
 * Administradores com outros moradores devem transferir a administracao antes.
 * Se o administrador estiver sozinho, a casa e encerrada.
 */
export async function leaveCurrentHouse(userId: string) {
  return fluxoCasaRepository.leaveCurrentHouse(userId);
}

/**
 * Gera um novo código de convite aleatório para a casa.
 * @param userId ID do administrador que está rotacionando.
 * @throws Error se o usuário não for administrador.
 */
export async function rotateInviteCode(userId: string) {
  return fluxoCasaRepository.rotateInviteCode(userId);
}

/**
 * Retorna uma visão geral da casa (contas, moradores, resumo) para o dashboard.
 * @param userId ID do morador autenticado.
 */
export async function getHouseSnapshot(userId: string) {
  return fluxoCasaRepository.getHouseSnapshot(userId);
}

/**
 * Lista todas as contas (bills) ativas da casa.
 */
export async function getHouseBills(userId: string) {
  return fluxoCasaRepository.getHouseBills(userId);
}

/**
 * Lista as contribuições financeiras declaradas pelos moradores no mês.
 */
export async function getHouseContributions(userId: string) {
  return fluxoCasaRepository.getHouseContributions(userId);
}

/**
 * Cria ou atualiza uma contribuição do morador para as despesas da casa.
 * @param userId Morador que está contribuindo.
 * @param input Valores em centavos e período (mês/ano).
 */
export async function upsertContribution(
  userId: string,
  input: { valorCentavos: number; mes: number; ano: number }
) {
  return fluxoCasaRepository.upsertContribution(userId, input);
}

/**
 * Remove uma declaração de contribuição.
 */
export async function deleteContribution(userId: string, contributionId: string) {
  return fluxoCasaRepository.deleteContribution(userId, contributionId);
}

/**
 * Registra uma nova conta a pagar da casa (compartilhada).
 */
export async function createHouseBill(
  userId: string,
  input: {
    titulo: string;
    categoria: string;
    valorCentavos: number;
    vencimento: Date;
    observacao?: string;
    frequencia: "UNICA" | "MENSAL" | "PARCELADA" | "FIXA";
    parcelasTotais?: number;
  }
) {
  return fluxoCasaRepository.createHouseBill(userId, input);
}

/**
 * Atualiza dados de uma conta da casa existente.
 */
export async function updateHouseBill(
  userId: string,
  billId: string,
  input: {
    titulo: string;
    categoria: string;
    valorCentavos: number;
    vencimento: Date;
    observacao?: string;
    status?: string;
    frequencia: "UNICA" | "MENSAL" | "PARCELADA" | "FIXA";
    parcelasTotais?: number;
  }
) {
  return fluxoCasaRepository.updateHouseBill(userId, billId, input);
}

/**
 * Remove permanentemente uma conta da casa.
 */
export async function deleteHouseBill(userId: string, billId: string) {
  return fluxoCasaRepository.deleteHouseBill(userId, billId);
}

/**
 * Atalho para marcar uma conta como 'PAGA' rapidamente.
 */
export async function markHouseBillAsPaid(userId: string, billId: string) {
  return fluxoCasaRepository.markHouseBillAsPaid(userId, billId);
}
