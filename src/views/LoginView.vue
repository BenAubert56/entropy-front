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
    const res = await fetch('login', {
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
    console.error('Erreur pour contacter le serveur:', err)
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
      {{ loading ? 'Connexion...' : 'Se connecter' }}
    </button>

    <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
    <p v-if="successMsg" class="success">
      ✅ {{ successMsg }}
      <span v-if="role"> (rôle: {{ role }})</span>
    </p>
  </main>
</template>

<style scoped>
.w-full {
  width: 100%;
}
.login {
  width: 500px;
  max-width: 100%;
  margin: 2rem auto;
  padding: 1.75rem;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-background-soft, #fff);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}
.field label {
  font-weight: 600;
}
.login :is(input, .p-password input) {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
}
.hints {
  margin: 0.5rem 0 0;
  padding-left: 1.25rem;
}
.hints li {
  list-style: none;
  margin: 0.25rem 0;
  color: #ff3d3d;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.hints li.ok {
  color: #0a7a0a;
}
.mark {
  width: 1rem;
  display: inline-block;
}
.entropy {
  margin-top: 0.5rem;
  color: #ff3d3d;
}
.entropy.ok {
  color: #0a7a0a;
}
.entropy .entropy-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}
.entropy-bar {
  width: 100%;
}
.redundancy {
  margin-top: 0.75rem;
}
.redundancy-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
  font-size: 0.95rem;
}
.redundancy .meta {
  opacity: 0.85;
}
.redundancy-bar {
  width: 100%;
}
.progress-ok :deep(.p-progressbar-value),
.redundancy-ok :deep(.p-progressbar-value) {
  background: #16a34a;
}
.progress-bad :deep(.p-progressbar-value),
.redundancy-bad :deep(.p-progressbar-value) {
  background: #ef4444;
}
:deep(.p-progressbar) {
  height: 0.75rem;
  border-radius: 0.5rem;
}
:deep(.p-progressbar .p-progressbar-label) {
  font-size: 0.75rem;
  line-height: 0.75rem;
  color: var(--vt-c-black);
}
:deep(.p-password) {
  position: relative;
}
:deep(.p-password .p-password-toggle-mask) {
  position: absolute;
  right: 0.625rem;
  top: 50%;
  transform: translateY(-50%);
}
:deep(.p-password input) {
  padding-right: 2.25rem;
}
:deep(.p-password .p-icon.p-password-toggle-mask-icon),
:deep(.p-password .p-icon.p-password-unmask-icon) {
  position: absolute;
  right: 0.625rem;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  pointer-events: auto;
}
.error {
  color: #ff3d3d;
  font-size: 0.875rem;
}
.success {
  color: #16a34a;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}
.server-details {
  margin-top: 0.75rem;
  font-size: 0.9rem;
}
.submit {
  margin-top: 1.25rem;
  padding: 0.7rem 1.1rem;
  border-radius: 10px;
  background: #2563eb;
  color: #fff;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.submit:hover:enabled {
  background: #1e4fd8;
}
.submit:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}
</style>
