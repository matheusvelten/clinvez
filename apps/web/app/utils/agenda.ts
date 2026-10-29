import type { Agendamento } from '~/types'

export const HORA_INICIO_GRADE = 7
export const HORA_FIM_GRADE = 19
export const PX_POR_HORA = 72

export interface BlocoAgenda {
  agendamento: Agendamento
  topo: number
  altura: number
  coluna: number
  totalColunas: number
}

function minutosDoDia(data: Date) {
  return data.getHours() * 60 + data.getMinutes()
}

export function posicionar(agendamentos: Agendamento[]): BlocoAgenda[] {
  const ordenados = [...agendamentos].sort((a, b) => +new Date(a.inicio) - +new Date(b.inicio) || +new Date(b.fim) - +new Date(a.fim))
  const blocos: BlocoAgenda[] = []
  let grupo: BlocoAgenda[] = []
  let fimGrupo = 0
  let colunasFim: number[] = []

  const fecharGrupo = () => {
    const total = colunasFim.length
    for (const b of grupo) b.totalColunas = total
    grupo = []
    colunasFim = []
  }

  for (const agendamento of ordenados) {
    const inicio = +new Date(agendamento.inicio)
    const fim = +new Date(agendamento.fim)
    if (grupo.length && inicio >= fimGrupo) fecharGrupo()

    let coluna = colunasFim.findIndex(f => f <= inicio)
    if (coluna === -1) {
      coluna = colunasFim.length
      colunasFim.push(fim)
    } else {
      colunasFim[coluna] = fim
    }

    const minutosInicio = minutosDoDia(new Date(inicio)) - HORA_INICIO_GRADE * 60
    const duracao = (fim - inicio) / 60000
    const bloco: BlocoAgenda = {
      agendamento,
      topo: (minutosInicio / 60) * PX_POR_HORA,
      altura: Math.max((duracao / 60) * PX_POR_HORA - 2, 18),
      coluna,
      totalColunas: 1,
    }
    grupo.push(bloco)
    blocos.push(bloco)
    fimGrupo = Math.max(fimGrupo, fim)
  }
  fecharGrupo()
  return blocos
}

export function minutoClicado(evento: MouseEvent) {
  const alvo = evento.currentTarget as HTMLElement
  const y = evento.clientY - alvo.getBoundingClientRect().top
  const minutos = HORA_INICIO_GRADE * 60 + (y / PX_POR_HORA) * 60
  return Math.floor(minutos / 15) * 15
}

export function mesmoDia(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
