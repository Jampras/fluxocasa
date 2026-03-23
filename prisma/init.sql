CREATE TABLE IF NOT EXISTS "Casa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "codigoConvite" TEXT NOT NULL,
    "saldoAcumuladoCentavos" INTEGER NOT NULL DEFAULT 0,
    "criadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadaEm" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "Morador" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authUserId" TEXT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" TEXT NOT NULL DEFAULT 'MEMBRO',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    "casaId" TEXT,
    CONSTRAINT "Morador_casaId_fkey" FOREIGN KEY ("casaId") REFERENCES "Casa" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Contribuicao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "valorCentavos" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMADO',
    "criadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editadaEm" DATETIME NOT NULL,
    "moradorId" TEXT NOT NULL,
    "casaId" TEXT NOT NULL,
    CONSTRAINT "Contribuicao_moradorId_fkey" FOREIGN KEY ("moradorId") REFERENCES "Morador" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Contribuicao_casaId_fkey" FOREIGN KEY ("casaId") REFERENCES "Casa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ContaCasa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "vencimento" DATETIME NOT NULL,
    "pagaEm" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "observacao" TEXT,
    "casaId" TEXT NOT NULL,
    "criadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadaEm" DATETIME NOT NULL,
    CONSTRAINT "ContaCasa_casaId_fkey" FOREIGN KEY ("casaId") REFERENCES "Casa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Renda" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "recebidaEm" DATETIME NOT NULL,
    "moradorId" TEXT NOT NULL,
    CONSTRAINT "Renda_moradorId_fkey" FOREIGN KEY ("moradorId") REFERENCES "Morador" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ContaPessoal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "vencimento" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "observacao" TEXT,
    "moradorId" TEXT NOT NULL,
    CONSTRAINT "ContaPessoal_moradorId_fkey" FOREIGN KEY ("moradorId") REFERENCES "Morador" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "GastoPessoal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "gastoEm" DATETIME NOT NULL,
    "moradorId" TEXT NOT NULL,
    CONSTRAINT "GastoPessoal_moradorId_fkey" FOREIGN KEY ("moradorId") REFERENCES "Morador" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "MetaOrcamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoria" TEXT NOT NULL,
    "valorMetaCentavos" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "moradorId" TEXT NOT NULL,
    CONSTRAINT "MetaOrcamento_moradorId_fkey" FOREIGN KEY ("moradorId") REFERENCES "Morador" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "CicloMensal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mes" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "saldoInicialCentavos" INTEGER NOT NULL,
    "saldoFinalCentavos" INTEGER NOT NULL,
    "casaId" TEXT NOT NULL,
    CONSTRAINT "CicloMensal_casaId_fkey" FOREIGN KEY ("casaId") REFERENCES "Casa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AuditoriaCasa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "casaId" TEXT NOT NULL,
    "atorMoradorId" TEXT,
    "alvoMoradorId" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditoriaCasa_casaId_fkey" FOREIGN KEY ("casaId") REFERENCES "Casa" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AuditoriaCasa_atorMoradorId_fkey" FOREIGN KEY ("atorMoradorId") REFERENCES "Morador" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditoriaCasa_alvoMoradorId_fkey" FOREIGN KEY ("alvoMoradorId") REFERENCES "Morador" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Casa_codigoConvite_key" ON "Casa"("codigoConvite");
CREATE UNIQUE INDEX IF NOT EXISTS "Morador_authUserId_key" ON "Morador"("authUserId");
CREATE UNIQUE INDEX IF NOT EXISTS "Morador_email_key" ON "Morador"("email");
CREATE INDEX IF NOT EXISTS "Morador_casaId_idx" ON "Morador"("casaId");
CREATE INDEX IF NOT EXISTS "Contribuicao_casaId_mes_ano_idx" ON "Contribuicao"("casaId", "mes", "ano");
CREATE UNIQUE INDEX IF NOT EXISTS "Contribuicao_moradorId_casaId_mes_ano_key" ON "Contribuicao"("moradorId", "casaId", "mes", "ano");
CREATE INDEX IF NOT EXISTS "ContaCasa_casaId_status_vencimento_idx" ON "ContaCasa"("casaId", "status", "vencimento");
CREATE INDEX IF NOT EXISTS "Renda_moradorId_recebidaEm_idx" ON "Renda"("moradorId", "recebidaEm");
CREATE INDEX IF NOT EXISTS "ContaPessoal_moradorId_status_vencimento_idx" ON "ContaPessoal"("moradorId", "status", "vencimento");
CREATE INDEX IF NOT EXISTS "GastoPessoal_moradorId_categoria_gastoEm_idx" ON "GastoPessoal"("moradorId", "categoria", "gastoEm");
CREATE UNIQUE INDEX IF NOT EXISTS "MetaOrcamento_moradorId_categoria_mes_ano_key" ON "MetaOrcamento"("moradorId", "categoria", "mes", "ano");
CREATE UNIQUE INDEX IF NOT EXISTS "CicloMensal_casaId_mes_ano_key" ON "CicloMensal"("casaId", "mes", "ano");
CREATE INDEX IF NOT EXISTS "AuditoriaCasa_casaId_criadoEm_idx" ON "AuditoriaCasa"("casaId", "criadoEm");
CREATE INDEX IF NOT EXISTS "AuditoriaCasa_atorMoradorId_idx" ON "AuditoriaCasa"("atorMoradorId");
CREATE INDEX IF NOT EXISTS "AuditoriaCasa_alvoMoradorId_idx" ON "AuditoriaCasa"("alvoMoradorId");
