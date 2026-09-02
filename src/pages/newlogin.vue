<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../api.js'

const router = useRouter()
const route = useRoute()

// --- Reactive state ---
const email = ref('')
const password = ref('')
const signupEmail = ref('')
const signupPassword = ref('')
const signupRole = ref('buyer')

const successMessage = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

// Active tab: 'login' or 'signup'
const activeTab = ref('login')

// Carousel state
const stages = ['pending', 'priced', 'locked']
const currentStageIndex = ref(0)
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
let cycleTimer = null

// --- Computed for signup button ---
const signupButtonLabel = computed(() =>
  signupRole.value === 'seller' ? 'Create Seller Account' : 'Create Buyer Account'
)
const signupButtonClass = computed(() =>
  signupRole.value === 'seller' ? 'role-seller' : 'role-buyer'
)

// --- Methods ---
const handleLogin = async () => {
  successMessage.value = ''
  errorMessage.value = ''
  isLoading.value = true

  try {
    const response = await api.post('/auth/login', {
      email: email.value,
      password: password.value,
    })

    const { token, role } = response.data
    localStorage.setItem('token', token)
    localStorage.setItem('role', role)

    successMessage.value = 'Login successful! Redirecting...'

    // Redirect after a short delay so the user sees the message
    setTimeout(() => {
      router.push(role === 'seller' ? '/seller-dashboard' : '/buyer-dashboard')
    }, 1000)
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Login failed.'
  } finally {
    isLoading.value = false
  }
}

const handleRegister = async () => {
  successMessage.value = ''
  errorMessage.value = ''
  isLoading.value = true

  // Basic validation
  if (!signupEmail.value || !signupPassword.value) {
    errorMessage.value = 'Please fill in all fields.'
    isLoading.value = false
    return
  }

  try {
    const response = await api.post('/auth/register', {
      email: signupEmail.value,
      password: signupPassword.value,
      role: signupRole.value,
    })

    successMessage.value = response.data.message + ' Redirecting to login...'
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Registration failed.'
  } finally {
    isLoading.value = false
  }
}

// --- Carousel controls ---
const showStage = (index) => {
  currentStageIndex.value = index
}

const goToStage = (index) => {
  showStage(index)
  // Reset the interval
  if (cycleTimer) {
    clearInterval(cycleTimer)
    cycleTimer = null
  }
  startCycle()
}

const startCycle = () => {
  if (reduceMotion) return
  if (cycleTimer) clearInterval(cycleTimer)
  cycleTimer = setInterval(() => {
    const next = (currentStageIndex.value + 1) % stages.length
    showStage(next)
  }, 4500)
}

// --- Lifecycle ---
onMounted(() => {
  // Handle ?role=... query param for signup pre‑selection
  const roleParam = route.query.role
  if (roleParam === 'buyer' || roleParam === 'seller') {
    activeTab.value = 'signup'
    signupRole.value = roleParam
  }

  // Start the carousel
  showStage(0)
  startCycle()
})

onBeforeUnmount(() => {
  if (cycleTimer) clearInterval(cycleTimer)
})

// --- Watch for signup role change to update button (no longer needed with computed, but kept for clarity) ---
// (computed handles it, so we can omit)
</script>

