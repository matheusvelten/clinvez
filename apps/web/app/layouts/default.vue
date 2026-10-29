<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'

const { usuario, ehAdmin, sair } = useAuth()
const { marca } = useAppConfig()
const colorMode = useColorMode()
const aberto = ref(false)

const menu = computed<NavigationMenuItem[][]>(() => [
  [
    { label: 'Painel', icon: 'i-lucide-layout-dashboard', to: '/', onSelect: () => (aberto.value = false) },
    { label: 'Agenda', icon: 'i-lucide-calendar-days', to: '/agenda', onSelect: () => (aberto.value = false) },
    { label: 'Clientes', icon: 'i-lucide-users', to: '/clientes', onSelect: () => (aberto.value = false) },
    { label: 'Profissionais', icon: 'i-lucide-stethoscope', to: '/profissionais', onSelect: () => (aberto.value = false) },
    { label: 'Serviços', icon: 'i-lucide-clipboard-list', to: '/servicos', onSelect: () => (aberto.value = false) },
  ],
  ehAdmin.value
    ? [{ label: 'Usuários', icon: 'i-lucide-shield-check', to: '/usuarios', onSelect: () => (aberto.value = false) }]
    : [],
])

const opcoesUsuario = computed<DropdownMenuItem[][]>(() => [
  [{ type: 'label', label: usuario.value?.email ?? '' }],
  [
    {
      label: colorMode.value === 'dark' ? 'Tema claro' : 'Tema escuro',
      icon: colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon',
      onSelect: () => (colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'),
    },
  ],
  [{ label: 'Sair', icon: 'i-lucide-log-out', color: 'error', onSelect: () => sair() }],
])
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      v-model:open="aberto"
      collapsible
      resizable
      :default-size="15"
      :ui="{ footer: 'border-t border-default' }"
    >
      <template #header="{ collapsed }">
        <NuxtLink to="/" class="flex items-center gap-2.5 px-1">
          <img src="/favicon.svg" alt="" class="size-7 shrink-0">
          <span v-if="!collapsed" class="text-lg font-semibold tracking-tight">{{ marca.nome }}</span>
        </NuxtLink>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          v-for="(grupo, indice) in menu"
          :key="indice"
          :collapsed="collapsed"
          :items="grupo"
          orientation="vertical"
          tooltip
          popover
        />
      </template>

      <template #footer="{ collapsed }">
        <UDropdownMenu :items="opcoesUsuario" :content="{ align: 'center' }" class="w-full">
          <UButton
            color="neutral"
            variant="ghost"
            block
            :square="collapsed"
            class="data-[state=open]:bg-elevated"
          >
            <UAvatar :alt="usuario?.nome" size="xs" />
            <div v-if="!collapsed" class="flex min-w-0 flex-1 flex-col items-start text-left">
              <span class="truncate text-sm font-medium">{{ usuario?.nome }}</span>
              <span class="text-xs text-muted">{{ usuario?.perfil === 'ADMIN' ? 'Administrador' : 'Atendente' }}</span>
            </div>
            <UIcon v-if="!collapsed" name="i-lucide-chevrons-up-down" class="size-4 text-dimmed" />
          </UButton>
        </UDropdownMenu>
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
