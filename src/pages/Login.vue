<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
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

const isLoading = ref(false)

// --- Toast system ---
const toasts = ref([])
let toastIdCounter = 0

const addToast = (message, type = 'success') => {
  const id = toastIdCounter++
  const toast = { id, message, type, visible: true }
  toasts.value.push(toast)

  // Auto‑remove after 4 seconds
  setTimeout(() => {
    removeToast(id)
  }, 4000)
}

const removeToast = (id) => {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index !== -1) {
    toasts.value.splice(index, 1)
  }
}

// --- Active tab ---
const activeTab = ref('login')

// --- Carousel slides (LEFT PANEL PHOTOS) ---
// Swap these URLs for your own photos whenever you're ready.
// Keep the `key` values ('pending' | 'priced' | 'locked') as they drive the copy + tint.
const stageSlides = [
  {
    key: 'pending',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1400&q=80',
    alt: 'A product photographed for sale',
  },
  {
    key: 'priced',
    image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1400&q=80',
    alt: 'Two people comparing offers at a table',
  },
  {
    key: 'locked',
    image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1400&q=80',
    alt: 'A handshake closing a deal',
  },
]

const stages = stageSlides.map(s => s.key)
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
  isLoading.value = true

  try {
    const response = await api.post('/auth/login', {
      email: email.value,
      password: password.value,
    })

    const { token, role } = response.data
    localStorage.setItem('token', token)
    localStorage.setItem('role', role)

    addToast('Login successful! Redirecting...', 'success')

    // Redirect after a short delay
    setTimeout(() => {
      router.push(role === 'seller' ? '/seller-dashboard' : '/buyer-dashboard')
    }, 1200)
  } catch (error) {
    const msg = error.response?.data?.message || 'Login failed.'
    addToast(msg, 'error')
  } finally {
    isLoading.value = false
  }
}

const handleRegister = async () => {
  isLoading.value = true

  // Basic validation
  if (!signupEmail.value || !signupPassword.value) {
    addToast('Please fill in all fields.', 'error')
    isLoading.value = false
    return
  }

  try {
    const response = await api.post('/auth/register', {
      email: signupEmail.value,
      password: signupPassword.value,
      role: signupRole.value,
    })

    addToast(response.data.message + ' Redirecting to login...', 'success')
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (error) {
    const msg = error.response?.data?.message || 'Registration failed.'
    addToast(msg, 'error')
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
  // Handle ?role=... query param
  const roleParam = route.query.role
  if (roleParam === 'buyer' || roleParam === 'seller') {
    activeTab.value = 'signup'
    signupRole.value = roleParam
  }

  showStage(0)
  startCycle()
})

onBeforeUnmount(() => {
  if (cycleTimer) clearInterval(cycleTimer)
})
</script>

<template>
  <div class="auth-shell">
    <!-- Toast Container (top‑right) -->
    <div class="toast-container">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="toast.type"
        @click="removeToast(toast.id)"
      >
        {{ toast.message }}
      </div>
    </div>

    <!-- Brand Panel -->
    <aside class="brand-panel">
      <div class="scene-bg">
        <div
          v-for="(slide, index) in stageSlides"
          :key="slide.key"
          class="scene"
          :class="{ active: currentStageIndex === index }"
          :data-stage="slide.key"
        >
          <img
            class="scene-img"
            :src="slide.image"
            :alt="slide.alt"
            :loading="index === 0 ? 'eager' : 'lazy'"
            decoding="async"
          />
          <div class="scene-tint"></div>
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
.auth-shell{display:grid;grid-template-columns:1fr 1fr;min-height:100vh;}
.brand-panel{
  position:relative;overflow:hidden;
  background:var(--ink);color:var(--white);
  padding:48px;display:flex;flex-direction:column;justify-content:space-between;
}

/* ---------- Photo scenes ---------- */
.scene-bg{position:absolute;inset:0;z-index:0;background:#0f172a;}
.scene{
  position:absolute;inset:0;opacity:0;
  transition:opacity 1.2s ease;
  background:#0f172a;
}
.scene.active{opacity:1;}

.scene-img{
  position:absolute;inset:0;
  width:100%;height:100%;
  object-fit:cover;object-position:center;
  transform:scale(1.04);
  transition:transform 7s ease-out;
  will-change:transform;
}
/* slow Ken Burns drift while a slide is active */
.scene.active .scene-img{transform:scale(1.14);}

/* Colour tint per stage — keeps the brand palette over real photography */
.scene-tint{position:absolute;inset:0;pointer-events:none;}
.scene[data-stage="pending"] .scene-tint{
  background:linear-gradient(165deg, rgba(15,23,42,.35) 0%, rgba(51,65,85,.55) 100%);
}
.scene[data-stage="priced"] .scene-tint{
  background:linear-gradient(165deg, rgba(29,78,216,.45) 0%, rgba(15,23,42,.62) 100%);
}
.scene[data-stage="locked"] .scene-tint{
  background:linear-gradient(165deg, rgba(16,185,129,.40) 0%, rgba(15,23,42,.66) 100%);
}

/* Dark gradient for text legibility */
.brand-overlay{
  position:absolute;inset:0;z-index:1;
  background:linear-gradient(180deg, rgba(15,23,42,.35) 0%, rgba(15,23,42,.55) 55%, rgba(15,23,42,.90) 100%);
}

.nav-logo{position:relative;z-index:2;font-weight:800;font-size:1.2rem;letter-spacing:-0.02em;color:var(--white);text-decoration:none;}
.nav-logo b{color:#6ee7b7;}
.brand-copy{position:relative;z-index:2;max-width:420px;}
.eyebrow{
  display:inline-flex;align-items:center;gap:8px;
  font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:.7rem;font-weight:600;letter-spacing:.07em;
  background:rgba(255,255,255,.08);
  padding:8px 13px;border-radius:20px;margin-bottom:22px;
  backdrop-filter:blur(6px);
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
@media (prefers-reduced-motion:reduce){
  *{transition:none !important;}
  .scene-img{transform:none !important;}
}
@media (max-width:900px){
  .auth-shell{grid-template-columns:1fr;}
  .brand-panel{padding:36px 28px;min-height:360px;}
  .copy-slide h1{font-size:1.6rem;}
  .auth-panel{padding:36px 24px 56px;}
}
@media (max-width:420px){
  .auth-card{padding:26px 22px;}
}

/* ---------- Toast styles ---------- */
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 360px;
  width: 100%;
  pointer-events: none;
}

.toast {
  pointer-events: auto;
  padding: 14px 20px;
  border-radius: 10px;
  color: #fff;
  font-weight: 600;
  font-size: .95rem;
  box-shadow: 0 8px 24px rgba(0,0,0,.15);
  cursor: pointer;
  transition: transform 0.25s ease, opacity 0.25s ease;
  animation: slideIn 0.3s ease forwards;
}

.toast.success {
  background: #10b981;
}

.toast.error {
  background: #ef4444;
}

.toast:hover {
  opacity: 0.9;
  transform: scale(1.02);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(40px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>