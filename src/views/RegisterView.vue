<script setup lang="ts">
import { ref, computed } from 'vue'
import Password from 'primevue/password'
import { useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import ProgressBar from 'primevue/progressbar'

const router = useRouter()

const name = ref('')
const password = ref('')

// Backend feedback state
const loading = ref(false)
const serverMessage = ref<string | null>(null)
const serverError = ref<string | null>(null)
const serverDetails = ref<null | {
  entropy_bits: number | null
  redundancy_percent: number | null
  components?: Record<string, number>
  errors?: string[]
}>(null)

const nameValid = computed(() => name.value.trim().length >= 2)

// Regex: 12+ chars, minuscule, majuscule, chiffre, symbole
const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\[\]{};:'",.<>\/\\?`~|]).{12,}$/
const rules = computed(() => {
  const v = password.value
  return [
    { label: 'Au moins 12 caractères', ok: v.length >= 12 },
    { label: 'Au moins une lettre minuscule', ok: /[a-z]/.test(v) },
    { label: 'Au moins une lettre majuscule', ok: /[A-Z]/.test(v) },
    { label: 'Au moins un chiffre', ok: /\d/.test(v) },
    {
      label: 'Au moins un caractère spécial',
      ok: /[!@#$%^&*()\-_=+\[\]{};:'",.<>\/\\?`~|]/.test(v),
    },
  ]
})
const passesRegex = computed(() => regex.test(password.value))


/* ===== Entropie globale ===== */
function estimateEntropyBits(pwd: string): number {
  if (!pwd) return 0
  let charset = 0
  if (/[a-z]/.test(pwd)) charset += 26
  if (/[A-Z]/.test(pwd)) charset += 26
  if (/\d/.test(pwd)) charset += 10
  if (/[!@#$%^&*()\-_=+\[\]{};:'",.<>\/\\?`~|]/.test(pwd)) charset += 33
  if (/(\s)/.test(pwd)) charset += 1
  if (charset === 0) return 0
  const bitsPerChar = Math.log2(charset)
  return Math.round(pwd.length * bitsPerChar)
}
const entropyBits = computed(() => estimateEntropyBits(password.value))
const entropyThreshold = 60
const passesEntropy = computed(() => entropyBits.value >= entropyThreshold)
const entropyPercent = computed(() =>
  Math.max(0, Math.min(100, Math.round((entropyBits.value / entropyThreshold) * 100))),
)

/* ===================== Redondance ===================== */
/* R1: manque de diversité (fréquences) */
function distinctCharCount(pwd: string): number {
  return pwd ? new Set(pwd).size : 0
}
function empiricalEntropyPerChar(pwd: string): number {
  const n = pwd.length
  if (!n) return 0
  const freq = new Map<string, number>()
  for (const c of pwd) freq.set(c, (freq.get(c) ?? 0) + 1)
  let h = 0
  for (const [, count] of freq) {
    const p = count / n
    h += -p * Math.log2(p)
  }
  return h
}

/* R2: dépendances séquentielles */
function conditionalEntropyRateSelective(pwd: string, minTransitionsPerState = 2): number {
  const n = pwd.length
  if (n <= 1) return 0
  const trans = new Map<string, Map<string, number>>()
  const prevCnt = new Map<string, number>()
  for (let i = 1; i < n; i++) {
    const a = pwd[i - 1],
      b = pwd[i]
    if (!trans.has(a)) trans.set(a, new Map())
    const m = trans.get(a)!
    m.set(b, (m.get(b) ?? 0) + 1)
    prevCnt.set(a, (prevCnt.get(a) ?? 0) + 1)
  }
  const reliable: Array<[string, Map<string, number>]> = []
  let totPrevRel = 0
  for (const [a, nextMap] of trans) {
    const c = prevCnt.get(a) ?? 0
    if (c >= minTransitionsPerState) {
      reliable.push([a, nextMap])
      totPrevRel += c
    }
  }
  if (!reliable.length) return empiricalEntropyPerChar(pwd)

  let H = 0
  for (const [a, nextMap] of reliable) {
    const sumNext = Array.from(nextMap.values()).reduce((s, c) => s + c, 0)
    const pPrev = (prevCnt.get(a) ?? 0) / totPrevRel
    let Ha = 0
    for (const [, c] of nextMap) {
      const p = c / sumNext
      Ha += -p * Math.log2(p)
    }
    H += pPrev * Ha
  }
  return H
}

/* R3: bloc répété contigu */
function repeatedBlockCoverage(pwd: string): number {
  const n = pwd.length
  if (n < 4) return 0
  let best = 0
  const Lmax = Math.min(Math.floor(n / 2), 8)
  for (let L = Lmax; L >= 2; L--) {
    for (let i = 0; i + 2 * L <= n; i++) {
      const block = pwd.slice(i, i + L)
      let j = i + L,
        reps = 1
      while (j + L <= n && pwd.slice(j, j + L) === block) {
        reps++
        j += L
      }
      if (reps >= 2) {
        const covered = reps * L
        if (covered > best) best = covered
      }
    }
    if (best === n) break
  }
  return best / n
}

/* Composantes et pondération */
const kDistinct = computed(() => distinctCharCount(password.value))
const hMax = computed(() => (kDistinct.value > 0 ? Math.log2(kDistinct.value) : 0))
const hEmp = computed(() => empiricalEntropyPerChar(password.value))
const hRateSel = computed(() => conditionalEntropyRateSelective(password.value, 2))
const R1 = computed(() => (hMax.value ? 1 - Math.min(hEmp.value, hMax.value) / hMax.value : 1))
const R2 = computed(() => (hMax.value ? 1 - Math.min(hRateSel.value, hMax.value) / hMax.value : 1))
const R3 = computed(() => repeatedBlockCoverage(password.value))

// Pondérations
const W_R1 = 0.3
const W_R2 = 0.2
const redundancy = computed(() => Math.max(R3.value, W_R1 * R1.value, W_R2 * R2.value))
const redundancyPercent = computed(() =>
  Math.round(100 * Math.max(0, Math.min(1, redundancy.value))),
)
const redundancyOk = computed(() => redundancy.value <= 0.2)

const canSubmit = computed(() => nameValid.value && passesRegex.value && passesEntropy.value)
async function onSubmit() {
  if (!canSubmit.value || loading.value) return
  loading.value = true
  serverMessage.value = null
  serverError.value = null
  serverDetails.value = null
  try {
    const isDev = import.meta.env.DEV
    const base = import.meta.env.VITE_API_BASE_URL || ''
    const url = isDev
      ? '/api/register'
      : (base.endsWith('/') ? base : base + '/') + 'register'
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: name.value.trim(), password: password.value }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      serverMessage.value = 'Inscription réussie.'
      serverDetails.value = {
        entropy_bits: data?.entropy_bits ?? null,
        redundancy_percent: data?.redundancy_percent ?? null,
        components: data?.components,
        errors: data?.errors,
      }
      // Optionally clear password
      password.value = ''
      router.push('/login')
    } else {
      // Backend may send: { error: string } or validation object
      const errorMsg: string = data?.error || 'Inscription refusée par le serveur.'
      serverError.value = errorMsg
      serverDetails.value = {
        entropy_bits: data?.entropy_bits ?? null,
        redundancy_percent: data?.redundancy_percent ?? null,
        components: data?.components,
        errors: data?.errors,
      }
    }
  } catch (e: unknown) {
    // Log error to console to aid debugging
    console.error('Register request failed:', e)
    serverError.value = 'Erreur réseau: impossible de contacter le serveur.'
  } finally {
    loading.value = false
  }
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

      <!-- Règles -->
      <ul class="hints">
        <li v-for="(r, i) in rules" :key="i" :class="{ ok: r.ok }">
          <span class="mark">{{ r.ok ? '✔' : '✖' }}</span>
          {{ r.label }}
        </li>
      </ul>

      <!-- Entropie -->
      <div
        class="entropy"
        :class="[{ ok: passesEntropy }, passesEntropy ? 'progress-ok' : 'progress-bad']"
      >
        <div class="entropy-row">
          <div>Entropie estimée: {{ Math.round(entropyBits) }} bits</div>
          <div v-if="!passesEntropy">Objectif: ≥ {{ entropyThreshold }} bits</div>
        </div>
        <ProgressBar :value="entropyPercent" :showValue="true" class="entropy-bar" />
      </div>

      <!-- Redondance -->
      <div class="redundancy" :class="redundancyOk ? 'redundancy-ok' : 'redundancy-bad'">
        <div class="redundancy-row">
          <div>Redondance :</div>
        </div>
        <ProgressBar :value="redundancyPercent" :showValue="true" class="redundancy-bar" />
      </div>
    </div>

    <button class="submit" :disabled="!canSubmit || loading" @click="onSubmit">{{ loading ? 'Envoi…' : `S'inscrire` }}</button>

    <div v-if="serverMessage" class="success" role="status">{{ serverMessage }}</div>
    <div v-if="serverError" class="error" role="alert">{{ serverError }}</div>
  </main>
</template>

<style scoped>
.w-full {
  width: 100%;
}
.register {
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
.register :is(input, .p-password input) {
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
