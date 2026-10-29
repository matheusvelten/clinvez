<script setup lang="ts">
import type { Agendamento, StatusAgendamento } from '~/types'

const aberto = defineModel<boolean>('open', { default: false })
const props = defineProps<{ agendamento: Agendamento | null }>()
const emit = defineEmits<{ atualizado: [agendamento: Agendamento], editar: [agendamento: Agendamento] }>()

const api = useApi()
const notificacao = useNotificacao()
const alterando = ref<StatusAgendamento | null>(null)

const a = computed(() => props.agendamento)
const podeEditar = computed(() => a.value && ['AGENDADO', 'CONFIRMADO'].includes(a.value.status))

const acoes = computed(() => {
  if (!a.value) return []
  const s = a.value.status
  const lista: { status: StatusAgendamento, rotulo: string, icone: string, cor: 'primary' | 'neutral' | 'error' | 'warning' | 'info' | 'success', variante: 'solid' | 'soft' | 'outline' }[] = []
  if (s === 'AGENDADO') lista.push({ status: 'CONFIRMADO', rotulo: 'Confirmar presença', icone: 'i-lucide-calendar-check', cor: 'info', variante: 'soft' })
  if (s === 'AGENDADO' || s === 'CONFIRMADO') {
    lista.push({ status: 'CONCLUIDO', rotulo: 'Concluir atendimento', icone: 'i-lucide-circle-check-big', cor: 'success', variante: 'solid' })
    lista.push({ status: 'FALTOU', rotulo: 'Marcar falta', icone: 'i-lucide-user-x', cor: 'warning', variante: 'soft' })
    lista.push({ status: 'CANCELADO', rotulo: 'Cancelar', icone: 'i-lucide-calendar-x', cor: 'error', variante: 'soft' })
  }
  if (s === 'CANCELADO' || s === 'FALTOU') {
    lista.push({ status: 'AGENDADO', rotulo: 'Reativar agendamento', icone: 'i-lucide-rotate-ccw', cor: 'neutral', variante: 'outline' })
  }
  return lista
})

const mensagemWhatsApp = computed(() => {
  if (!a.value) return ''
  const primeiroNome = a.value.cliente.nome.split(' ')[0]
  return `Olá, ${primeiroNome}! Passando para confirmar seu horário de ${a.value.servico.nome} com ${a.value.profissional.nome} em ${dataExtenso(a.value.inicio)}, às ${hora(a.value.inicio)}. Podemos confirmar?`
})

async function alterarStatus(status: StatusAgendamento) {
  if (!a.value) return
  alterando.value = status
  try {
    const atualizado = await api<Agendamento>(`/agendamentos/${a.value.id}/status`, { method: 'PATCH', body: { status } })
    notificacao.sucesso(`Status alterado para ${statusInfo[status].rotulo.toLowerCase()}`)
    emit('atualizado', atualizado)
  } catch (erro) {
    notificacao.erro(erro)
  } finally {
    alterando.value = null
  }
}
</script>

<template>
  <USlideover v-model:open="aberto" title="Detalhes do agendamento" :ui="{ content: 'max-w-md' }">
    <template #body>
      <div v-if="a" class="space-y-6">
        <div class="flex items-start gap-3">
          <UAvatar :alt="a.cliente.nome" size="lg" />
          <div class="min-w-0 flex-1">
            <NuxtLink :to="`/clientes/${a.clienteId}`" class="text-lg font-semibold hover:underline">
              {{ a.cliente.nome }}
            </NuxtLink>
            <p class="text-sm text-muted">{{ a.cliente.telefone }}</p>
          </div>
          <StatusBadge :status="a.status" />
        </div>

        <UButton
          :to="linkWhatsApp(a.cliente.telefone, mensagemWhatsApp)"
          target="_blank"
          icon="i-lucide-message-circle"
          label="Enviar confirmação no WhatsApp"
          color="success"
          variant="soft"
          block
        />

        <dl class="divide-y divide-default rounded-lg border border-default">
          <div class="flex items-center gap-3 px-4 py-3">
            <UIcon name="i-lucide-calendar" class="size-5 text-muted" />
            <div>
              <dt class="text-xs text-muted">Data e horário</dt>
              <dd class="font-medium first-letter:uppercase">{{ dataExtenso(a.inicio) }}, {{ hora(a.inicio) }} às {{ hora(a.fim) }}</dd>
            </div>
          </div>
          <div class="flex items-center gap-3 px-4 py-3">
            <span class="size-5 rounded-full" :style="{ backgroundColor: a.profissional.cor }" />
            <div>
              <dt class="text-xs text-muted">Profissional</dt>
              <dd class="font-medium">{{ a.profissional.nome }} <span class="font-normal text-muted">· {{ a.profissional.especialidade }}</span></dd>
            </div>
          </div>
          <div class="flex items-center gap-3 px-4 py-3">
            <UIcon name="i-lucide-clipboard-list" class="size-5 text-muted" />
            <div class="flex-1">
              <dt class="text-xs text-muted">Serviço</dt>
              <dd class="flex justify-between font-medium">
                <span>{{ a.servico.nome }} · {{ a.servico.duracaoMinutos }} min</span>
                <span class="tabular-nums">{{ moeda(a.valor) }}</span>
              </dd>
            </div>
          </div>
          <div v-if="a.observacoes" class="flex items-start gap-3 px-4 py-3">
            <UIcon name="i-lucide-notebook-pen" class="mt-0.5 size-5 text-muted" />
            <div>
              <dt class="text-xs text-muted">Observações</dt>
              <dd class="whitespace-pre-line">{{ a.observacoes }}</dd>
            </div>
          </div>
        </dl>
      </div>
    </template>

    <template #footer>
      <div v-if="a" class="flex w-full flex-col gap-2">
        <UButton
          v-for="acao in acoes"
          :key="acao.status"
          :label="acao.rotulo"
          :icon="acao.icone"
          :color="acao.cor"
          :variant="acao.variante"
          :loading="alterando === acao.status"
          :disabled="!!alterando && alterando !== acao.status"
          block
          @click="alterarStatus(acao.status)"
        />
        <UButton
          v-if="podeEditar"
          label="Editar ou remarcar"
          icon="i-lucide-pencil"
          color="neutral"
          variant="ghost"
          block
          @click="emit('editar', a)"
        />
      </div>
    </template>
  </USlideover>
</template>
