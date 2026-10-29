<script setup lang="ts">
import { pt_br } from '@nuxt/ui/locale'

const { marca } = useAppConfig()

useHead({
  titleTemplate: titulo => (titulo ? `${titulo} · ${marca.nome}` : marca.nome),
})
</script>

<template>
  <UApp :locale="pt_br" :toaster="{ position: 'top-right' }">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