<template>
  <div class="auth-shell">
    <!-- Brand Panel -->
    <aside class="brand-panel">
      <div class="scene-bg">
        <div
          v-for="stage in stages"
          :key="stage"
          class="scene"
          :class="{ active: currentStageIndex === stages.indexOf(stage) }"
          :data-stage="stage"
        >
          <!-- Inline SVGs (same as before) -->
          <svg v-if="stage === 'pending'" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <rect x="70" y="120" width="90" height="120" rx="8" transform="rotate(-8 115 180)" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="1.5"/>
            <rect x="380" y="90" width="100" height="130" rx="8" transform="rotate(6 430 155)" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="1.5"/>
            <rect x="220" y="280" width="85" height="115" rx="8" transform="rotate(-4 262 337)" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="1.5"/>
            <rect x="60" y="450" width="95" height="125" rx="8" transform="rotate(5 107 512)" fill="none" stroke="rgba(255,255,255,.09)" stroke-width="1.5"/>
            <rect x="400" y="480" width="90" height="120" rx="8" transform="rotate(-7 445 540)" fill="none" stroke="rgba(255,255,255,.13)" stroke-width="1.5"/>
            <rect x="230" y="600" width="88" height="118" rx="8" transform="rotate(3 274 659)" fill="none" stroke="rgba(255,255,255,.11)" stroke-width="1.5"/>
            <circle cx="115" cy="150" r="3" fill="#94a3b8" opacity=".6"/>
            <circle cx="430" cy="125" r="3" fill="#94a3b8" opacity=".5"/>
            <circle cx="262" cy="310" r="3" fill="#94a3b8" opacity=".6"/>
          </svg>
          <svg v-else-if="stage === 'priced'" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="blueGlow" cx="50%" cy="45%" r="55%">
                <stop offset="0%" stop-color="#1d4ed8" stop-opacity=".35"/>
                <stop offset="100%" stop-color="#1d4ed8" stop-opacity="0"/>
              </radialGradient>
            </defs>
            <circle cx="300" cy="360" r="260" fill="url(#blueGlow)"/>
            <line x1="130" y1="190" x2="300" y2="360" stroke="rgba(96,165,250,.35)" stroke-width="1.5"/>
            <line x1="470" y1="160" x2="300" y2="360" stroke="rgba(96,165,250,.3)" stroke-width="1.5"/>
            <line x1="120" y1="550" x2="300" y2="360" stroke="rgba(96,165,250,.3)" stroke-width="1.5"/>
            <line x1="460" y1="570" x2="300" y2="360" stroke="rgba(96,165,250,.35)" stroke-width="1.5"/>
            <rect x="116" y="176" width="28" height="28" rx="5" transform="rotate(45 130 190)" fill="none" stroke="#60a5fa" stroke-width="1.5"/>
            <rect x="456" y="146" width="28" height="28" rx="5" transform="rotate(45 470 160)" fill="none" stroke="#60a5fa" stroke-width="1.5"/>
            <rect x="106" y="536" width="28" height="28" rx="5" transform="rotate(45 120 550)" fill="none" stroke="#60a5fa" stroke-width="1.5"/>
            <rect x="446" y="556" width="28" height="28" rx="5" transform="rotate(45 460 570)" fill="none" stroke="#60a5fa" stroke-width="1.5"/>
            <circle cx="300" cy="360" r="5" fill="#93c5fd"/>
          </svg>
          <svg v-else-if="stage === 'locked'" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="mintGlow" cx="50%" cy="42%" r="50%">
                <stop offset="0%" stop-color="#10b981" stop-opacity=".4"/>
                <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
              </radialGradient>
            </defs>
            <circle cx="300" cy="340" r="240" fill="url(#mintGlow)"/>
            <circle cx="300" cy="340" r="150" fill="none" stroke="rgba(16,185,129,.18)" stroke-width="1"/>
            <circle cx="300" cy="340" r="195" fill="none" stroke="rgba(16,185,129,.1)" stroke-width="1"/>
            <g transform="translate(255,290)">
              <rect x="0" y="55" width="90" height="70" rx="12" fill="none" stroke="#6ee7b7" stroke-width="3"/>
              <path d="M18 55V35a27 27 0 0 1 54 0v20" fill="none" stroke="#6ee7b7" stroke-width="3"/>
            </g>
          </svg>
        </div>
      </div>
      <div class="brand-overlay"></div>

      <a class="nav-logo" href="/">Store<b>Link</b></a>

      <div class="brand-copy">
        <div class="eyebrow">
          <span
            v-for="stage in stages"
            :key="stage"
            class="ey-word"
            :class="{ active: currentStageIndex === stages.indexOf(stage) }"
            :data-stage="stage"
          >{{ stage.toUpperCase() }}</span>
          <span class="sep" v-if="stages.length > 1">→</span>
          <!-- We'll show arrows between words, simpler to do with v-for but keep static for brevity -->
        </div>
        <div class="copy-stack">
          <div
            v-for="(copy, index) in [
              { stage: 'pending', title: 'Post what you need.', desc: 'Buyers list an item and a quantity. No forms, no back-and-forth — it\'s live in seconds.' },
              { stage: 'priced', title: 'Get real prices, fast.', desc: 'Sellers respond in the open. Compare offers side by side before you commit to anything.' },
              { stage: 'locked', title: 'Lock it in, and it holds.', desc: 'Accept a price and the deal is set — no renegotiating after, for either side.' }
            ]"
            :key="copy.stage"
            class="copy-slide"
            :class="{ active: currentStageIndex === index }"
            :data-stage="copy.stage"
          >
            <h1>{{ copy.title }}</h1>
            <p>{{ copy.desc }}</p>
          </div>
        </div>
        <div class="stage-dots">
          <button
            v-for="(stage, index) in stages"
            :key="stage"
            class="stage-dot"
            :class="{ active: currentStageIndex === index }"
            :data-stage="stage"
            @click="goToStage(index)"
            :aria-label="`Show ${stage} stage`"
            type="button"
          ></button>
        </div>
      </div>
    </aside>

    <!-- Auth Panel -->
    <main class="auth-panel">
      <div class="auth-card">
        <p v-if="successMessage" class="success">{{ successMessage }}</p>
        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

        <div class="auth-tabs">
          <button
            class="tab"
            :class="{ active: activeTab === 'login' }"
            @click="activeTab = 'login'"
          >Log In</button>
          <button
            class="tab"
            :class="{ active: activeTab === 'signup' }"
            @click="activeTab = 'signup'"
          >Sign Up</button>
        </div>

        <!-- Login Form -->
        <form class="auth-form" v-show="activeTab === 'login'">
          <div class="field">
            <label for="login-email">Email</label>
            <input v-model="email" type="email" id="login-email" placeholder="you@business.com" required>
          </div>
          <div class="field">
            <label for="login-password">Password</label>
            <input v-model="password" type="password" id="login-password" placeholder="••••••••" required>
          </div>
          <button
            class="submit-btn neutral"
            type="button"
            @click="handleLogin"
            :disabled="isLoading"
          >{{ isLoading ? 'Logging in...' : 'Log In' }}</button>
        </form>
        <p class="switch-note login-note" v-show="activeTab === 'login'">
          New to StoreLink?
          <button class="link-btn" @click="activeTab = 'signup'">Sign up</button>
        </p>

        <!-- Signup Form -->
        <form class="auth-form" v-show="activeTab === 'signup'">
          <div class="field">
            <label for="signup-email">Email</label>
            <input v-model="signupEmail" type="email" id="signup-email" placeholder="you@business.com" required>
          </div>
          <div class="field">
            <label for="signup-password">Password</label>
            <input v-model="signupPassword" type="password" id="signup-password" placeholder="••••••••" required>
          </div>
          <div class="field">
            <label for="signup-role">I am a...</label>
            <select v-model="signupRole" id="signup-role">
              <option value="buyer">I am a Buyer</option>
              <option value="seller">I am a Seller</option>
            </select>
          </div>
          <button
            class="submit-btn"
            :class="signupButtonClass"
            type="button"
            @click="handleRegister"
            :disabled="isLoading"
          >{{ isLoading ? 'Creating account...' : signupButtonLabel }}</button>
        </form>
        <p class="switch-note signup-note" v-show="activeTab === 'signup'">
          Already have an account?
          <button class="link-btn" @click="activeTab = 'login'">Log in</button>
        </p>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* ---------- (Your existing styles, unchanged) ---------- */
