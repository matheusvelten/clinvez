<script setup lang="ts">
defineProps<{
  titulo: string
  valor: string
  icone: string
  detalhe?: string
  carregando?: boolean
}>()
</script>

<template>
  <UCard :ui="{ body: 'flex items-start justify-between gap-4' }">
    <div class="min-w-0 space-y-1">
      <p class="text-sm text-muted">{{ titulo }}</p>
      <USkeleton v-if="carregando" class="h-8 w-28" />
      <p v-else class="text-2xl font-semibold tabular-nums">{{ valor }}</p>
      <p v-if="detalhe" class="truncate text-xs text-dimmed">{{ detalhe }}</p>
    </div>
    <div class="rounded-lg bg-primary/10 p-2.5">
      <UIcon :name="icone" class="size-5 text-primary" />
    </div>
  </UCard>
</template>
