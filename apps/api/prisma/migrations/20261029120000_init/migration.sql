CREATE TYPE "Perfil" AS ENUM ('ADMIN', 'ATENDENTE');

CREATE TYPE "StatusAgendamento" AS ENUM ('AGENDADO', 'CONFIRMADO', 'CONCLUIDO', 'CANCELADO', 'FALTOU');

CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "perfil" "Perfil" NOT NULL DEFAULT 'ATENDENTE',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT,
    "data_nascimento" DATE,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "profissionais" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "especialidade" TEXT NOT NULL,
    "cor" TEXT NOT NULL DEFAULT '#6366f1',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profissionais_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "servicos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "duracao_minutos" INTEGER NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "servicos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agendamentos" (
    "id" TEXT NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3) NOT NULL,
    "status" "StatusAgendamento" NOT NULL DEFAULT 'AGENDADO',
    "observacoes" TEXT,
    "valor" DECIMAL(10,2) NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "profissional_id" TEXT NOT NULL,
    "servico_id" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agendamentos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "_ProfissionalServicos" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProfissionalServicos_AB_pkey" PRIMARY KEY ("A","B")
);

CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

CREATE INDEX "clientes_nome_idx" ON "clientes"("nome");

CREATE INDEX "agendamentos_profissional_id_inicio_idx" ON "agendamentos"("profissional_id", "inicio");

CREATE INDEX "agendamentos_inicio_idx" ON "agendamentos"("inicio");

CREATE INDEX "_ProfissionalServicos_B_index" ON "_ProfissionalServicos"("B");

ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissionais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_servico_id_fkey" FOREIGN KEY ("servico_id") REFERENCES "servicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "_ProfissionalServicos" ADD CONSTRAINT "_ProfissionalServicos_A_fkey" FOREIGN KEY ("A") REFERENCES "profissionais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_ProfissionalServicos" ADD CONSTRAINT "_ProfissionalServicos_B_fkey" FOREIGN KEY ("B") REFERENCES "servicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
