<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import { jwtDecode } from 'jwt-decode'

interface JwtPayload {
  username?: string
  role?: string
  exp?: number
}

const username = ref<string | null>(null)
const router = useRouter()

// Vérifie le token au montage
onMounted(() => {
  const token = localStorage.getItem('access_token')
  if (token) {
    try {
      const decoded = jwtDecode<JwtPayload>(token)
      if (decoded?.username) {
        username.value = decoded.username
      }
    } catch (err) {
      console.error('Token invalide:', err)
      localStorage.removeItem('access_token')
    }
  }
})

// Déconnexion
async function logout() {
  try {
    const isDev = import.meta.env.DEV
    const base = import.meta.env.VITE_API_BASE_URL || ''
    const url = isDev
      ? '/logout'
      : (base.endsWith('/') ? base : base + '/') + 'logout'

    await fetch(url, {
      method: 'POST',
      credentials: 'include',
    })

    // Nettoyage côté frontend
    localStorage.removeItem('access_token')
    username.value = null

    // Redirige vers /login
    router.push('/login')
  } catch (err) {
    console.error('Erreur déconnexion:', err)
  }
}
</script>

<template>
  <header>
    <div class="wrapper">
      <div class="left">
        <div class="welcome" v-if="username">Bonjour, {{ username }}</div>
      </div>
      <nav>
        <RouterLink to="/register">Register</RouterLink>
        <RouterLink to="/login">Login</RouterLink>
        <RouterLink to="/dashboard">Dashboard</RouterLink>
        <button v-if="username" class="logout" @click="logout">Déconnexion</button>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
header {
  line-height: 1.5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
}

.welcome {
  font-weight: 600;
  font-size: 1.1rem;
}

nav {
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a {
  padding: 0 0.5rem;
}

.logout {
  padding: 0.4rem 0.8rem;
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
}
.logout:hover {
  background: #dc2626;
}
</style>
