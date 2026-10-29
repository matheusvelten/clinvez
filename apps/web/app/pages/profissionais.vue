<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import type { Profissional, Servico } from '~/types'

useHead({ title: 'Profissionais · Agendei' })

const api = useApi()
const notificacao = useNotificacao()
const { ehAdmin } = useAuth()

const { data: profissionais, status, refresh } = useAsyncData('profissionais', () => api<Profissional[]>('/profissionais'))
const { data: servicos } = useAsyncData('servicos-ativos', () => api<Servico[]>('/servicos', { query: { ativos: true } }))

const schema = z.object({
  nome: z.string().trim().min(3, 'Informe o nome completo'),
  especialidade: z.string().trim().min(2, 'Informe a especialidade'),
  cor: z.string(),
  ativo: z.boolean(),
  servicoIds: z.array(z.string()).min(1, 'Selecione pelo menos um serviço'),
})
type Formulario = z.output<typeof schema>

const modalAberto = ref(false)
const emEdicao = ref<Profissional | null>(null)
const salvando = ref(false)
const estado = reactive<Formulario>({ nome: '', especialidade: '', cor: coresProfissional[0]!, ativo: true, servicoIds: [] })

const itensServicos = computed(() => (servicos.value ?? []).map(s => ({ label: s.nome, value: s.id })))

function abrir(profissional?: Profissional) {
  emEdicao.value = profissional ?? null
  Object.assign(estado, {
    nome: profissional?.nome ?? '',
    especialidade: profissional?.especialidade ?? '',
    cor: profissional?.cor ?? coresProfissional[(profissionais.value?.length ?? 0) % coresProfissional.length],
    ativo: profissional?.ativo ?? true,
    servicoIds: profissional?.servicos.map(s => s.id) ?? [],
  })
  modalAberto.value = true
}

async function salvar(evento: FormSubmitEvent<Formulario>) {
  salvando.value = true
  try {
    if (emEdicao.value) {
      await api(`/profissionais/${emEdicao.value.id}`, { method: 'PATCH', body: evento.data })
    } else {
      await api('/profissionais', { method: 'POST', body: evento.data })
    }
    notificacao.sucesso(emEdicao.value ? 'Profissional atualizado' : 'Profissional cadastrado', evento.data.nome)
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
  <UDashboardPanel id="profissionais">
    <template #header>
      <UDashboardNavbar title="Profissionais">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton v-if="ehAdmin" icon="i-lucide-plus" label="Novo profissional" @click="abrir()" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="status === 'pending' && !profissionais" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <USkeleton v-for="n in 3" :key="n" class="h-44" />
      </div>
      <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <UCard
          v-for="p in profissionais"
          :key="p.id"
          :class="!p.ativo ? 'opacity-60' : ''"
          :ui="{ body: 'space-y-4' }"
        >
          <div class="flex items-start gap-3">
            <span class="flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white" :style="{ backgroundColor: p.cor }">
              {{ iniciais(p.nome) }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate font-semibold">{{ p.nome }}</p>
              <p class="text-sm text-muted">{{ p.especialidade }}</p>
            </div>
            <UBadge v-if="!p.ativo" label="Inativo" color="neutral" variant="subtle" />
            <UButton v-if="ehAdmin" icon="i-lucide-pencil" color="neutral" variant="ghost" size="sm" aria-label="Editar" @click="abrir(p)" />
          </div>
          <div>
            <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Serviços</p>
            <div class="flex flex-wrap gap-1.5">
              <UBadge v-for="s in p.servicos" :key="s.id" color="neutral" variant="outline" :label="`${s.nome} · ${s.duracaoMinutos} min`" />
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>

  <UModal v-model:open="modalAberto" :title="emEdicao ? 'Editar profissional' : 'Novo profissional'">
    <template #body>
      <UForm id="form-profissional" :schema="schema" :state="estado" class="space-y-4" @submit="salvar">
        <UFormField label="Nome" name="nome" required>
          <UInput v-model="estado.nome" class="w-full" placeholder="Ex.: Dra. Ana Lima" />
        </UFormField>
        <UFormField label="Especialidade" name="especialidade" required>
          <UInput v-model="estado.especialidade" class="w-full" placeholder="Ex.: Fisioterapia" />
        </UFormField>
        <UFormField label="Serviços que realiza" name="servicoIds" required>
          <USelectMenu v-model="estado.servicoIds" :items="itensServicos" value-key="value" multiple placeholder="Selecione" class="w-full" />
        </UFormField>
        <UFormField label="Cor na agenda" name="cor">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="cor in coresProfissional"
              :key="cor"
              type="button"
              class="size-8 rounded-full ring-offset-2 ring-offset-default transition"
              :class="estado.cor === cor ? 'ring-2 ring-inverted' : 'hover:scale-110'"
              :style="{ backgroundColor: cor }"
              :aria-label="`Cor ${cor}`"
              @click="estado.cor = cor"
            />
          </div>
        </UFormField>
        <USwitch v-if="emEdicao" v-model="estado.ativo" label="Profissional ativo" description="Profissionais inativos não aparecem na agenda." />
      </UForm>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton label="Cancelar" color="neutral" variant="ghost" @click="modalAberto = false" />
        <UButton type="submit" form="form-profissional" label="Salvar" :loading="salvando" />
      </div>
    </template>
  </UModal>
</template>
