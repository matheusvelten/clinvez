<script setup lang="ts">
import type { Agendamento, Profissional, SugestaoAgendamento } from '~/types'

useHead({ title: 'Agenda · Agendei' })

const api = useApi()
const notificacao = useNotificacao()

const visao = ref<'dia' | 'semana'>('dia')
const referencia = ref(inicioDoDia(new Date()))
const filtroProfissional = ref<string>('todos')
const mostrarCancelados = ref(false)

const profissionais = ref<Profissional[]>([])
const agendamentos = ref<Agendamento[]>([])
const carregando = ref(false)
const agora = ref(new Date())

const modalAberto = ref(false)
const emEdicao = ref<Agendamento | null>(null)
const sugestao = ref<SugestaoAgendamento | null>(null)
const detalheAberto = ref(false)
const selecionado = ref<Agendamento | null>(null)

const horas = Array.from({ length: HORA_FIM_GRADE - HORA_INICIO_GRADE }, (_, i) => HORA_INICIO_GRADE + i)
const alturaGrade = (HORA_FIM_GRADE - HORA_INICIO_GRADE) * PX_POR_HORA

const periodo = computed(() => {
  if (visao.value === 'dia') return { inicio: referencia.value, fim: somarDias(referencia.value, 1) }
  const inicio = inicioDaSemana(referencia.value)
  return { inicio, fim: somarDias(inicio, 6) }
})

const diasSemana = computed(() => Array.from({ length: 6 }, (_, i) => somarDias(periodo.value.inicio, i)))

const titulo = computed(() => {
  if (visao.value === 'dia') {
    const texto = dataExtenso(referencia.value)
    return texto.charAt(0).toUpperCase() + texto.slice(1)
  }
  const ini = periodo.value.inicio
  const fim = somarDias(ini, 5)
  const mesmoMes = ini.getMonth() === fim.getMonth()
  const formato: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  return `${ini.toLocaleDateString('pt-BR', mesmoMes ? { day: 'numeric' } : formato)} – ${fim.toLocaleDateString('pt-BR', { ...formato, year: 'numeric' })}`
})

const itensProfissionais = computed(() => [
  ...(visao.value === 'dia' ? [{ label: 'Todos os profissionais', value: 'todos' }] : []),
  ...profissionais.value.map(p => ({ label: p.nome, value: p.id })),
])

watch([visao, profissionais], () => {
  if (visao.value === 'semana' && filtroProfissional.value === 'todos' && profissionais.value[0]) {
    filtroProfissional.value = profissionais.value[0].id
  }
})

const profissionaisVisiveis = computed(() =>
  filtroProfissional.value === 'todos'
    ? profissionais.value
    : profissionais.value.filter(p => p.id === filtroProfissional.value),
)

const visiveis = computed(() =>
  agendamentos.value.filter(a =>
    (mostrarCancelados.value || a.status !== 'CANCELADO')
    && (filtroProfissional.value === 'todos' || a.profissionalId === filtroProfissional.value),
  ),
)

const blocosPorProfissional = computed(() => {
  const mapa = new Map<string, BlocoAgenda[]>()
  for (const p of profissionaisVisiveis.value) {
    mapa.set(p.id, posicionar(visiveis.value.filter(a => a.profissionalId === p.id)))
  }
  return mapa
})

const blocosPorDia = computed(() =>
  diasSemana.value.map(dia => posicionar(visiveis.value.filter(a => mesmoDia(new Date(a.inicio), dia)))),
)

const resumoDia = computed(() => {
  const ativos = visiveis.value.filter(a => a.status !== 'CANCELADO')
  return {
    total: ativos.length,
    confirmados: ativos.filter(a => a.status === 'CONFIRMADO').length,
    previsto: ativos.reduce((soma, a) => soma + (a.status === 'FALTOU' ? 0 : a.valor), 0),
  }
})

const posicaoAgora = computed(() => {
  const minutos = agora.value.getHours() * 60 + agora.value.getMinutes() - HORA_INICIO_GRADE * 60
  if (minutos < 0 || minutos > (HORA_FIM_GRADE - HORA_INICIO_GRADE) * 60) return null
  return (minutos / 60) * PX_POR_HORA
})

async function carregar() {
  carregando.value = true
  try {
    agendamentos.value = await api<Agendamento[]>('/agendamentos', {
      query: { inicio: periodo.value.inicio.toISOString(), fim: periodo.value.fim.toISOString() },
    })
  } catch (erro) {
    notificacao.erro(erro)
  } finally {
    carregando.value = false
  }
}

