<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const users = ref<Array<{ id: number, username: string, entropy: number, role: string }>>([])
const errorMsg = ref('')
const loading = ref(true)

// Vérification du rôle dans le token
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

onMounted(async () => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    router.push('/login')
    return
  }

  const payload = parseJwt(token)
  if (!payload || payload.role !== 'admin') {
    router.push('/login')
    return
  }

  try {
    const res = await fetch('/api/dashboard', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}` // si jamais tu décides d'accepter aussi l'auth header
      },
      credentials: 'include' // pour que le cookie soit envoyé
    })

    const data = await res.json()
    if (!res.ok) {
      errorMsg.value = data.error || 'Erreur serveur'
    } else {
      users.value = data.users
    }
  } catch (err) {
    errorMsg.value = 'Impossible de contacter le serveur'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="dashboard">
    <h1>Tableau de bord (Admin)</h1>

    <div v-if="loading">Chargement...</div>
    <p v-if="errorMsg" class="error">{{ errorMsg }}</p>

    <table v-if="!loading && users.length" class="users-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nom d'utilisateur</th>
          <th>Entropie</th>
          <th>Rôle</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in users" :key="u.id">
          <td>{{ u.id }}</td>
          <td>{{ u.username }}</td>
          <td>{{ u.entropy }}</td>
          <td>{{ u.role }}</td>
        </tr>
      </tbody>
    </table>

    <div v-if="!loading && !users.length && !errorMsg">
      Aucun utilisateur trouvé.
    </div>
  </main>
</template>

<style scoped>
.dashboard {
  width: 800px; max-width: 100%;
  margin: 2rem auto; padding: 1.75rem;
  border: 1px solid var(--color-border); border-radius: 14px;
  background: var(--color-background-soft, #fff);
  box-shadow: 0 6px 20px rgba(0,0,0,.06);
}
.error { color: #ff3d3d; margin-top: 1rem; }
.users-table {
  margin-top: 1rem; border-collapse: collapse; width: 100%;
}
.users-table th, .users-table td {
  border: 1px solid #ddd; padding: 8px; text-align: left;
}
.users-table th {
  background-color: #2563eb; color: white;
}
</style>
