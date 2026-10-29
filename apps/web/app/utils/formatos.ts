import type { StatusAgendamento } from '~/types'

const moedaFormato = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function moeda(valor: number) {
  return moedaFormato.format(valor)
}

export function porcentagem(valor: number) {
  return `${Math.round(valor * 100)}%`
}

export function hora(data: string | Date) {
  return new Date(data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function dataCurta(data: string | Date) {
  return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function dataExtenso(data: string | Date) {
  return new Date(data).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function dataUtc(data: string) {
  return new Date(data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

export function iniciais(nome: string) {
  const partes = nome.replace(/^(Dra?\.)\s+/i, '').split(' ').filter(Boolean)
  return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes[partes.length - 1]![0] : '')).toUpperCase()
}

export function apenasDigitos(texto: string) {
  return texto.replace(/\D/g, '')
}

export function linkWhatsApp(telefone: string, mensagem?: string) {
  const numero = `55${apenasDigitos(telefone)}`
  return `https://wa.me/${numero}${mensagem ? `?text=${encodeURIComponent(mensagem)}` : ''}`
}

export function mascaraTelefone(valor: string) {
  const d = apenasDigitos(valor).slice(0, 11)
  if (d.length <= 2) return d ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function inicioDoDia(data: Date) {
  const d = new Date(data)
  d.setHours(0, 0, 0, 0)
  return d
}

export function somarDias(data: Date, dias: number) {
  const d = new Date(data)
  d.setDate(d.getDate() + dias)
  return d
}

export function inicioDaSemana(data: Date) {
  const d = inicioDoDia(data)
  const dia = d.getDay()
  return somarDias(d, dia === 0 ? -6 : 1 - dia)
}

export function paraInputData(data: Date) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function deInputData(valor: string) {
  const [ano, mes, dia] = valor.split('-').map(Number)
  return new Date(ano!, mes! - 1, dia!)
}

export const statusInfo: Record<StatusAgendamento, { rotulo: string, cor: 'neutral' | 'info' | 'success' | 'error' | 'warning', icone: string }> = {
  AGENDADO: { rotulo: 'Agendado', cor: 'neutral', icone: 'i-lucide-calendar-clock' },
  CONFIRMADO: { rotulo: 'Confirmado', cor: 'info', icone: 'i-lucide-calendar-check' },
  CONCLUIDO: { rotulo: 'Concluído', cor: 'success', icone: 'i-lucide-circle-check-big' },
  CANCELADO: { rotulo: 'Cancelado', cor: 'error', icone: 'i-lucide-calendar-x' },
  FALTOU: { rotulo: 'Faltou', cor: 'warning', icone: 'i-lucide-user-x' },
}

export const coresProfissional = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#0ea5e9', '#8b5cf6', '#ef4444', '#14b8a6', '#84cc16', '#f97316']