.auth-shell{display:grid;grid-template-columns:1fr 1fr;min-height:100vh;}

.brand-panel{
  position:relative;overflow:hidden;
  background:var(--ink);color:var(--white);
  padding:48px;display:flex;flex-direction:column;justify-content:space-between;
}
.scene-bg{position:absolute;inset:0;z-index:0;}
.scene{position:absolute;inset:0;opacity:0;transition:opacity 1.2s ease;}
.scene.active{opacity:1;}
.scene svg{width:100%;height:100%;display:block;}
.brand-overlay{
  position:absolute;inset:0;z-index:1;
  background:linear-gradient(180deg, rgba(15,23,42,.5) 0%, rgba(15,23,42,.68) 55%, rgba(15,23,42,.92) 100%);
}
.nav-logo{position:relative;z-index:2;font-weight:800;font-size:1.2rem;letter-spacing:-0.02em;color:var(--white);text-decoration:none;}
.nav-logo b{color:#6ee7b7;}

.brand-copy{position:relative;z-index:2;max-width:420px;}
.eyebrow{
  display:inline-flex;align-items:center;gap:8px;
  font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:.7rem;font-weight:600;letter-spacing:.07em;
  background:rgba(255,255,255,.08);
  padding:8px 13px;border-radius:20px;margin-bottom:22px;
}
.eyebrow .sep{color:rgba(255,255,255,.3);}
.ey-word{color:rgba(255,255,255,.4);transition:color .5s ease;}
.ey-word.active{color:#93c5fd;}

.copy-stack{position:relative;display:grid;}
.copy-slide{grid-area:1/1;opacity:0;transition:opacity .8s ease;pointer-events:none;}
.copy-slide.active{opacity:1;pointer-events:auto;}
.copy-slide h1{font-size:2rem;font-weight:800;line-height:1.16;letter-spacing:-0.02em;margin-bottom:16px;}
.copy-slide p{color:rgba(255,255,255,.65);font-size:.98rem;line-height:1.6;}

.stage-dots{position:relative;z-index:2;display:flex;gap:8px;margin-top:32px;}
.stage-dot{
  width:22px;height:4px;border-radius:2px;border:none;
  background:rgba(255,255,255,.25);cursor:pointer;padding:0;
  transition:background .3s ease;
}
.stage-dot.active{background:#6ee7b7;}

.auth-panel{display:flex;align-items:center;justify-content:center;padding:48px;background:var(--mist);}
.auth-card{
  width:100%;max-width:380px;background:var(--white);border:1px solid var(--line);
  border-radius:18px;padding:34px 32px;box-shadow:0 20px 44px -20px rgba(15,23,42,.14);
}
.auth-tabs{display:flex;gap:24px;border-bottom:1px solid var(--line);margin-bottom:26px;}
.tab{
  padding:4px 2px 14px;font-size:.92rem;font-weight:600;color:var(--slate-soft);
  background:none;border:none;border-bottom:2px solid transparent;cursor:pointer;
}
.tab.active{color:var(--ink);border-bottom-color:var(--ink);}

.auth-form{display:flex;flex-direction:column;gap:18px;}
.auth-form[hidden]{display:none;}
.field label{font-size:.78rem;font-weight:600;color:var(--slate-soft);margin-bottom:6px;display:block;}
.field input,.field select{
  width:100%;padding:12px 14px;border:1px solid var(--line);border-radius:9px;
  font-size:.92rem;color:var(--ink);background:var(--white);
}
.field select{
  appearance:none;-webkit-appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right 14px center;padding-right:36px;
}
.field input:focus,.field select:focus{outline:2px solid var(--trust-blue);outline-offset:1px;border-color:transparent;}

.submit-btn{
  width:100%;padding:13px;border-radius:9px;border:none;color:var(--white);
  font-weight:700;font-size:.92rem;cursor:pointer;margin-top:4px;transition:background .15s ease;
}
.submit-btn.neutral{background:var(--ink);}
.submit-btn.neutral:hover{background:#1e2c47;}
.submit-btn.role-buyer{background:var(--mint-bright);}
.submit-btn.role-buyer:hover{background:var(--mint);}
.submit-btn.role-seller{background:var(--trust-blue);}
.submit-btn.role-seller:hover{background:var(--trust-blue-dark);}
.submit-btn:disabled{opacity:.6;cursor:not-allowed;}

.switch-note{margin-top:22px;text-align:center;font-size:.86rem;color:var(--slate-soft);}
.link-btn{
  background:none;border:none;color:var(--trust-blue);font-weight:600;cursor:pointer;
  font-size:inherit;font-family:inherit;text-decoration:underline;text-underline-offset:2px;padding:0;
}

a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible{
  outline:2px solid var(--trust-blue);outline-offset:2px;border-radius:6px;
}
@media (prefers-reduced-motion:reduce){*{transition:none !important;}}

@media (max-width:900px){
  .auth-shell{grid-template-columns:1fr;}
  .brand-panel{padding:36px 28px;min-height:360px;}
  .copy-slide h1{font-size:1.6rem;}
  .auth-panel{padding:36px 24px 56px;}
}
@media (max-width:420px){
  .auth-card{padding:26px 22px;}
}
</style>