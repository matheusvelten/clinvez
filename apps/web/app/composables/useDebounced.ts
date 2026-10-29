export function useDebounced<T>(origem: Ref<T>, atraso = 300) {
  const valor = ref(origem.value) as Ref<T>
  let temporizador: ReturnType<typeof setTimeout> | undefined
  watch(origem, (novo) => {
    clearTimeout(temporizador)
    temporizador = setTimeout(() => (valor.value = novo), atraso)
  })
  return valor
}