function navegar(direcao: number) {
  referencia.value = somarDias(referencia.value, direcao * (visao.value === 'dia' ? 1 : 7))
}

function irParaHoje() {
  referencia.value = inicioDoDia(new Date())
}

const dataInput = computed({
  get: () => paraInputData(referencia.value),
  set: (valor: string) => {
    if (valor) referencia.value = deInputData(valor)
  },
})

function abrirNovo(dados?: SugestaoAgendamento) {
  emEdicao.value = null
  sugestao.value = dados ?? { data: referencia.value, profissionalId: filtroProfissional.value !== 'todos' ? filtroProfissional.value : undefined }
  modalAberto.value = true
}

function cliqueNaGrade(evento: MouseEvent, dia: Date, profissionalId?: string) {
  const minutos = minutoClicado(evento)
  const inicio = new Date(dia)
  inicio.setHours(0, minutos, 0, 0)
  abrirNovo({
    data: dia,
    inicio,
    profissionalId: profissionalId ?? (filtroProfissional.value !== 'todos' ? filtroProfissional.value : undefined),
  })
}

function abrirDetalhe(agendamento: Agendamento) {
  selecionado.value = agendamento
  detalheAberto.value = true
}

function editar(agendamento: Agendamento) {
  detalheAberto.value = false
  emEdicao.value = agendamento
  sugestao.value = null
  modalAberto.value = true
}

function aoSalvar(agendamento: Agendamento) {
  referencia.value = inicioDoDia(new Date(agendamento.inicio))
  carregar()
}

function aoAtualizar(agendamento: Agendamento) {
  selecionado.value = agendamento
  const indice = agendamentos.value.findIndex(a => a.id === agendamento.id)
  if (indice >= 0) agendamentos.value[indice] = agendamento
}

function estiloBloco(bloco: BlocoAgenda, cor: string) {
  const largura = 100 / bloco.totalColunas
  return {
    top: `${bloco.topo}px`,
    height: `${bloco.altura}px`,
    left: `calc(${bloco.coluna * largura}% + 2px)`,
    width: `calc(${largura}% - 4px)`,
    '--cor': cor,
  }
}

let relogio: ReturnType<typeof setInterval> | undefined

onMounted(async () => {
  relogio = setInterval(() => (agora.value = new Date()), 60_000)
  try {
    profissionais.value = await api<Profissional[]>('/profissionais', { query: { ativos: true } })
  } catch (erro) {
    notificacao.erro(erro)
  }
})

onBeforeUnmount(() => clearInterval(relogio))

watch(periodo, carregar, { immediate: true })

defineShortcuts({
  arrowleft: () => navegar(-1),
  arrowright: () => navegar(1),
  t: irParaHoje,
  n: () => abrirNovo(),
})
</script>

