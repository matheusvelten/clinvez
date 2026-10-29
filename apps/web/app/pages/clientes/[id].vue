<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Agendamento, Cliente } from '~/types'

type ItemCliente = Omit<Agendamento, 'cliente' | 'servico' | 'profissional'> & {
  servico: { nome: string }
  profissional: { nome: string, cor: string }
}
type ClienteDetalhe = Cliente & {
  resumo: { concluidos: number, faltas: number, totalGasto: number, ultimaVisita: string | null }
  proximos: ItemCliente[]
  historico: ItemCliente[]
}

const rota = useRoute()
const api = useApi()

const { data: cliente, status, refresh } = useAsyncData(
  `cliente-${rota.params.id}`,
  () => api<ClienteDetalhe>(`/clientes/${rota.params.id}`),
)

useHead({ title: () => `${cliente.value?.nome ?? 'Cliente'} · Agendei` })

const modalCliente = ref(false)
const modalAgendamento = ref(false)

const proximo = computed(() => cliente.value?.proximos[0])

const idade = computed(() => {
  if (!cliente.value?.dataNascimento) return null
  const nasc = new Date(cliente.value.dataNascimento)
  const hoje = new Date()
  let anos = hoje.getUTCFullYear() - nasc.getUTCFullYear()
  if (hoje.getUTCMonth() < nasc.getUTCMonth() || (hoje.getUTCMonth() === nasc.getUTCMonth() && hoje.getUTCDate() < nasc.getUTCDate())) anos--
  return anos
})

const colunas: TableColumn<ItemCliente>[] = [
  { accessorKey: 'inicio', header: 'Data' },
  { accessorKey: 'servico', header: 'Serviço' },
  { accessorKey: 'profissional', header: 'Profissional' },
  { accessorKey: 'valor', header: 'Valor' },
  { accessorKey: 'status', header: 'Status' },
]
</script>

