<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'

definePageMeta({ layout: false })
useHead({ title: 'Entrar · Agendei' })

const { entrar } = useAuth()
const notificacao = useNotificacao()

const schema = z.object({
  email: z.email('Informe um e-mail válido'),
  senha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
})
type Login = z.output<typeof schema>

const estado = reactive({ email: 'admin@agendei.dev', senha: 'admin123' })
const carregando = ref(false)

async function enviar(evento: FormSubmitEvent<Login>) {
  carregando.value = true
  try {
    await entrar(evento.data.email, evento.data.senha)
    await navigateTo('/')
  } catch (erro) {
    notificacao.erro(erro, 'Não foi possível entrar')
  } finally {
    carregando.value = false
  }
}

function usarPerfil(email: string, senha: string) {
  estado.email = email
  estado.senha = senha
}
</script>

<template>
  <div class="grid min-h-dvh lg:grid-cols-2">
    <div class="relative hidden overflow-hidden bg-primary-700 lg:flex lg:flex-col lg:justify-between lg:p-12 text-white">
      <div class="absolute -right-24 -top-24 size-96 rounded-full bg-primary-500/40 blur-3xl" />
      <div class="absolute -bottom-32 -left-20 size-96 rounded-full bg-primary-900/50 blur-3xl" />
      <div class="relative flex items-center gap-3">
        <img src="/favicon.svg" alt="" class="size-10 rounded-lg ring-2 ring-white/20">
        <span class="text-2xl font-semibold tracking-tight">Agendei</span>
      </div>
      <div class="relative max-w-md space-y-6">
        <h1 class="text-4xl font-semibold leading-tight">
          A agenda da sua clínica, organizada do jeito certo.
        </h1>
        <ul class="space-y-3 text-primary-50/90">
          <li class="flex items-center gap-3"><UIcon name="i-lucide-calendar-check" class="size-5" /> Horários livres calculados automaticamente</li>
          <li class="flex items-center gap-3"><UIcon name="i-lucide-shield-check" class="size-5" /> Nada de conflito entre atendimentos</li>
          <li class="flex items-center gap-3"><UIcon name="i-lucide-chart-column" class="size-5" /> Faturamento e comparecimento em tempo real</li>
        </ul>
      </div>
      <p class="relative text-sm text-primary-100/70">
        Projeto de demonstração · dados fictícios
      </p>
    </div>

    <div class="flex items-center justify-center p-6">
      <div class="w-full max-w-sm space-y-8">
        <div class="space-y-2">
          <div class="flex items-center gap-2 lg:hidden">
            <img src="/favicon.svg" alt="" class="size-8">
            <span class="text-xl font-semibold">Agendei</span>
          </div>
          <h2 class="text-2xl font-semibold">Entrar</h2>
          <p class="text-muted">Acesse com sua conta para gerenciar a agenda.</p>
        </div>

        <UForm :schema="schema" :state="estado" class="space-y-4" @submit="enviar">
          <UFormField label="E-mail" name="email">
            <UInput v-model="estado.email" type="email" icon="i-lucide-mail" class="w-full" size="lg" autocomplete="email" />
          </UFormField>
          <UFormField label="Senha" name="senha">
            <UInput v-model="estado.senha" type="password" icon="i-lucide-lock" class="w-full" size="lg" autocomplete="current-password" />
          </UFormField>
          <UButton type="submit" block size="lg" :loading="carregando">Entrar</UButton>
        </UForm>

        <UCard variant="subtle" :ui="{ body: 'space-y-3 sm:p-4' }">
          <p class="text-sm font-medium">Contas de demonstração</p>
          <div class="grid grid-cols-2 gap-2">
            <UButton color="neutral" variant="outline" icon="i-lucide-shield-check" @click="usarPerfil('admin@agendei.dev', 'admin123')">
              Admin
            </UButton>
            <UButton color="neutral" variant="outline" icon="i-lucide-headset" @click="usarPerfil('recepcao@agendei.dev', 'recepcao123')">
              Recepção
            </UButton>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
