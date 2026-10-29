<script setup lang="ts">
import type { ResumoDashboard } from '~/types'

useHead({ title: 'Painel' })

const api = useApi()
const { usuario } = useAuth()

const referencia = ref(new Date())
const inicio = computed(() => new Date(referencia.value.getFullYear(), referencia.value.getMonth(), 1))
const fim = computed(() => new Date(referencia.value.getFullYear(), referencia.value.getMonth() + 1, 1))
const rotuloMes = computed(() => {
  const texto = inicio.value.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
})
const ehMesAtual = computed(() => {
  const hoje = new Date()
  return hoje.getFullYear() === inicio.value.getFullYear() && hoje.getMonth() === inicio.value.getMonth()
})

const { data: resumo, status } = useAsyncData(
  'dashboard',
  () => api<ResumoDashboard>('/dashboard', {
    query: { inicio: inicio.value.toISOString(), fim: fim.value.toISOString() },
  }),
  { watch: [inicio] },
)
const carregando = computed(() => status.value === 'pending')

function mudarMes(delta: number) {
  referencia.value = new Date(referencia.value.getFullYear(), referencia.value.getMonth() + delta, 1)
}

const saudacao = computed(() => {
  const h = new Date().getHours()
  const periodo = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
  return `${periodo}, ${usuario.value?.nome.split(' ')[0] ?? ''}`
})

const graficoDias = computed(() =>
  (resumo.value?.porDia ?? []).map(d => ({
    dia: d.data.slice(8, 10),
    atendimentos: d.atendimentos,
  })),
)

const graficoServicos = computed(() => {
  const lista = resumo.value?.porServico ?? []
  const principais = lista.slice(0, 5)
  const outros = lista.slice(5).reduce((soma, s) => soma + s.quantidade, 0)
  return [
    ...principais.map(s => ({ nome: s.nome, quantidade: s.quantidade })),
    ...(outros ? [{ nome: 'Outros', quantidade: outros }] : []),
  ]
})

const maiorProfissional = computed(() => Math.max(1, ...(resumo.value?.porProfissional ?? []).map(p => p.quantidade)))
</script>