<template>
  <UDashboardPanel id="agenda" :ui="{ body: 'p-0 sm:p-0 gap-0' }">
    <template #header>
      <UDashboardNavbar title="Agenda">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton icon="i-lucide-plus" label="Novo agendamento" @click="abrirNovo()" />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <div class="flex flex-wrap items-center gap-2">
            <UButton label="Hoje" color="neutral" variant="outline" @click="irParaHoje" />
            <div class="flex">
              <UButton icon="i-lucide-chevron-left" color="neutral" variant="ghost" aria-label="Anterior" @click="navegar(-1)" />
              <UButton icon="i-lucide-chevron-right" color="neutral" variant="ghost" aria-label="Próximo" @click="navegar(1)" />
            </div>
            <h2 class="text-base font-semibold sm:text-lg">{{ titulo }}</h2>
            <UIcon v-if="carregando" name="i-lucide-loader-circle" class="size-4 animate-spin text-muted" />
          </div>
        </template>
        <template #right>
          <div class="flex flex-wrap items-center gap-2">
            <UInput v-model="dataInput" type="date" size="sm" class="w-36" />
            <USelect v-model="filtroProfissional" :items="itensProfissionais" size="sm" class="w-52" />
            <UTabs
              v-model="visao"
              :items="[{ label: 'Dia', value: 'dia' }, { label: 'Semana', value: 'semana' }]"
              :content="false"
              size="xs"
              class="w-36"
            />
            <USwitch v-model="mostrarCancelados" label="Cancelados" size="sm" />
          </div>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="flex flex-wrap gap-x-6 gap-y-1 border-b border-default px-4 py-2 text-sm text-muted sm:px-6">
        <span><strong class="text-highlighted tabular-nums">{{ resumoDia.total }}</strong> atendimentos</span>
        <span><strong class="text-highlighted tabular-nums">{{ resumoDia.confirmados }}</strong> confirmados</span>
        <span>Previsto: <strong class="text-highlighted tabular-nums">{{ moeda(resumoDia.previsto) }}</strong></span>
      </div>

      <div class="flex-1 overflow-auto">
        <div class="min-w-max">
          <div class="sticky top-0 z-20 flex border-b border-default bg-default">
            <div class="w-16 shrink-0" />
            <template v-if="visao === 'dia'">
              <div
                v-for="p in profissionaisVisiveis"
                :key="p.id"
                class="flex min-w-56 flex-1 items-center gap-2 border-l border-default px-3 py-2.5"
              >
                <span class="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" :style="{ backgroundColor: p.cor }">
                  {{ iniciais(p.nome) }}
                </span>
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium">{{ p.nome }}</p>
                  <p class="truncate text-xs text-muted">{{ p.especialidade }}</p>
                </div>
              </div>
            </template>
            <template v-else>
              <button
                v-for="dia in diasSemana"
                :key="dia.toISOString()"
                type="button"
                class="min-w-40 flex-1 border-l border-default px-3 py-2 text-left hover:bg-elevated/50"
                @click="referencia = dia; visao = 'dia'"
              >
                <p class="text-xs uppercase text-muted">{{ dia.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '') }}</p>
                <p
                  class="text-lg font-semibold"
                  :class="mesmoDia(dia, agora) ? 'text-primary' : ''"
                >
                  {{ dia.getDate() }}
                </p>
              </button>
            </template>
          </div>

          <div class="flex">
            <div class="relative w-16 shrink-0" :style="{ height: `${alturaGrade}px` }">
              <span
                v-for="h in horas"
                :key="h"
                class="absolute right-2 -translate-y-1/2 text-xs tabular-nums text-dimmed"
                :style="{ top: `${(h - HORA_INICIO_GRADE) * PX_POR_HORA}px` }"
              >
                {{ h > HORA_INICIO_GRADE ? `${String(h).padStart(2, '0')}:00` : '' }}
              </span>
            </div>

            <template v-if="visao === 'dia'">
              <div
                v-for="p in profissionaisVisiveis"
                :key="p.id"
                class="grade-linha relative min-w-56 flex-1 cursor-copy border-l border-default"
                :style="{ height: `${alturaGrade}px`, backgroundSize: `100% ${PX_POR_HORA}px` }"
                @click.self="cliqueNaGrade($event, referencia, p.id)"
              >
                <div
                  class="pointer-events-none absolute inset-x-0 bg-elevated/60"
                  :style="{ top: `${(12 - HORA_INICIO_GRADE) * PX_POR_HORA}px`, height: `${PX_POR_HORA}px` }"
                />
                <button
                  v-for="bloco in blocosPorProfissional.get(p.id)"
                  :key="bloco.agendamento.id"
                  type="button"
                  class="bloco-agenda"
                  :class="`status-${bloco.agendamento.status.toLowerCase()}`"
                  :style="estiloBloco(bloco, p.cor)"
                  @click="abrirDetalhe(bloco.agendamento)"
                >
                  <span class="truncate font-medium">{{ bloco.agendamento.cliente.nome }}</span>
                  <span v-if="bloco.altura > 34" class="truncate opacity-80">
                    {{ hora(bloco.agendamento.inicio) }} · {{ bloco.agendamento.servico.nome }}
                  </span>
                </button>
                <div
                  v-if="posicaoAgora !== null && mesmoDia(referencia, agora)"
                  class="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-error"
                  :style="{ top: `${posicaoAgora}px` }"
                />
              </div>
              <UEmpty
                v-if="!profissionaisVisiveis.length && !carregando"
                icon="i-lucide-stethoscope"
                title="Nenhum profissional ativo"
                description="Cadastre um profissional para começar a agendar."
                variant="naked"
                class="flex-1"
              />
            </template>

            <template v-else>
              <div
                v-for="(dia, indice) in diasSemana"
                :key="dia.toISOString()"
                class="grade-linha relative min-w-40 flex-1 cursor-copy border-l border-default"
                :class="mesmoDia(dia, agora) ? 'bg-primary/3' : ''"
                :style="{ height: `${alturaGrade}px`, backgroundSize: `100% ${PX_POR_HORA}px` }"
                @click.self="cliqueNaGrade($event, dia)"
              >
                <div
                  class="pointer-events-none absolute inset-x-0 bg-elevated/60"
                  :style="{ top: `${(12 - HORA_INICIO_GRADE) * PX_POR_HORA}px`, height: `${PX_POR_HORA}px` }"
                />
                <button
                  v-for="bloco in blocosPorDia[indice]"
                  :key="bloco.agendamento.id"
                  type="button"
                  class="bloco-agenda"
                  :class="`status-${bloco.agendamento.status.toLowerCase()}`"
                  :style="estiloBloco(bloco, bloco.agendamento.profissional.cor)"
                  @click="abrirDetalhe(bloco.agendamento)"
                >
                  <span class="truncate font-medium">{{ bloco.totalColunas > 2 ? bloco.agendamento.cliente.nome.split(' ')[0] : bloco.agendamento.cliente.nome }}</span>
                  <span v-if="bloco.altura > 34 && bloco.totalColunas <= 2" class="truncate opacity-80">{{ hora(bloco.agendamento.inicio) }}</span>
                </button>
                <div
                  v-if="posicaoAgora !== null && mesmoDia(dia, agora)"
                  class="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-error"
                  :style="{ top: `${posicaoAgora}px` }"
                />
              </div>
            </template>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-default px-4 py-2 text-xs text-muted sm:px-6">
        <span class="flex items-center gap-1.5"><span class="legenda status-agendado" />Agendado</span>
        <span class="flex items-center gap-1.5"><span class="legenda status-confirmado" />Confirmado</span>
        <span class="flex items-center gap-1.5"><span class="legenda status-concluido" />Concluído</span>
        <span class="flex items-center gap-1.5"><span class="legenda status-faltou" />Faltou</span>
        <span class="ml-auto hidden sm:inline">Clique num horário vazio para agendar · atalhos: ← → T N</span>
      </div>
    </template>
  </UDashboardPanel>

  <ModalAgendamento v-model:open="modalAberto" :agendamento="emEdicao" :sugestao="sugestao" @salvo="aoSalvar" />
  <DetalheAgendamento v-model:open="detalheAberto" :agendamento="selecionado" @atualizado="aoAtualizar" @editar="editar" />
