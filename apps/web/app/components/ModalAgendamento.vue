<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import type { Agendamento, Cliente, Paginado, Profissional, SugestaoAgendamento } from '~/types'

const aberto = defineModel<boolean>('open', { default: false })
const props = defineProps<{
  agendamento?: Agendamento | null
  sugestao?: SugestaoAgendamento | null
}>()
const emit = defineEmits<{ salvo: [agendamento: Agendamento] }>()

const api = useApi()
const notificacao = useNotificacao()

const schema = z.object({
  clienteId: z.string({ error: 'Selecione o cliente' }).min(1, 'Selecione o cliente'),
  profissionalId: z.string({ error: 'Selecione o profissional' }).min(1, 'Selecione o profissional'),
  servicoId: z.string({ error: 'Selecione o serviço' }).min(1, 'Selecione o serviço'),
  data: z.string().min(1, 'Informe a data'),
  horario: z.string({ error: 'Escolha um horário' }).min(1, 'Escolha um horário'),
  observacoes: z.string().max(500).optional(),
})
type Formulario = z.output<typeof schema>

const estado = reactive<Partial<Formulario>>({})
const clientes = ref<Cliente[]>([])
const profissionais = ref<Profissional[]>([])
const horarios = ref<string[]>([])
const carregandoHorarios = ref(false)
const salvando = ref(false)
const horarioSugerido = ref<string | null>(null)
const preparando = ref(false)

const editando = computed(() => !!props.agendamento)

const itensClientes = computed(() =>
  clientes.value.map(c => ({ label: c.nome, value: c.id, description: c.telefone })),
)
const itensProfissionais = computed(() =>
  profissionais.value.map(p => ({ label: p.nome, value: p.id, description: p.especialidade })),
)
const profissionalSelecionado = computed(() => profissionais.value.find(p => p.id === estado.profissionalId))
const itensServicos = computed(() =>
  (profissionalSelecionado.value?.servicos ?? [])
    .filter(s => s.ativo)
    .map(s => ({ label: `${s.nome} · ${s.duracaoMinutos} min · ${moeda(s.preco)}`, value: s.id })),
)
const itensHorarios = computed(() => horarios.value.map(h => ({ label: hora(h), value: h })))
const sugestaoIndisponivel = computed(
  () => !!horarioSugerido.value && !carregandoHorarios.value && !horarios.value.includes(horarioSugerido.value),
)

async function carregarListas() {
  const [listaClientes, listaProfissionais] = await Promise.all([
    api<Paginado<Cliente>>('/clientes', { query: { porPagina: 100 } }),
    api<Profissional[]>('/profissionais', { query: { ativos: true } }),
  ])
  clientes.value = listaClientes.itens
  profissionais.value = listaProfissionais
  if (props.agendamento && !clientes.value.some(c => c.id === props.agendamento!.clienteId)) {
    const c = props.agendamento.cliente
    clientes.value.unshift({ ...c, email: null, dataNascimento: null, observacoes: null, criadoEm: '' })
  }
}

async function preparar() {
  preparando.value = true
  try {
    await carregarListas()
    const a = props.agendamento
    if (a) {
      Object.assign(estado, {
        clienteId: a.clienteId,
        profissionalId: a.profissionalId,
        servicoId: a.servicoId,
        data: paraInputData(new Date(a.inicio)),
        horario: undefined,
        observacoes: a.observacoes ?? '',
      })
      horarioSugerido.value = new Date(a.inicio).toISOString()
    } else {
      const s = props.sugestao
      const profissionalId = s?.profissionalId ?? profissionais.value[0]?.id
      const servicos = profissionais.value.find(p => p.id === profissionalId)?.servicos ?? []
      Object.assign(estado, {
        clienteId: s?.clienteId,
        profissionalId,
        servicoId: servicos[0]?.id,
        data: paraInputData(s?.inicio ?? s?.data ?? new Date()),
        horario: undefined,
        observacoes: '',
      })
      horarioSugerido.value = s?.inicio ? s.inicio.toISOString() : null
    }
  } catch (erro) {
    notificacao.erro(erro)
  } finally {
    await nextTick()
    preparando.value = false
  }
  await buscarHorarios()
}

async function buscarHorarios() {
  if (!estado.profissionalId || !estado.servicoId || !estado.data) {
    horarios.value = []
    return
  }
  carregandoHorarios.value = true
  try {
    horarios.value = await api<string[]>('/agendamentos/horarios-livres', {
      query: {
        profissionalId: estado.profissionalId,
        servicoId: estado.servicoId,
        inicioDia: deInputData(estado.data).toISOString(),
        ...(props.agendamento ? { ignorarId: props.agendamento.id } : {}),
      },
    })
    if (horarioSugerido.value && horarios.value.includes(horarioSugerido.value)) {
      estado.horario = horarioSugerido.value
    } else if (estado.horario && !horarios.value.includes(estado.horario)) {
      estado.horario = undefined
    }
  } catch (erro) {
    notificacao.erro(erro)
  } finally {
    carregandoHorarios.value = false
  }
}

