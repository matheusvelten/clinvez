<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import type { Cliente } from '~/types'

const aberto = defineModel<boolean>('open', { default: false })
const props = defineProps<{ cliente?: Cliente | null }>()
const emit = defineEmits<{ salvo: [cliente: Cliente] }>()

const api = useApi()
const notificacao = useNotificacao()

const schema = z.object({
  nome: z.string().trim().min(3, 'Informe o nome completo'),
  telefone: z.string().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Informe um telefone válido'),
  email: z.union([z.literal(''), z.email('Informe um e-mail válido')]),
  dataNascimento: z.string(),
  observacoes: z.string().max(1000),
})
type Formulario = z.output<typeof schema>

const estado = reactive<Formulario>({ nome: '', telefone: '', email: '', dataNascimento: '', observacoes: '' })
const salvando = ref(false)

watch(aberto, (valor) => {
  if (!valor) return
  const c = props.cliente
  Object.assign(estado, {
    nome: c?.nome ?? '',
    telefone: c?.telefone ?? '',
    email: c?.email ?? '',
    dataNascimento: c?.dataNascimento?.slice(0, 10) ?? '',
    observacoes: c?.observacoes ?? '',
  })
}, { immediate: true })

const telefone = computed({
  get: () => estado.telefone,
  set: (valor: string) => (estado.telefone = mascaraTelefone(valor)),
})

async function salvar(evento: FormSubmitEvent<Formulario>) {
  salvando.value = true
  const corpo = {
    ...evento.data,
    email: evento.data.email || null,
    dataNascimento: evento.data.dataNascimento || null,
    observacoes: evento.data.observacoes || null,
  }
  try {
    const salvo = props.cliente
      ? await api<Cliente>(`/clientes/${props.cliente.id}`, { method: 'PATCH', body: corpo })
      : await api<Cliente>('/clientes', { method: 'POST', body: corpo })
    notificacao.sucesso(props.cliente ? 'Cliente atualizado' : 'Cliente cadastrado', salvo.nome)
    emit('salvo', salvo)
    aberto.value = false
  } catch (erro) {
    notificacao.erro(erro, 'Não foi possível salvar')
  } finally {
    salvando.value = false
  }
}
</script>

<template>
  <UModal v-model:open="aberto" :title="cliente ? 'Editar cliente' : 'Novo cliente'">
    <template #body>
      <UForm id="form-cliente" :schema="schema" :state="estado" class="space-y-4" @submit="salvar">
        <UFormField label="Nome completo" name="nome" required>
          <UInput v-model="estado.nome" class="w-full" autofocus />
        </UFormField>
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Telefone / WhatsApp" name="telefone" required>
            <UInput v-model="telefone" placeholder="(27) 99999-9999" icon="i-lucide-phone" class="w-full" inputmode="tel" />
          </UFormField>
          <UFormField label="Data de nascimento" name="dataNascimento">
            <UInput v-model="estado.dataNascimento" type="date" class="w-full" />
          </UFormField>
        </div>
        <UFormField label="E-mail" name="email">
          <UInput v-model="estado.email" type="email" icon="i-lucide-mail" class="w-full" />
        </UFormField>
        <UFormField label="Observações" name="observacoes" hint="Opcional">
          <UTextarea v-model="estado.observacoes" :rows="3" autoresize class="w-full" placeholder="Preferências, alergias, convênio..." />
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton label="Cancelar" color="neutral" variant="ghost" @click="aberto = false" />
        <UButton type="submit" form="form-cliente" label="Salvar" :loading="salvando" />
      </div>
    </template>
  </UModal>
</template>
