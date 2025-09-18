<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const users = ref<Array<{ id: number, username: string, entropy: number, role: string }>>([])
const errorMsg = ref('')
const loading = ref(true)

/* ----------- Décodage du JWT ----------- */
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

/* ----------- Récupération des users ----------- */
async function fetchUsers() {
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
    const isDev = import.meta.env.DEV
    const base = import.meta.env.VITE_API_BASE_URL || ''
    const url = isDev
        ? '/api/dashboard'
        : (base.endsWith('/') ? base : base + '/') + 'dashboard'
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
      credentials: 'include'
    })

    const data = await res.json()
    if (!res.ok) {
      errorMsg.value = data.error || 'Erreur serveur'
    } else {
      users.value = data.users
    }
  } catch (err) {
    errorMsg.value = 'Impossible de contacter le serveur'
    console.error('Erreur pour contacter le serveur:', err)
  } finally {
    loading.value = false
  }
}

/* ----------- Déconnexion ----------- */
async function onLogout() {
  try {
    const isDev = import.meta.env.DEV
    const base = import.meta.env.VITE_API_BASE_URL || ''
    const url = isDev
        ? '/api/logout'
        : (base.endsWith('/') ? base : base + '/') + 'logout'
    await fetch(url, {
      method: 'POST',
      credentials: 'include'
    })
    localStorage.removeItem('access_token')
    router.push('/login')
  } catch (err) {
    console.error('Erreur lors de la déconnexion:', err)
  }
}

/* ----------- Changer rôle ----------- */
async function changeRole(username: string, newRole: string) {
  try {
    const isDev = import.meta.env.DEV
    const base = import.meta.env.VITE_API_BASE_URL || ''
    const url = isDev
        ? '/api/update-role'
        : (base.endsWith('/') ? base : base + '/') + 'update-role'
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, new_role: newRole })
    })

    const data = await res.json()
    if (!res.ok) {
      alert(data.error || 'Erreur lors de la mise à jour du rôle')
    } else {
      alert(data.message)
      await fetchUsers() // 🔄 recharge la liste après modif
    }
  } catch (err) {
    console.error('Erreur update-role:', err)
  }
}

onMounted(fetchUsers)
</script>

<template>
  <main class="dashboard">
    <h1>Tableau de bord (Admin)</h1>

    <button class="logout" @click="onLogout">Déconnexion</button>

    <div v-if="loading">Chargement...</div>
    <p v-if="errorMsg" class="error">{{ errorMsg }}</p>

    <table v-if="!loading && users.length" class="users-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nom d'utilisateur</th>
          <th>Entropie</th>
          <th>Rôle</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in users" :key="u.id">
          <td>{{ u.id }}</td>
          <td>{{ u.username }}</td>
          <td>{{ u.entropy }}</td>
          <td>{{ u.role }}</td>
          <td>
            <button @click="changeRole(u.username, u.role === 'admin' ? 'user' : 'admin')">
              {{ u.role === 'admin' ? 'Rétrograder en user' : 'Promouvoir en admin' }}
            </button>
          </td>
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
.logout {
  margin-bottom: 1rem;
  padding: .6rem 1.1rem;
  border-radius: 10px;
  background: #ef4444;
  color: #fff;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background-color .2s ease;
}
.logout:hover { background: #dc2626; }
.users-table button {
  padding: .4rem .7rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  background: #2563eb;
  color: white;
  transition: background-color .2s ease;
}
.users-table button:hover { background: #1e4fd8; }
</style>
