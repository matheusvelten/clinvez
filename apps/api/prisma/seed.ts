import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import { PrismaClient, type Servico, StatusAgendamento } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

let semente = 42;
function aleatorio() {
  semente = (semente * 1664525 + 1013904223) % 4294967296;
  return semente / 4294967296;
}
function escolher<T>(lista: T[]): T {
  return lista[Math.floor(aleatorio() * lista.length)];
}

const nomes = [
  'Ana', 'Bruno', 'Carla', 'Daniel', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'João',
  'Larissa', 'Lucas', 'Mariana', 'Mateus', 'Natália', 'Otávio', 'Paula', 'Rafael', 'Sabrina', 'Thiago',
  'Vanessa', 'Vinícius', 'Yasmin', 'Leonardo', 'Camila', 'Diego', 'Fernanda', 'Gustavo', 'Helena', 'Igor',
];
const sobrenomes = [
  'Almeida', 'Barbosa', 'Cardoso', 'Duarte', 'Esteves', 'Ferreira', 'Gomes', 'Lima', 'Martins', 'Nunes',
  'Oliveira', 'Pereira', 'Queiroz', 'Ribeiro', 'Santos', 'Teixeira', 'Vieira', 'Moreira', 'Rocha', 'Souza',
];

function telefone() {
  const n = () => Math.floor(aleatorio() * 10);
  return `(27) 9${n()}${n()}${n()}${n()}-${n()}${n()}${n()}${n()}`;
}

function semAcento(texto: string) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

async function main() {
  await prisma.agendamento.deleteMany();
  await prisma.servico.deleteMany();
  await prisma.profissional.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.usuario.deleteMany();

  await prisma.usuario.createMany({
    data: [
      { nome: 'Administrador', email: 'admin@agendei.dev', senhaHash: await bcrypt.hash('admin123', 10), perfil: 'ADMIN' },
      { nome: 'Recepção', email: 'recepcao@agendei.dev', senhaHash: await bcrypt.hash('recepcao123', 10), perfil: 'ATENDENTE' },
    ],
  });

  const servicosBase = [
    { nome: 'Consulta clínica', duracaoMinutos: 30, preco: 180 },
    { nome: 'Retorno', duracaoMinutos: 20, preco: 0 },
    { nome: 'Sessão de fisioterapia', duracaoMinutos: 50, preco: 140 },
    { nome: 'Avaliação fisioterapêutica', duracaoMinutos: 60, preco: 200 },
    { nome: 'Consulta nutricional', duracaoMinutos: 45, preco: 220 },
    { nome: 'Bioimpedância', duracaoMinutos: 20, preco: 90 },
    { nome: 'Sessão de psicoterapia', duracaoMinutos: 50, preco: 200 },
    { nome: 'Limpeza de pele', duracaoMinutos: 60, preco: 160 },
  ];
  const servicos: Servico[] = [];
  for (const s of servicosBase) {
    servicos.push(await prisma.servico.create({ data: s }));
  }
  const servico = (nome: string) => servicos.find((s) => s.nome === nome)!;

  const profissionaisBase = [
    { nome: 'Dra. Beatriz Andrade', especialidade: 'Clínica geral', cor: '#6366f1', servicos: ['Consulta clínica', 'Retorno'] },
    { nome: 'Dr. Ricardo Menezes', especialidade: 'Fisioterapia', cor: '#10b981', servicos: ['Sessão de fisioterapia', 'Avaliação fisioterapêutica'] },
    { nome: 'Juliana Prado', especialidade: 'Nutrição', cor: '#f59e0b', servicos: ['Consulta nutricional', 'Bioimpedância', 'Retorno'] },
    { nome: 'Marcos Tavares', especialidade: 'Psicologia', cor: '#ec4899', servicos: ['Sessão de psicoterapia'] },
    { nome: 'Patrícia Coelho', especialidade: 'Estética', cor: '#0ea5e9', servicos: ['Limpeza de pele'] },
  ];
  const profissionais = [];
  for (const p of profissionaisBase) {
    profissionais.push(
      await prisma.profissional.create({
        data: {
          nome: p.nome,
          especialidade: p.especialidade,
          cor: p.cor,
          servicos: { connect: p.servicos.map((n) => ({ id: servico(n).id })) },
        },
        include: { servicos: true },
      }),
    );
  }

  const clientes = [];
  const usados = new Set<string>();
  while (clientes.length < 45) {
    const nome = `${escolher(nomes)} ${escolher(sobrenomes)}`;
    if (usados.has(nome)) continue;
    usados.add(nome);
    const [primeiro, ultimo] = semAcento(nome).split(' ');
    const ano = 1960 + Math.floor(aleatorio() * 45);
    const mes = Math.floor(aleatorio() * 12);
    const dia = 1 + Math.floor(aleatorio() * 28);
    clientes.push(
      await prisma.cliente.create({
        data: {
          nome,
          telefone: telefone(),
          email: aleatorio() > 0.2 ? `${primeiro}.${ultimo}@exemplo.com` : null,
          dataNascimento: new Date(Date.UTC(ano, mes, dia)),
          criadoEm: new Date(Date.now() - (60 + Math.floor(aleatorio() * 700)) * 86_400_000),
        },
      }),
    );
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const agendamentos = [];

  for (let deslocamento = -45; deslocamento <= 21; deslocamento++) {
    const dia = new Date(hoje);
    dia.setDate(hoje.getDate() + deslocamento);
    if (dia.getDay() === 0) continue;
    const fimExpediente = dia.getDay() === 6 ? 12 * 60 : 18 * 60;

    for (const profissional of profissionais) {
      let minuto = 8 * 60;
      while (minuto < fimExpediente) {
        const s = escolher(profissional.servicos);
        if (minuto + s.duracaoMinutos > fimExpediente) break;
        if (minuto >= 12 * 60 && minuto < 13 * 60) {
          minuto = 13 * 60;
          continue;
        }
        const ocupacao = deslocamento < 0 ? 0.7 : deslocamento === 0 ? 0.75 : 0.55 - deslocamento * 0.02;
        if (aleatorio() < ocupacao) {
          const inicio = new Date(dia);
          inicio.setMinutes(minuto);
          const fim = new Date(inicio.getTime() + s.duracaoMinutos * 60000);
          let status: StatusAgendamento = 'AGENDADO';
          const sorte = aleatorio();
          if (fim < new Date()) {
            status = sorte < 0.82 ? 'CONCLUIDO' : sorte < 0.92 ? 'CANCELADO' : 'FALTOU';
          } else if (sorte < 0.45) {
            status = 'CONFIRMADO';
          } else if (sorte < 0.5) {
            status = 'CANCELADO';
          }
          agendamentos.push({
            inicio,
            fim,
            status,
            valor: s.preco,
            clienteId: escolher(clientes).id,
            profissionalId: profissional.id,
            servicoId: s.id,
          });
          minuto += s.duracaoMinutos + (aleatorio() < 0.5 ? 10 : 0);
        } else {
          minuto += 30;
        }
      }
    }
  }

  await prisma.agendamento.createMany({ data: agendamentos });

  console.log(`Seed concluído: ${clientes.length} clientes, ${profissionais.length} profissionais, ${servicos.length} serviços, ${agendamentos.length} agendamentos.`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
  