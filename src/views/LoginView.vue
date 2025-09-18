<script setup lang="ts">
import { computed, ref } from 'vue'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'

const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')
const role = ref<string | null>(null)

/* ---- Conditions de base ---- */
const canSubmit = computed(() => username.value.trim().length > 0 && password.value.trim().length > 0)

/* ---- Soumission ---- */
async function onLogin() {
  if (!canSubmit.value) return
  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value })
    })

    const data = await res.json()

    if (!res.ok) {
      errorMsg.value = data.error || 'Erreur inconnue'
    } else {
      successMsg.value = data.message
      role.value = data.role
      // Optionnel : stocker le token pour l’utiliser dans les appels API
      localStorage.setItem('access_token', data.token)
    }
  } catch (err) {
    errorMsg.value = 'Impossible de contacter le serveur'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="login">
    <h1>Connexion</h1>

    <div class="field">
      <label for="username">Nom</label>
      <InputText id="username" v-model="username" placeholder="Entrez votre nom" class="w-full" />
    </div>

    <div class="field">
      <label for="password">Mot de passe</label>
      <Password
        id="password"
        v-model="password"
        :feedback="false"
        :toggleMask="true"
        inputClass="w-full"
        placeholder="Entrez votre mot de passe"
      />
    </div>

    <button class="submit" :disabled="!canSubmit || loading" @click="onLogin">
      {{ loading ? 'Connexion...' : "Se connecter" }}
    </button>

    <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
    <p v-if="successMsg" class="success">
      ✅ {{ successMsg }}
      <span v-if="role"> (rôle: {{ role }})</span>
    </p>
  </main>
</template>

<style scoped>
.w-full { width: 100%; }
.login {
  width: 500px; max-width: 100%;
  margin: 2rem auto; padding: 1.75rem;
  border: 1px solid var(--color-border); border-radius: 14px;
  background: var(--color-background-soft, #fff);
  box-shadow: 0 6px 20px rgba(0,0,0,.06);
}
.field { display: flex; flex-direction: column; gap: .5rem; margin-top: 1rem; }
.field label { font-weight: 600; }
.login :is(input, .p-password input) {
  width: 100%; padding: .625rem .75rem;
  border: 1px solid var(--color-border); border-radius: 10px; background: #fff;
}
.error { color: #ff3d3d; margin-top: 1rem; }
.success { color: #0a7a0a; margin-top: 1rem; }
.submit {
  margin-top: 1.25rem; padding: .7rem 1.1rem; border-radius: 10px;
  background: #2563eb; color: #fff; font-weight: 600; border: none; cursor: pointer;
  transition: background-color .2s ease;
}
.submit:hover:enabled { background: #1e4fd8; }
.submit:disabled { background: #94a3b8; cursor: not-allowed; }
</style>
