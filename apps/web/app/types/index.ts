export type Perfil = 'ADMIN' | 'ATENDENTE'

export type StatusAgendamento = 'AGENDADO' | 'CONFIRMADO' | 'CONCLUIDO' | 'CANCELADO' | 'FALTOU'

export interface Usuario {
  id: string
  nome: string
  email: string
  perfil: Perfil
  ativo?: boolean
  criadoEm?: string
}

export interface Cliente {
  id: string
  nome: string
  telefone: string
  email: string | null
  dataNascimento: string | null
  observacoes: string | null
  criadoEm: string
  totalAgendamentos?: number
}

export interface ServicoResumo {
  id: string
  nome: string
  duracaoMinutos: number
  preco: number
  ativo: boolean
}

export interface Servico extends ServicoResumo {
  criadoEm: string
  totalProfissionais: number
  totalAgendamentos: number
}

export interface Profissional {
  id: string
  nome: string
  especialidade: string
  cor: string
  ativo: boolean
  servicos: ServicoResumo[]
}

export interface Agendamento {
  id: string
  inicio: string
  fim: string
  status: StatusAgendamento
  observacoes: string | null
  valor: number
  clienteId: string
  profissionalId: string
  servicoId: string
  cliente: { id: string, nome: string, telefone: string }
  profissional: { id: string, nome: string, cor: string, especialidade: string }
  servico: { id: string, nome: string, duracaoMinutos: number }
}

export interface SugestaoAgendamento {
  clienteId?: string
  profissionalId?: string
  data?: Date
  inicio?: Date
}

export interface Paginado<T> {
  itens: T[]
  total: number
  pagina: number
  porPagina: number
  totalPaginas: number
}

export interface ResumoDashboard {
  totais: {
    agendamentos: number
    AGENDADO: number
    CONFIRMADO: number
    CONCLUIDO: number
    CANCELADO: number
    FALTOU: number
    faturamento: number
    ticketMedio: number
    taxaComparecimento: number
    clientes: number
  }
  porDia: { data: string, atendimentos: number, faturamento: number }[]
  porServico: { nome: string, quantidade: number, faturamento: number }[]
  porProfissional: { nome: string, cor: string, quantidade: number, faturamento: number }[]
  proximos: (Omit<Agendamento, 'cliente' | 'profissional' | 'servico'> & {
    cliente: { nome: string, telefone: string }
    profissional: { nome: string, cor: string }
    servico: { nome: string }
  })[]
}
