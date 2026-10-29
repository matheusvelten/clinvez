import type { Usuario } from '~/types'

export function useAuth() {
  const token = useCookie<string | null>('sessao_token', { sameSite: 'lax', maxAge: 60 * 60 * 8 })
  const usuario = useCookie<Usuario | null>('sessao_usuario', { sameSite: 'lax', maxAge: 60 * 60 * 8 })
  const config = useRuntimeConfig()

  const autenticado = computed(() => !!token.value)
  const ehAdmin = computed(() => usuario.value?.perfil === 'ADMIN')

  async function entrar(email: string, senha: string) {
    const resposta = await $fetch<{ token: string, usuario: Usuario }>('/auth/login', {
      baseURL: config.public.apiBase,
      method: 'POST',
      body: { email, senha },
    })
    token.value = resposta.token
    usuario.value = resposta.usuario
  }

  async function sair() {
    token.value = null
    usuario.value = null
    await navigateTo('/login')
  }

  return { token, usuario, autenticado, ehAdmin, entrar, sair }
}
