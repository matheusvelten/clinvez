export default defineNuxtRouteMiddleware((to) => {
  const { autenticado, ehAdmin } = useAuth()

  if (to.path === '/login') {
    if (autenticado.value) return navigateTo('/')
    return
  }

  if (!autenticado.value) return navigateTo('/login')

  if (to.meta.apenasAdmin && !ehAdmin.value) return navigateTo('/')
})