watch(aberto, (valor) => {
  if (valor) preparar()
}, { immediate: true })

watch(() => estado.profissionalId, () => {
  if (preparando.value) return
  if (!itensServicos.value.some(s => s.value === estado.servicoId)) {
    estado.servicoId = itensServicos.value[0]?.value
  }
  buscarHorarios()
})

watch(() => [estado.servicoId, estado.data], () => {
  if (!preparando.value) buscarHorarios()
})

async function salvar(evento: FormSubmitEvent<Formulario>) {
  salvando.value = true
  const corpo = {
    clienteId: evento.data.clienteId,
    profissionalId: evento.data.profissionalId,
    servicoId: evento.data.servicoId,
    inicio: evento.data.horario,
    observacoes: evento.data.observacoes || null,
  }
  try {
    const salvo = editando.value
      ? await api<Agendamento>(`/agendamentos/${props.agendamento!.id}`, { method: 'PATCH', body: corpo })
      : await api<Agendamento>('/agendamentos', { method: 'POST', body: corpo })
    notificacao.sucesso(
      editando.value ? 'Agendamento atualizado' : 'Agendamento criado',
      `${salvo.cliente.nome} · ${dataCurta(salvo.inicio)} às ${hora(salvo.inicio)}`,
    )
    emit('salvo', salvo)
    aberto.value = false
  } catch (erro) {
    notificacao.erro(erro, 'Não foi possível salvar')
    buscarHorarios()
  } finally {
    salvando.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="aberto"
    :title="editando ? 'Editar agendamento' : 'Novo agendamento'"
    :description="editando ? 'Altere os dados e escolha um novo horário, se precisar.' : 'Escolha o cliente, o serviço e um horário livre.'"
    :ui="{ content: 'sm:max-w-xl' }"
  >
    <template #body>
      <UForm id="form-agendamento" :schema="schema" :state="estado" class="space-y-4" @submit="salvar">
        <UFormField label="Cliente" name="clienteId" required>
          <USelectMenu
            v-model="estado.clienteId"
            :items="itensClientes"
            value-key="value"
            placeholder="Busque pelo nome"
            icon="i-lucide-user"
            :loading="preparando"
            class="w-full"
          />
        </UFormField>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Profissional" name="profissionalId" required>
            <USelectMenu
              v-model="estado.profissionalId"
              :items="itensProfissionais"
              value-key="value"
              :search-input="false"
              placeholder="Selecione"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Data" name="data" required>
            <UInput v-model="estado.data" type="date" class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Serviço" name="servicoId" required>
          <USelect
            v-model="estado.servicoId"
            :items="itensServicos"
            placeholder="Selecione o profissional primeiro"
            :disabled="!itensServicos.length"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Horário" name="horario" required>
          <div v-if="carregandoHorarios" class="grid grid-cols-4 gap-2 sm:grid-cols-6">
            <USkeleton v-for="n in 12" :key="n" class="h-8" />
          </div>
          <div v-else-if="itensHorarios.length" class="grid max-h-44 grid-cols-4 gap-2 overflow-y-auto pr-1 sm:grid-cols-6">
            <UButton
              v-for="h in itensHorarios"
              :key="h.value"
              :label="h.label"
              :color="estado.horario === h.value ? 'primary' : 'neutral'"
              :variant="estado.horario === h.value ? 'solid' : 'outline'"
              size="sm"
              block
              class="tabular-nums"
              @click="estado.horario = h.value"
            />
          </div>
          <UAlert
            v-else
            icon="i-lucide-calendar-x"
            color="neutral"
            variant="subtle"
            title="Nenhum horário livre neste dia"
            description="Tente outra data ou outro profissional. A clínica não abre aos domingos."
          />
        </UFormField>

        <UAlert
          v-if="sugestaoIndisponivel && !editando"
          icon="i-lucide-info"
          color="warning"
          variant="subtle"
          :title="`O horário das ${hora(horarioSugerido!)} não comporta este serviço`"
          description="Escolha um dos horários livres acima."
        />

        <UFormField label="Observações" name="observacoes">
          <UTextarea v-model="estado.observacoes" :rows="2" autoresize placeholder="Opcional" class="w-full" />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton label="Cancelar" color="neutral" variant="ghost" @click="aberto = false" />
        <UButton type="submit" form="form-agendamento" :label="editando ? 'Salvar alterações' : 'Agendar'" :loading="salvando" />
      </div>
    </template>
  </UModal>
</template>