<template>
  <UDashboardPanel id="painel">
    <template #header>
      <UDashboardNavbar :title="saudacao">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <div class="flex items-center gap-1">
            <UButton icon="i-lucide-chevron-left" color="neutral" variant="ghost" aria-label="Mês anterior" @click="mudarMes(-1)" />
            <span class="min-w-36 text-center text-sm font-medium">{{ rotuloMes }}</span>
            <UButton icon="i-lucide-chevron-right" color="neutral" variant="ghost" aria-label="Próximo mês" @click="mudarMes(1)" />
            <UButton v-if="!ehMesAtual" label="Hoje" color="neutral" variant="outline" size="sm" class="ml-1" @click="referencia = new Date()" />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          titulo="Atendimentos no mês"
          :valor="String(resumo?.totais.agendamentos ?? 0)"
          icone="i-lucide-calendar-days"
          :detalhe="`${resumo?.totais.CANCELADO ?? 0} cancelados`"
          :carregando="carregando"
        />
        <KpiCard
          titulo="Faturamento"
          :valor="moeda(resumo?.totais.faturamento ?? 0)"
          icone="i-lucide-wallet"
          :detalhe="`${resumo?.totais.CONCLUIDO ?? 0} atendimentos concluídos`"
          :carregando="carregando"
        />
        <KpiCard
          titulo="Ticket médio"
          :valor="moeda(resumo?.totais.ticketMedio ?? 0)"
          icone="i-lucide-receipt"
          detalhe="Por atendimento concluído"
          :carregando="carregando"
        />
        <KpiCard
          titulo="Comparecimento"
          :valor="porcentagem(resumo?.totais.taxaComparecimento ?? 0)"
          icone="i-lucide-user-check"
          :detalhe="`${resumo?.totais.FALTOU ?? 0} faltas no período`"
          :carregando="carregando"
        />
      </div>

      <div class="grid gap-4 xl:grid-cols-3">
        <UCard class="xl:col-span-2" :ui="{ header: 'flex items-center justify-between' }">
          <template #header>
            <div>
              <p class="font-semibold">Atendimentos por dia</p>
              <p class="text-sm text-muted">{{ rotuloMes }}, sem cancelamentos</p>
            </div>
          </template>
          <USkeleton v-if="carregando" class="h-[260px] w-full" />
          <UChart
            v-else-if="graficoDias.length"
            type="bar"
            :data="graficoDias"
            index="dia"
            :categories="[{ key: 'atendimentos', label: 'Atendimentos', color: 'primary' }]"
            :height="260"
            :legend="false"
          />
          <UEmpty v-else icon="i-lucide-chart-column" title="Sem atendimentos neste mês" variant="naked" />
        </UCard>

        <UCard>
          <template #header>
            <p class="font-semibold">Serviços mais procurados</p>
            <p class="text-sm text-muted">Distribuição no mês</p>
          </template>
          <USkeleton v-if="carregando" class="mx-auto size-52 rounded-full" />
          <UChart
            v-else-if="graficoServicos.length"
            type="donut"
            :data="graficoServicos"
            index="nome"
            :categories="['quantidade']"
            :height="260"
            :thickness="28"
          />
          <UEmpty v-else icon="i-lucide-pie-chart" title="Sem dados" variant="naked" />
        </UCard>
      </div>

      <div class="grid gap-4 xl:grid-cols-3">
        <UCard class="xl:col-span-2" :ui="{ body: 'p-0 sm:p-0' }">
          <template #header>
            <div class="flex items-center justify-between">
              <div>
                <p class="font-semibold">Próximos atendimentos</p>
                <p class="text-sm text-muted">Agendados e confirmados</p>
              </div>
              <UButton to="/agenda" label="Abrir agenda" color="neutral" variant="outline" size="sm" trailing-icon="i-lucide-arrow-right" />
            </div>
          </template>
          <ul v-if="resumo?.proximos.length" class="divide-y divide-default">
            <li v-for="a in resumo.proximos" :key="a.id" class="flex items-center gap-4 px-4 py-3 sm:px-6">
              <div class="w-14 shrink-0 text-center">
                <p class="text-xs uppercase text-muted">{{ new Date(a.inicio).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '') }}</p>
                <p class="font-semibold tabular-nums">{{ hora(a.inicio) }}</p>
              </div>
              <span class="h-10 w-1 shrink-0 rounded-full" :style="{ backgroundColor: a.profissional.cor }" />
              <div class="min-w-0 flex-1">
                <p class="truncate font-medium">{{ a.cliente.nome }}</p>
                <p class="truncate text-sm text-muted">{{ a.servico.nome }} · {{ a.profissional.nome }}</p>
              </div>
              <StatusBadge :status="a.status" size="sm" class="hidden sm:inline-flex" />
            </li>
          </ul>
          <UEmpty v-else-if="!carregando" icon="i-lucide-calendar" title="Nenhum atendimento futuro" variant="naked" class="py-10" />
        </UCard>

        <UCard>
          <template #header>
            <p class="font-semibold">Desempenho por profissional</p>
            <p class="text-sm text-muted">Atendimentos e faturamento no mês</p>
          </template>
          <ul class="space-y-4">
            <li v-for="p in resumo?.porProfissional ?? []" :key="p.nome" class="space-y-1.5">
              <div class="flex items-center justify-between gap-2 text-sm">
                <span class="truncate font-medium">{{ p.nome }}</span>
                <span class="shrink-0 tabular-nums text-muted">{{ p.quantidade }} · {{ moeda(p.faturamento) }}</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-elevated">
                <div class="h-full rounded-full transition-all" :style="{ width: `${(p.quantidade / maiorProfissional) * 100}%`, backgroundColor: p.cor }" />
              </div>
            </li>
          </ul>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
