<script setup lang="ts">
import type { FormSubmitEvent, TableColumn } from '@nuxt/ui'
import { z } from 'zod'
import type { Servico } from '~/types'

useHead({ title: 'Serviços' })

const api = useApi()
const notificacao = useNotificacao()
const { ehAdmin } = useAuth()

const { data: servicos, status, refresh } = useAsyncData('servicos', () => api<Servico[]>('/servicos'))

const colunas = computed<TableColumn<Servico>[]>(() => [
  { accessorKey: 'nome', header: 'Serviço' },
  { accessorKey: 'duracaoMinutos', header: 'Duração' },
  { accessorKey: 'preco', header: 'Preço' },
  { accessorKey: 'totalProfissionais', header: 'Profissionais' },
  { accessorKey: 'totalAgendamentos', header: 'Agendamentos' },
  { accessorKey: 'ativo', header: 'Situação' },
  ...(ehAdmin.value ? [{ id: 'acoes', header: '' }] : []),
])

const schema = z.object({
  nome: z.string().trim().min(3, 'Informe o nome do serviço'),
  duracaoMinutos: z.number({ error: 'Informe a duração' }).int().min(5, 'Mínimo de 5 minutos').max(480, 'Máximo de 8 horas'),
  preco: z.number({ error: 'Informe o preço' }).min(0, 'O preço não pode ser negativo'),
  ativo: z.boolean(),
})
type Formulario = z.output<typeof schema>

const modalAberto = ref(false)
const emEdicao = ref<Servico | null>(null)
const salvando = ref(false)
const estado = reactive<Formulario>({ nome: '', duracaoMinutos: 30, preco: 0, ativo: true })

function abrir(servico?: Servico) {
  emEdicao.value = servico ?? null
  Object.assign(estado, {
    nome: servico?.nome ?? '',
    duracaoMinutos: servico?.duracaoMinutos ?? 30,
    preco: servico?.preco ?? 0,
    ativo: servico?.ativo ?? true,
  })
  modalAberto.value = true
}

async function salvar(evento: FormSubmitEvent<Formulario>) {
  salvando.value = true
  try {
    if (emEdicao.value) {
      await api(`/servicos/${emEdicao.value.id}`, { method: 'PATCH', body: evento.data })
    } else {
      await api('/servicos', { method: 'POST', body: evento.data })
    }
    notificacao.sucesso(emEdicao.value ? 'Serviço atualizado' : 'Serviço cadastrado', evento.data.nome)
    modalAberto.value = false
    refresh()
  } catch (erro) {
    notificacao.erro(erro, 'Não foi possível salvar')
  } finally {
    salvando.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="servicos">
    <template #header>
      <UDashboardNavbar title="Serviços">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton v-if="ehAdmin" icon="i-lucide-plus" label="Novo serviço" @click="abrir()" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UTable
        :data="servicos ?? []"
        :columns="colunas"
        :loading="status === 'pending' && !servicos"
        class="shrink-0 rounded-lg border border-default"
        :ui="{ thead: 'bg-elevated/50', th: 'text-xs uppercase tracking-wide', td: 'py-3' }"
      >
        <template #nome-cell="{ row }">
          <span class="font-medium text-highlighted">{{ row.original.nome }}</span>
        </template>
        <template #duracaoMinutos-cell="{ row }">
          <span class="flex items-center gap-1.5 tabular-nums"><UIcon name="i-lucide-clock" class="size-4 text-muted" />{{ row.original.duracaoMinutos }} min</span>
        </template>
        <template #preco-cell="{ row }">
          <span class="tabular-nums">{{ row.original.preco ? moeda(row.original.preco) : 'Gratuito' }}</span>
        </template>
        <template #ativo-cell="{ row }">
          <UBadge :label="row.original.ativo ? 'Ativo' : 'Inativo'" :color="row.original.ativo ? 'success' : 'neutral'" variant="subtle" />
        </template>
        <template #acoes-cell="{ row }">
          <div class="flex justify-end">
            <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" aria-label="Editar" @click="abrir(row.original)" />
          </div>
        </template>
      </UTable>
    </template>
  </UDashboardPanel>

  <UModal v-model:open="modalAberto" :title="emEdicao ? 'Editar serviço' : 'Novo serviço'">
    <template #body>
      <UForm id="form-servico" :schema="schema" :state="estado" class="space-y-4" @submit="salvar">
        <UFormField label="Nome" name="nome" required>
          <UInput v-model="estado.nome" class="w-full" placeholder="Ex.: Consulta de retorno" />
        </UFormField>
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Duração (minutos)" name="duracaoMinutos" required>
            <UInputNumber v-model="estado.duracaoMinutos" :min="5" :max="480" :step="5" class="w-full" />
          </UFormField>
          <UFormField label="Preço" name="preco" required>
            <UInputNumber
              v-model="estado.preco"
              :min="0"
              :step="10"
              :format-options="{ style: 'currency', currency: 'BRL' }"
              class="w-full"
            />
          </UFormField>
        </div>
        <USwitch v-if="emEdicao" v-model="estado.ativo" label="Serviço ativo" description="Serviços inativos não podem ser agendados." />
      </UForm>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton label="Cancelar" color="neutral" variant="ghost" @click="modalAberto = false" />
        <UButton type="submit" form="form-servico" label="Salvar" :loading="salvando" />
      </div>
    </template>
  </UModal>
</template>
