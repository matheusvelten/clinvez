<script setup lang="ts">
import type { StatusAgendamento } from '~/types'

const props = defineProps<{ status: StatusAgendamento, size?: 'sm' | 'md' }>()
const info = computed(() => statusInfo[props.status])
</script>

<template>
  <UBadge :color="info.cor" variant="subtle" :size="size ?? 'md'" :icon="info.icone">
    {{ info.rotulo }}
  </UBadge>
</template>
