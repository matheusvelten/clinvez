<script setup lang="ts">
import type { FormSubmitEvent, TableColumn } from '@nuxt/ui'
import { z } from 'zod'
import type { Perfil, Usuario } from '~/types'

definePageMeta({ apenasAdmin: true })
useHead({ title: 'Usuários' })

const api = useApi()
const notificacao = useNotificacao()
const { usuario: usuarioAtual } = useAuth()

const { data: usuarios, status, refresh } = useAsyncData('usuarios', () => api<Usuario[]>('/usuarios'))

const colunas: TableColumn<Usuario>[] = [
  { accessorKey: 'nome', header: 'Usuário' },
  { accessorKey: 'perfil', header: 'Perfil' },
  { accessorKey: 'ativo', header: 'Situação' },
  { accessorKey: 'criadoEm', header: 'Criado em' },
  { id: 'acoes', header: '' },
]

const perfis = [
  { label: 'Administrador', value: 'ADMIN', description: 'Acesso total, incluindo cadastros e usuários' },
  { label: 'Atendente', value: 'ATENDENTE', description: 'Agenda e clientes' },
]

const modalAberto = ref(false)
const emEdicao = ref<Usuario | null>(null)
const salvando = ref(false)

const schema = computed(() => z.object({
  nome: z.string().trim().min(3, 'Informe o nome'),
  email: z.email('Informe um e-mail válido'),
  senha: emEdicao.value
    ? z.union([z.literal(''), z.string().min(6, 'A senha deve ter pelo menos 6 caracteres')])
    : z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  perfil: z.enum(['ADMIN', 'ATENDENTE']),
  ativo: z.boolean(),
}))
type Formulario = { nome: string, email: string, senha: string, perfil: Perfil, ativo: boolean }
const estado = reactive<Formulario>({ nome: '', email: '', senha: '', perfil: 'ATENDENTE', ativo: true })

function abrir(usuario?: Usuario) {
  emEdicao.value = usuario ?? null
  Object.assign(estado, {
    nome: usuario?.nome ?? '',
    email: usuario?.email ?? '',
    senha: '',
    perfil: usuario?.perfil ?? 'ATENDENTE',
    ativo: usuario?.ativo ?? true,
  })
  modalAberto.value = true
}

async function salvar(evento: FormSubmitEvent<Formulario>) {
  salvando.value = true
  const { senha, ...resto } = evento.data
  const corpo = senha ? { ...resto, senha } : resto
  try {
    if (emEdicao.value) {
      await api(`/usuarios/${emEdicao.value.id}`, { method: 'PATCH', body: corpo })
    } else {
      await api('/usuarios', { method: 'POST', body: corpo })
    }
    notificacao.sucesso(emEdicao.value ? 'Usuário atualizado' : 'Usuário criado', evento.data.email)
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
  <UDashboardPanel id="usuarios">
    <template #header>
      <UDashboardNavbar title="Usuários">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton icon="i-lucide-user-plus" label="Novo usuário" @click="abrir()" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UTable
        :data="usuarios ?? []"
        :columns="colunas"
        :loading="status === 'pending' && !usuarios"
        class="shrink-0 rounded-lg border border-default"
        :ui="{ thead: 'bg-elevated/50', th: 'text-xs uppercase tracking-wide', td: 'py-3' }"
      >
        <template #nome-cell="{ row }">
          <div class="flex items-center gap-3">
            <UAvatar :alt="row.original.nome" size="sm" />
            <div>
              <p class="font-medium text-highlighted">
                {{ row.original.nome }}
                <span v-if="row.original.id === usuarioAtual?.id" class="text-xs font-normal text-muted">(você)</span>
              </p>
              <p class="text-xs text-muted">{{ row.original.email }}</p>
            </div>
          </div>
        </template>
        <template #perfil-cell="{ row }">
          <UBadge
            :label="row.original.perfil === 'ADMIN' ? 'Administrador' : 'Atendente'"
            :icon="row.original.perfil === 'ADMIN' ? 'i-lucide-shield-check' : 'i-lucide-headset'"
            :color="row.original.perfil === 'ADMIN' ? 'primary' : 'neutral'"
            variant="subtle"
          />
        </template>
        <template #ativo-cell="{ row }">
          <UBadge :label="row.original.ativo ? 'Ativo' : 'Inativo'" :color="row.original.ativo ? 'success' : 'neutral'" variant="subtle" />
        </template>
        <template #criadoEm-cell="{ row }">
          <span class="tabular-nums">{{ row.original.criadoEm ? dataCurta(row.original.criadoEm) : '' }}</span>
        </template>
        <template #acoes-cell="{ row }">
          <div class="flex justify-end">
            <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" aria-label="Editar" @click="abrir(row.original)" />
          </div>
        </template>
      </UTable>
    </template>
  </UDashboardPanel>

  <UModal v-model:open="modalAberto" :title="emEdicao ? 'Editar usuário' : 'Novo usuário'">
    <template #body>
      <UForm id="form-usuario" :schema="schema" :state="estado" class="space-y-4" @submit="salvar">
        <UFormField label="Nome" name="nome" required>
          <UInput v-model="estado.nome" class="w-full" />
        </UFormField>
        <UFormField label="E-mail" name="email" required>
          <UInput v-model="estado.email" type="email" class="w-full" />
        </UFormField>
        <UFormField :label="emEdicao ? 'Nova senha' : 'Senha'" name="senha" :required="!emEdicao" :hint="emEdicao ? 'Deixe em branco para manter' : undefined">
          <UInput v-model="estado.senha" type="password" class="w-full" autocomplete="new-password" />
        </UFormField>
        <UFormField label="Perfil" name="perfil" required>
          <URadioGroup v-model="estado.perfil" :items="perfis" variant="card" orientation="vertical" />
        </UFormField>
        <USwitch v-if="emEdicao && emEdicao.id !== usuarioAtual?.id" v-model="estado.ativo" label="Usuário ativo" description="Usuários inativos não conseguem entrar." />
      </UForm>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton label="Cancelar" color="neutral" variant="ghost" @click="modalAberto = false" />
        <UButton type="submit" form="form-usuario" label="Salvar" :loading="salvando" />
      </div>
    </template>
  </UModal>
</template>