</template>

<style scoped>
.bloco-agenda {
  --cor: #6366f1;
  position: absolute;
  z-index: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 6px;
  border-left: 3px solid var(--cor);
  background-color: color-mix(in oklab, var(--cor) 16%, var(--ui-bg));
  padding: 3px 6px;
  text-align: left;
  font-size: 12px;
  line-height: 1.3;
  color: var(--ui-text-highlighted);
  transition: box-shadow 0.15s, transform 0.15s;
  cursor: pointer;
}

.bloco-agenda:hover {
  z-index: 5;
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.12);
}

.bloco-agenda.status-confirmado {
  background-color: color-mix(in oklab, var(--cor) 30%, var(--ui-bg));
}

.bloco-agenda.status-concluido {
  background-color: color-mix(in oklab, var(--cor) 8%, var(--ui-bg));
  color: var(--ui-text-muted);
}

.bloco-agenda.status-faltou {
  background-image: repeating-linear-gradient(135deg, transparent 0 6px, color-mix(in oklab, var(--ui-warning) 18%, transparent) 6px 12px);
  color: var(--ui-text-muted);
}

.bloco-agenda.status-cancelado {
  opacity: 0.5;
  text-decoration: line-through;
  border-left-style: dashed;
}

.legenda {
  display: inline-block;
  width: 14px;
  height: 10px;
  border-radius: 3px;
  border-left: 3px solid var(--ui-primary);
  background-color: color-mix(in oklab, var(--ui-primary) 16%, var(--ui-bg));
}

.legenda.status-confirmado {
  background-color: color-mix(in oklab, var(--ui-primary) 30%, var(--ui-bg));
}

.legenda.status-concluido {
  background-color: color-mix(in oklab, var(--ui-primary) 8%, var(--ui-bg));
}

.legenda.status-faltou {
  background-image: repeating-linear-gradient(135deg, transparent 0 3px, color-mix(in oklab, var(--ui-warning) 40%, transparent) 3px 6px);
}
</style>
