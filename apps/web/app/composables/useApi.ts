import type { FetchError } from 'ofetch'

export function useApi() {
  const config = useRuntimeConfig()
  const { token, sair } = useAuth()

  return $fetch.create({
    baseURL: config.public.apiBase,
    onRequest({ options }) {
      if (token.value) {
        options.headers.set('Authorization', `Bearer ${token.value}`)
      }
    },
    async onResponseError({ response }) {
      if (response.status === 401) await sair()
    },
  })
}

export function mensagemErro(erro: unknown) {
  const dados = (erro as FetchError)?.data
  const mensagem = dados?.message
  if (Array.isArray(mensagem)) return mensagem[0] as string
  if (typeof mensagem === 'string') return mensagem
  return 'Não foi possível concluir a operação. Tente novamente.'
}

export function useNotificacao() {
  const toast = useToast()
  return {
    sucesso: (title: string, description?: string) =>
      toast.add({ title, description, color: 'success', icon: 'i-lucide-circle-check' }),
    erro: (erro: unknown, title = 'Algo deu errado') =>
      toast.add({ title, description: mensagemErro(erro), color: 'error', icon: 'i-lucide-circle-alert' }),
  }
}
