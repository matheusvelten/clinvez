<script setup lang="ts">
const aberto = defineModel<boolean>('open', { default: false })
defineProps<{ titulo: string, descricao: string, carregando?: boolean }>()
const emit = defineEmits<{ confirmar: [] }>()
</script>

<template>
  <UModal v-model:open="aberto" :title="titulo" :description="descricao" :ui="{ footer: 'justify-end' }">
    <template #footer>
      <UButton label="Cancelar" color="neutral" variant="ghost" @click="aberto = false" />
      <UButton label="Excluir" color="error" icon="i-lucide-trash-2" :loading="carregando" @click="emit('confirmar')" />
    </template>
  </UModal>
</template>