<template>
  <UDashboardPanel id="cliente">
    <template #header>
      <UDashboardNavbar :title="cliente?.nome ?? 'Cliente'">
        <template #leading>
          <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" to="/clientes" aria-label="Voltar" />
        </template>
        <template #right>
          <UButton icon="i-lucide-pencil" label="Editar" color="neutral" variant="outline" :disabled="!cliente" @click="modalCliente = true" />
          <UButton icon="i-lucide-calendar-plus" label="Agendar" :disabled="!cliente" @click="modalAgendamento = true" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="status === 'pending' && !cliente" class="space-y-4">
        <USkeleton class="h-32 w-full" />
        <USkeleton class="h-64 w-full" />
      </div>

      <template v-else-if="cliente">
        <div class="grid gap-4 lg:grid-cols-3">
          <UCard>
            <div class="flex items-center gap-4">
              <UAvatar :alt="cliente.nome" size="3xl" />
              <div class="min-w-0">
                <p class="text-lg font-semibold">{{ cliente.nome }}</p>
                <p class="text-sm text-muted">Cliente desde {{ dataCurta(cliente.criadoEm) }}</p>
              </div>
            </div>
            <USeparator class="my-4" />
            <ul class="space-y-3 text-sm">
              <li class="flex items-center gap-3">
                <UIcon name="i-lucide-phone" class="size-4 text-muted" />
                <span class="tabular-nums">{{ cliente.telefone }}</span>
                <UButton :to="linkWhatsApp(cliente.telefone)" target="_blank" icon="i-lucide-message-circle" size="xs" color="success" variant="soft" class="ml-auto" label="WhatsApp" />
              </li>
              <li class="flex items-center gap-3">
                <UIcon name="i-lucide-mail" class="size-4 text-muted" />
                <span class="truncate">{{ cliente.email ?? 'Não informado' }}</span>
              </li>
              <li class="flex items-center gap-3">
                <UIcon name="i-lucide-cake" class="size-4 text-muted" />
                <span>{{ cliente.dataNascimento ? `${dataUtc(cliente.dataNascimento)} · ${idade} anos` : 'Não informado' }}</span>
              </li>
              <li v-if="cliente.observacoes" class="flex items-start gap-3">
                <UIcon name="i-lucide-notebook-pen" class="mt-0.5 size-4 text-muted" />
                <span class="whitespace-pre-line">{{ cliente.observacoes }}</span>
              </li>
            </ul>
          </UCard>

          <div class="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            <KpiCard titulo="Atendimentos concluídos" :valor="String(cliente.resumo.concluidos)" icone="i-lucide-circle-check-big" :detalhe="`${cliente.resumo.faltas} faltas`" />
            <KpiCard titulo="Total investido" :valor="moeda(cliente.resumo.totalGasto)" icone="i-lucide-wallet" detalhe="Em atendimentos concluídos" />
            <KpiCard titulo="Última visita" :valor="cliente.resumo.ultimaVisita ? dataCurta(cliente.resumo.ultimaVisita) : '—'" icone="i-lucide-history" />
            <KpiCard
              titulo="Próximo horário"
              :valor="proximo ? `${dataCurta(proximo.inicio)} ${hora(proximo.inicio)}` : 'Nenhum'"
              icone="i-lucide-calendar-clock"
              :detalhe="proximo ? `${proximo.servico.nome} · ${proximo.profissional.nome}` : undefined"
            />
          </div>
        </div>

        <UCard v-if="cliente.proximos.length" :ui="{ body: 'p-0 sm:p-0' }">
          <template #header>
            <p class="font-semibold">Próximos horários</p>
          </template>
          <ul class="divide-y divide-default">
            <li v-for="a in cliente.proximos" :key="a.id" class="flex items-center gap-4 px-4 py-3 sm:px-6">
              <span class="h-9 w-1 rounded-full" :style="{ backgroundColor: a.profissional.cor }" />
              <div class="min-w-0 flex-1">
                <p class="font-medium first-letter:uppercase">{{ dataExtenso(a.inicio) }} · {{ hora(a.inicio) }}</p>
                <p class="truncate text-sm text-muted">{{ a.servico.nome }} · {{ a.profissional.nome }}</p>
              </div>
              <StatusBadge :status="a.status" size="sm" />
            </li>
          </ul>
        </UCard>

        <UCard :ui="{ body: 'p-0 sm:p-0' }">
          <template #header>
            <p class="font-semibold">Histórico de atendimentos</p>
          </template>
          <UTable :data="cliente.historico" :columns="colunas" :ui="{ th: 'text-xs uppercase tracking-wide' }">
            <template #inicio-cell="{ row }">
              <span class="tabular-nums">{{ dataCurta(row.original.inicio) }} · {{ hora(row.original.inicio) }}</span>
            </template>
            <template #servico-cell="{ row }">
              {{ row.original.servico.nome }}
            </template>
            <template #profissional-cell="{ row }">
              <span class="flex items-center gap-2">
                <span class="size-2.5 rounded-full" :style="{ backgroundColor: row.original.profissional.cor }" />
                {{ row.original.profissional.nome }}
              </span>
            </template>
            <template #valor-cell="{ row }">
              <span class="tabular-nums">{{ moeda(row.original.valor) }}</span>
            </template>
            <template #status-cell="{ row }">
              <StatusBadge :status="row.original.status" size="sm" />
            </template>
            <template #empty>
              <UEmpty icon="i-lucide-calendar" title="Nenhum atendimento ainda" variant="naked" />
            </template>
          </UTable>
        </UCard>
      </template>

      <UEmpty v-else icon="i-lucide-user-x" title="Cliente não encontrado" :actions="[{ label: 'Voltar para clientes', to: '/clientes' }]" />
    </template>
  </UDashboardPanel>

  <ModalCliente v-model:open="modalCliente" :cliente="cliente" @salvo="refresh()" />
  <ModalAgendamento v-model:open="modalAgendamento" :sugestao="cliente ? { clienteId: cliente.id } : null" @salvo="refresh()" />
</template>
