<script setup lang="ts">
import { ref, computed } from 'vue'
import Password from 'primevue/password'
import InputText from 'primevue/inputtext'
import ProgressBar from 'primevue/progressbar'

const name = ref('')
const password = ref('')

const nameValid = computed(() => name.value.trim().length >= 2)

// Regex: min 12 chars, at least one digit, one lowercase, one uppercase, and one special char
const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\[\]{};:'",.<>\/\\?`~|]).{12,}$/

const rules = computed(() => {
  const value = password.value
  return [
    { label: 'Au moins 12 caractères', ok: value.length >= 12 },
    { label: 'Au moins une lettre minuscule', ok: /[a-z]/.test(value) },
    { label: 'Au moins une lettre majuscule', ok: /[A-Z]/.test(value) },
    { label: 'Au moins un chiffre', ok: /\d/.test(value) },
    {
      label: 'Au moins un caractère spécial',
      ok: /[!@#$%^&*()\-_=+\[\]{};:'",.<>\/\\?`~|]/.test(value),
    },
  ]
})

const passesRegex = computed(() => regex.test(password.value))

// Very simple entropy estimation based on character sets used
function estimateEntropyBits(pwd: string): number {
  if (!pwd) return 0
  let charset = 0
  if (/[a-z]/.test(pwd)) charset += 26
  if (/[A-Z]/.test(pwd)) charset += 26
  if (/\d/.test(pwd)) charset += 10
  // common symbols on keyboard (~33 printable punctuation)
  if (/[!@#$%^&*()\-_=+\[\]{};:'",.<>\/\\?`~|]/.test(pwd)) charset += 33
  if (/(\s)/.test(pwd)) charset += 1 // account space if used
  if (charset === 0) return 0
  const bitsPerChar = Math.log2(charset)
  return Math.round(pwd.length * bitsPerChar)
}

const entropyBits = computed(() => estimateEntropyBits(password.value))
const entropyThreshold = 60 // target minimal entropy (bits)
const passesEntropy = computed(() => entropyBits.value >= entropyThreshold)
const entropyPercent = computed(() => {
  const pct = Math.round((entropyBits.value / entropyThreshold) * 100)
  return Math.max(0, Math.min(100, pct))
})

const canSubmit = computed(() => nameValid.value && passesRegex.value && passesEntropy.value)

function onSubmit() {
  if (!canSubmit.value) return
  alert(`Bienvenue, ${name.value}! Mot de passe valide. Inscription simulée !`)
}
</script>

<template>
  <main class="register">
    <h1>Créer un compte</h1>

    <div class="field">
      <label for="name">Nom</label>
      <InputText id="name" v-model="name" placeholder="Entrez votre nom" class="w-full" />
      <small v-if="name && !nameValid" class="error">Veuillez entrer au moins 2 caractères.</small>
    </div>

    <div class="field">
      <label for="pwd">Mot de passe</label>
      <Password
        id="pwd"
        v-model="password"
        :feedback="false"
        :toggleMask="true"
        inputClass="w-full"
        placeholder="Entrez votre mot de passe"
      />
      <!-- Feedback personnalisé basé sur la regex -->
      <ul class="hints">
        <li v-for="(r, i) in rules" :key="i" :class="{ ok: r.ok }">
          <span class="mark">{{ r.ok ? '✔' : '✖' }}</span>
          {{ r.label }}
        </li>
      </ul>

      <!-- Vérification entropique (seconde vérification) -->
      <div
        class="entropy"
        :class="[{ ok: passesEntropy }, passesEntropy ? 'progress-ok' : 'progress-bad']"
      >
        <div class="entropy-row">
          <div>Entropie estimée: {{ entropyBits }} bits</div>
          <div v-if="!passesEntropy">Objectif: ≥ {{ entropyThreshold }} bits</div>
        </div>
        <ProgressBar :value="entropyPercent" :showValue="true" class="entropy-bar" />
      </div>
    </div>

    <button class="submit" :disabled="!canSubmit" @click="onSubmit">S'inscrire</button>
  </main>
</template>

<style scoped>
.register {
  max-width: 520px;
  margin: 2rem auto;
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
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
.submit {
  margin-top: 1.25rem;
  padding: 0.6rem 1rem;
}
</style>

/* Enhancements */
<style scoped>
.w-full {
  width: 100%;
}

.register {
  width: 500px;
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

/* Make inputs look consistent */
.register :is(input, .p-password input) {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-background, #fff);
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
.progress-ok :deep(.p-progressbar-value) {
  background: #16a34a;
}
.progress-bad :deep(.p-progressbar-value) {
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

.error {
  color: #ff3d3d;
  font-size: 0.875rem;
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

/* Center and place the eye (toggle) button properly inside PrimeVue Password */
:deep(.p-password) {
  position: relative;
}
:deep(.p-password .p-password-toggle-mask) {
  position: absolute;
  right: 0.625rem; /* align to the right with some spacing */
  top: 50%;
  transform: translateY(-50%);
}
/* Ensure there is space for the eye icon so it doesn't overlap text */
:deep(.p-password input) {
  padding-right: 2.25rem;
}

/* Explicitly target the PrimeVue toggle icon classes (masked/unmasked) */
:deep(.p-password .p-icon.p-password-toggle-mask-icon),
:deep(.p-password .p-icon.p-password-unmask-icon) {
  position: absolute;
  right: 0.625rem;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem; /* ensure predictable box for centering */
  height: 1.25rem;
  pointer-events: auto; /* keep it clickable */
}
</style>
