<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
import type { Cliente, Paginado } from '~/types'

useHead({ title: 'Clientes' })

const api = useApi()
const notificacao = useNotificacao()
const { ehAdmin } = useAuth()

const busca = ref('')
const buscaAplicada = useDebounced(busca, 350)
const pagina = ref(1)
const porPagina = 10

const { data, status, refresh } = useAsyncData(
  'clientes',
  () => api<Paginado<Cliente>>('/clientes', { query: { pagina: pagina.value, porPagina, busca: buscaAplicada.value || undefined } }),
  { watch: [pagina, buscaAplicada] },
)

watch(buscaAplicada, () => (pagina.value = 1))

const modalAberto = ref(false)
const emEdicao = ref<Cliente | null>(null)
const exclusaoAberta = ref(false)
const paraExcluir = ref<Cliente | null>(null)
const excluindo = ref(false)

const colunas: TableColumn<Cliente>[] = [
  { accessorKey: 'nome', header: 'Cliente' },
  { accessorKey: 'telefone', header: 'Telefone' },
  { accessorKey: 'dataNascimento', header: 'Nascimento' },
  { accessorKey: 'totalAgendamentos', header: 'Atendimentos' },
  { id: 'acoes', header: '' },
]

function novo() {
  emEdicao.value = null
  modalAberto.value = true
}

function editar(cliente: Cliente) {
  emEdicao.value = cliente
  modalAberto.value = true
}

function acoes(cliente: Cliente): DropdownMenuItem[][] {
  return [
    [
      { label: 'Ver histórico', icon: 'i-lucide-history', to: `/clientes/${cliente.id}` },
      { label: 'Editar', icon: 'i-lucide-pencil', onSelect: () => editar(cliente) },
      { label: 'Chamar no WhatsApp', icon: 'i-lucide-message-circle', to: linkWhatsApp(cliente.telefone), target: '_blank' },
    ],
    ehAdmin.value
      ? [{ label: 'Excluir', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => confirmarExclusao(cliente) }]
      : [],
  ]
}

function confirmarExclusao(cliente: Cliente) {
  paraExcluir.value = cliente
  exclusaoAberta.value = true
}

async function excluir() {
  if (!paraExcluir.value) return
  excluindo.value = true
  try {
    await api(`/clientes/${paraExcluir.value.id}`, { method: 'DELETE' })
    notificacao.sucesso('Cliente excluído')
    exclusaoAberta.value = false
    refresh()
  } catch (erro) {
    notificacao.erro(erro, 'Não foi possível excluir')
  } finally {
    excluindo.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="clientes">
    <template #header>
      <UDashboardNavbar title="Clientes">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #trailing>
          <UBadge :label="String(data?.total ?? 0)" variant="subtle" color="neutral" />
        </template>
        <template #right>
          <UButton icon="i-lucide-user-plus" label="Novo cliente" @click="novo" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UInput
        v-model="busca"
        icon="i-lucide-search"
        placeholder="Buscar por nome, telefone ou e-mail"
        class="w-full sm:max-w-sm"
        :loading="status === 'pending'"
      >
        <template v-if="busca" #trailing>
          <UButton icon="i-lucide-x" color="neutral" variant="link" size="sm" aria-label="Limpar busca" @click="busca = ''" />
        </template>
      </UInput>

      <UTable
        :data="data?.itens ?? []"
        :columns="colunas"
        :loading="status === 'pending' && !data"
        class="shrink-0 rounded-lg border border-default"
        :ui="{ thead: 'bg-elevated/50', th: 'text-xs uppercase tracking-wide', td: 'py-3' }"
      >
        <template #nome-cell="{ row }">
          <NuxtLink :to="`/clientes/${row.original.id}`" class="flex items-center gap-3">
            <UAvatar :alt="row.original.nome" size="sm" />
            <div class="min-w-0">
              <p class="truncate font-medium text-highlighted hover:underline">{{ row.original.nome }}</p>
              <p class="truncate text-xs text-muted">{{ row.original.email ?? 'Sem e-mail' }}</p>
            </div>
          </NuxtLink>
        </template>
        <template #telefone-cell="{ row }">
          <span class="tabular-nums">{{ row.original.telefone }}</span>
        </template>
        <template #dataNascimento-cell="{ row }">
          <span class="tabular-nums">{{ row.original.dataNascimento ? dataUtc(row.original.dataNascimento) : '—' }}</span>
        </template>
        <template #totalAgendamentos-cell="{ row }">
          <UBadge :label="String(row.original.totalAgendamentos ?? 0)" color="neutral" variant="soft" />
        </template>
        <template #acoes-cell="{ row }">
          <div class="flex justify-end">
            <UDropdownMenu :items="acoes(row.original)" :content="{ align: 'end' }">
              <UButton icon="i-lucide-ellipsis-vertical" color="neutral" variant="ghost" aria-label="Ações" />
            </UDropdownMenu>
          </div>
        </template>
        <template #empty>
          <UEmpty
            icon="i-lucide-users"
            :title="busca ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'"
            :description="busca ? 'Tente buscar por outro termo.' : 'Cadastre o primeiro cliente para começar.'"
            variant="naked"
          />
        </template>
      </UTable>

      <div class="flex items-center justify-between gap-3">
        <p class="text-sm text-muted">
          {{ data?.total ?? 0 }} clientes
        </p>
        <UPagination
          v-if="(data?.totalPaginas ?? 1) > 1"
          v-model:page="pagina"
          :total="data?.total ?? 0"
          :items-per-page="porPagina"
        />
      </div>
    </template>
  </UDashboardPanel>

  <ModalCliente v-model:open="modalAberto" :cliente="emEdicao" @salvo="refresh()" />
  <ConfirmarExclusao
    v-model:open="exclusaoAberta"
    titulo="Excluir cliente"
    :descricao="`Tem certeza que deseja excluir ${paraExcluir?.nome}? Esta ação não pode ser desfeita.`"
    :carregando="excluindo"
    @confirmar="excluir"
  />
</template>
