<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api.js';

const router = useRouter();
const orders = ref([]);
const form = ref({ itemName: '', quantity: 1 });

const isLoading = ref(true);
const isSubmitting = ref(false);
const isLocking = ref(null);
const activeFilter = ref('all');

/* ---------- Toast system ---------- */
const toasts = ref([]);
let toastIdCounter = 0;

const addToast = (message, type = 'success') => {
  const id = toastIdCounter++;
  toasts.value.push({ id, message, type });
  setTimeout(() => removeToast(id), 4000);
};

const removeToast = (id) => {
  toasts.value = toasts.value.filter((t) => t.id !== id);
};

/* ---------- Derived data ---------- */
const stats = computed(() => ({
  total: orders.value.length,
  pending: orders.value.filter((o) => o.status === 'pending').length,
  priced: orders.value.filter((o) => o.status === 'priced').length,
  locked: orders.value.filter((o) => o.status === 'locked').length,
}));

const filters = computed(() => [
  { key: 'all',     label: 'All',     count: stats.value.total },
  { key: 'pending', label: 'Pending', count: stats.value.pending },
  { key: 'priced',  label: 'Priced',  count: stats.value.priced },
  { key: 'locked',  label: 'Locked',  count: stats.value.locked },
]);

const filteredOrders = computed(() => {
  if (activeFilter.value === 'all') return orders.value;
  return orders.value.filter((o) => o.status === activeFilter.value);
});

/* ---------- Helpers ---------- */
const formatPrice = (price) => {
  if (!price || Number(price) <= 0) return null;
  return `MWK ${Number(price).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const qtyLabel = (n) => `${n} ${n === 1 ? 'unit' : 'units'}`;
const initials = (name = '') => name.trim().charAt(0).toUpperCase() || '?';

/* ---------- CRUD ---------- */
const fetchOrders = async () => {
  try {
    isLoading.value = true;
    const response = await api.get('/orders');
    orders.value = response.data;
  } catch (error) {
    addToast('Error fetching your orders.', 'error');
  } finally {
    isLoading.value = false;
  }
};

const submitOrder = async () => {
  if (isSubmitting.value) return;
  if (!form.value.itemName.trim()) {
    addToast('Please enter an item name.', 'error');
    return;
  }
  if (!form.value.quantity || form.value.quantity < 1) {
    addToast('Quantity must be at least 1.', 'error');
    return;
  }

  try {
    isSubmitting.value = true;
    await api.post('/orders', form.value);
    form.value = { itemName: '', quantity: 1 };
    addToast('Order request sent! Sellers can now send quotes.', 'success');
    await fetchOrders();
    activeFilter.value = 'all';
  } catch (error) {
    addToast(error.response?.data?.message || 'Failed to submit order.', 'error');
  } finally {
    isSubmitting.value = false;
  }
};

const lockOrder = async (orderId) => {
  if (!confirm('Accept this price and lock the order? This cannot be undone.')) return;
  try {
    isLocking.value = orderId;
    await api.put(`/orders/${orderId}`, { status: 'locked' });
    addToast('Price accepted — your order is locked in.', 'success');
    await fetchOrders();
  } catch (error) {
    addToast(error.response?.data?.message || 'Failed to lock order.', 'error');
  } finally {
    isLocking.value = null;
  }
};

const deleteOrder = async (orderId) => {
  if (!confirm('Cancel this order request? This cannot be undone.')) return;
  try {
    await api.delete(`/orders/${orderId}`);
    addToast('Order request cancelled.', 'success');
    await fetchOrders();
  } catch (error) {
    addToast(error.response?.data?.message || 'Failed to cancel order.', 'error');
  }
};

const handleLogout = () => {
  localStorage.clear();
  router.push('/login');
};

onMounted(fetchOrders);
</script>

<template>
  <div class="dashboard">
    <!-- ========== TOASTS ========== -->
    <div class="toast-container">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="toast.type"
        @click="removeToast(toast.id)"
      >
        <svg v-if="toast.type === 'success'" class="toast-icon" viewBox="0 0 20 20" fill="none">
          <path d="M5 10.5l3 3 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <svg v-else class="toast-icon" viewBox="0 0 20 20" fill="none">
          <path d="M10 6v5M10 14h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2"/>
        </svg>
        <span>{{ toast.message }}</span>
      </div>
    </div>

    <!-- ========== HEADER ========== -->
    <header class="dash-header">
      <div class="header-left">
        <a class="logo" href="/">Store<b>Link</b></a>
        <span class="header-divider" aria-hidden="true"></span>
        <span class="workspace-label">Buyer Workspace</span>
      </div>
      <button class="logout-btn" type="button" @click="handleLogout">
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M12 3h4a1 1 0 011 1v12a1 1 0 01-1 1h-4M9 14l-3-4 3-4M4 10h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Log Out
      </button>
    </header>

    <main class="dash-main">
      <!-- ========== INTRO ========== -->
      <div class="page-intro">
        <p class="eyebrow">Sourcing made simple</p>
        <h1>Your Orders</h1>
        <p class="lead">Post what you need. Compare real prices. Lock in the deal.</p>
      </div>

      <!-- ========== NEW ORDER ========== -->
      <section class="card form-card">
        <header class="card-header">
          <div>
            <h3>New Order Request</h3>
            <p class="sub">Tell us what you need — it goes live to sellers instantly.</p>
          </div>
        </header>

        <form class="order-form" @submit.prevent="submitOrder">
          <div class="form-grid">
            <div class="field">
              <label for="itemName">Item Name</label>
              <input
                id="itemName"
                v-model="form.itemName"
                type="text"
                placeholder="e.g., Red Cotton Hoodies"
                required
                autocomplete="off"
              />
            </div>
            <div class="field">
              <label for="quantity">Quantity</label>
              <input
                id="quantity"
                v-model.number="form.quantity"
                type="number"
                min="1"
                required
              />
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="spinner" aria-hidden="true"></span>
              <svg v-else viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M3 10h14M13 6l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              {{ isSubmitting ? 'Sending…' : 'Send Order Request' }}
            </button>
          </div>
        </form>
      </section>

      <!-- ========== ORDERS ========== -->
      <section class="card orders-card">
        <header class="card-header orders-header">
          <div>
            <h3>Order History</h3>
            <p class="sub">{{ stats.total }} order{{ stats.total === 1 ? '' : 's' }} total</p>
          </div>

          <div class="filter-pills" role="tablist" aria-label="Filter orders by status">
            <button
              v-for="f in filters"
              :key="f.key"
              type="button"
              class="filter-pill"
              :class="{ active: activeFilter === f.key }"
              @click="activeFilter = f.key"
            >
              {{ f.label }}
              <span class="pill-count">{{ f.count }}</span>
            </button>
          </div>
        </header>

        <div v-if="isLoading" class="state-view">
          <div class="spinner large"></div>
          <p>Loading your orders…</p>
        </div>

        <div v-else-if="filteredOrders.length === 0" class="state-view empty">
          <div class="empty-icon" aria-hidden="true">
            <svg viewBox="0 0 40 40" fill="none">
              <rect x="8" y="10" width="24" height="22" rx="3" stroke="currentColor" stroke-width="1.6"/>
              <path d="M8 16h24M14 24h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
          </div>
          <h4>{{ activeFilter === 'all' ? 'No orders yet' : `No ${activeFilter} orders` }}</h4>
          <p v-if="activeFilter === 'all'">
            Submit your first order request above — it takes seconds.
          </p>
          <p v-else>Try a different filter to see other orders.</p>
        </div>

        <div v-else class="order-list">
          <article
            v-for="order in filteredOrders"
            :key="order._id"
            class="order-card"
            :class="order.status"
          >
            <div class="order-top">
              <div class="order-avatar" :class="order.status">
                {{ initials(order.itemName) }}
              </div>

              <div class="order-info">
                <h4>{{ order.itemName }}</h4>
                <div class="order-meta">
                  <span>{{ qtyLabel(order.quantity) }}</span>
                  <span class="meta-dot" aria-hidden="true"></span>
                  <span class="price" :class="{ waiting: !formatPrice(order.price) }">
                    {{ formatPrice(order.price) || 'Awaiting price' }}
                  </span>
                </div>
              </div>

              <span class="status-badge" :class="order.status">
                <span class="status-dot" aria-hidden="true"></span>
                {{ order.status.toUpperCase() }}
              </span>
            </div>

            <div class="order-stepper" aria-hidden="true">
              <span class="step done">Posted</span>
              <span class="step-line" :class="{ done: order.status !== 'pending' }"></span>
              <span class="step" :class="{ done: order.status !== 'pending' }">Priced</span>
              <span class="step-line" :class="{ done: order.status === 'locked' }"></span>
              <span class="step" :class="{ done: order.status === 'locked' }">Locked</span>
            </div>

            <div
              v-if="order.status === 'priced' || order.status === 'pending'"
              class="order-actions"
            >
              <button
                v-if="order.status === 'priced'"
                type="button"
                class="btn-primary btn-sm"
                :disabled="isLocking === order._id"
                @click="lockOrder(order._id)"
              >
                <span v-if="isLocking === order._id" class="spinner tiny" aria-hidden="true"></span>
                {{ isLocking === order._id ? 'Locking…' : 'Accept Price & Lock' }}
              </button>

              <button
                v-if="order.status === 'pending'"
                type="button"
                class="btn-ghost btn-sm"
                @click="deleteOrder(order._id)"
              >
                Cancel Order
              </button>
            </div>

            <p v-if="order.status === 'locked'" class="locked-note">
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" stroke-width="1.4"/>
                <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" stroke-width="1.4"/>
              </svg>
              Deal locked in — no further changes possible.
            </p>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
/* =========================================================
   BUYER THEME — WHITE + GREEN
   ========================================================= */
.dashboard {
  --brand: #10b981;
  --brand-dark: #059669;
  --brand-deep: #047857;
  --brand-soft: #d1fae5;
  --brand-border: #a7f3d0;
  --brand-input: #6ee7b7;
  --brand-hover: #34d399;
  --brand-tint: #f0fdf4;
  --brand-glow: rgba(16, 185, 129, 0.16);

  --ink: #0f172a;
  --white: #ffffff;
  --slate-soft: #64748b;
  --line: #e2e8f0;

  --amber: #f59e0b;
  --amber-soft: #fef3c7;

  min-height: 100vh;
  background: var(--brand-tint);
  color: var(--ink);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* =========================================================
   HEADER
   ========================================================= */
.dash-header {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: saturate(180%) blur(12px);
  -webkit-backdrop-filter: saturate(180%) blur(12px);
  border-bottom: 1.5px solid var(--brand-border);
}

.header-left { display: flex; align-items: center; gap: 16px; }

.logo {
  font-weight: 800;
  font-size: 1.15rem;
  letter-spacing: -0.02em;
  color: var(--ink);
  text-decoration: none;
}
.logo b { color: var(--brand); }

.header-divider { width: 1px; height: 20px; background: var(--brand-border); }

.workspace-label {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--brand-deep);
}

.logout-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--slate-soft);
  background: var(--white);
  border: 1.5px solid var(--line);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.logout-btn svg { width: 16px; height: 16px; }
.logout-btn:hover {
  color: #dc2626;
  border-color: #fca5a5;
  background: #fef2f2;
}

/* =========================================================
   LAYOUT
   ========================================================= */
.dash-main { max-width: 880px; margin: 0 auto; padding: 40px 24px 80px; }
.page-intro { margin-bottom: 28px; }

.eyebrow {
  display: inline-block;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--brand-deep);
  background: var(--brand-soft);
  border: 1px solid var(--brand-border);
  padding: 5px 11px;
  border-radius: 999px;
  margin-bottom: 14px;
}

.page-intro h1 {
  font-size: 1.85rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  margin: 0 0 8px;
  line-height: 1.15;
}

.page-intro .lead { color: var(--slate-soft); font-size: 0.95rem; margin: 0; }

/* =========================================================
   CARDS — high-visibility white cards with green borders
   ========================================================= */
.card {
  position: relative;
  background: var(--white);
  border: 1.5px solid var(--brand-border);
  border-radius: 16px;
  box-shadow:
    0 6px 24px -8px var(--brand-glow),
    0 1px 3px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

.form-card { padding: 30px 30px 28px; margin-bottom: 24px; }
.orders-card { padding: 30px 30px 28px; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 22px;
  flex-wrap: wrap;
}

.card-header h3 {
  font-size: 1.08rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  margin: 0 0 4px;
}

.card-header .sub { font-size: 0.85rem; color: var(--slate-soft); margin: 0; }

/* =========================================================
   FORM — highly visible green-bordered inputs
   ========================================================= */
.order-form { display: flex; flex-direction: column; gap: 18px; }

.form-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }

.field { display: flex; flex-direction: column; }

.field label {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--brand-deep);
  margin-bottom: 7px;
  letter-spacing: 0.02em;
}

.field input {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid var(--brand-input);
  border-radius: 9px;
  font-size: 0.92rem;
  color: var(--ink);
  background: var(--white);
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
  box-sizing: border-box;
}

.field input::placeholder { color: #94a3b8; }

.field input:hover { border-color: var(--brand-hover); }

.field input:focus {
  outline: none;
  border-color: var(--brand);
  background: #f6fffb;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.18);
}

.form-actions { display: flex; justify-content: flex-end; }

/* =========================================================
   BUTTONS
   ========================================================= */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 22px;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--white);
  background: linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%);
  border: none;
  border-radius: 9px;
  cursor: pointer;
  transition: filter 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
  box-shadow: 0 4px 14px -4px rgba(16, 185, 129, 0.45);
}
.btn-primary svg { width: 16px; height: 16px; }
.btn-primary:hover:not(:disabled) {
  filter: brightness(1.05);
  box-shadow: 0 6px 18px -4px rgba(16, 185, 129, 0.55);
}
.btn-primary:active:not(:disabled) { transform: translateY(1px); }
.btn-primary:disabled { opacity: 0.65; cursor: not-allowed; box-shadow: none; }

.btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--slate-soft);
  background: var(--white);
  border: 1.5px solid var(--line);
  border-radius: 9px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-ghost:hover {
  color: #dc2626;
  border-color: #fca5a5;
  background: #fef2f2;
}

.btn-sm { padding: 9px 16px; font-size: 0.82rem; }

/* =========================================================
   FILTER PILLS — green container, active = green
   ========================================================= */
.filter-pills {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  padding: 5px;
  background: var(--brand-soft);
  border: 1px solid var(--brand-border);
  border-radius: 11px;
}

.filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--brand-deep);
  background: transparent;
  border: none;
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.filter-pill:hover { background: rgba(255, 255, 255, 0.65); }

.filter-pill.active {
  background: var(--brand);
  color: var(--white);
  box-shadow: 0 2px 8px -2px rgba(16, 185, 129, 0.55);
}

.pill-count {
  font-size: 0.7rem;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(4, 120, 87, 0.12);
  color: var(--brand-deep);
}
.filter-pill.active .pill-count {
  background: rgba(255, 255, 255, 0.28);
  color: var(--white);
}

/* =========================================================
   ORDER LIST
   ========================================================= */
.order-list { display: flex; flex-direction: column; gap: 14px; }

.order-card {
  position: relative;
  padding: 18px 20px;
  background: var(--white);
  border: 1.5px solid var(--line);
  border-radius: 12px;
  box-shadow: 0 2px 8px -4px rgba(15, 23, 42, 0.08);
  transition: box-shadow 0.2s ease, transform 0.15s ease, border-color 0.2s ease;
}
.order-card:hover {
  transform: translateY(-1px);
  box-shadow:
    0 10px 26px -10px rgba(15, 23, 42, 0.16),
    0 2px 6px -2px rgba(15, 23, 42, 0.06);
}

.order-card.priced { border-color: var(--brand-border); }

.order-card.locked {
  border-color: var(--brand-border);
  background: linear-gradient(180deg, #ffffff 0%, #f6fffb 100%);
}

.order-top { display: flex; align-items: center; gap: 14px; }

.order-avatar {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.05rem;
  color: var(--slate-soft);
  background: var(--brand-tint);
  border: 1.5px solid var(--line);
}
.order-avatar.pending { color: #b45309; background: var(--amber-soft); border-color: #fde68a; }
.order-avatar.priced  { color: var(--brand-deep); background: var(--brand-soft); border-color: var(--brand-border); }
.order-avatar.locked  { color: var(--brand-deep); background: var(--brand-soft); border-color: var(--brand-border); }

.order-info { flex: 1; min-width: 0; }

.order-info h4 {
  font-size: 0.98rem;
  font-weight: 800;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.order-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.82rem;
  color: var(--slate-soft);
  flex-wrap: wrap;
}

.meta-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--line); }

.order-meta .price { font-weight: 700; color: var(--ink); }
.order-meta .price.waiting {
  font-weight: 500;
  font-style: italic;
  color: var(--slate-soft);
}

/* Status badge */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  border-radius: 999px;
  white-space: nowrap;
  border: 1px solid transparent;
}
.status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

.status-badge.pending { color: #b45309; background: var(--amber-soft); border-color: #fde68a; }
.status-badge.priced  { color: var(--brand-deep); background: var(--brand-soft); border-color: var(--brand-border); }
.status-badge.locked  { color: var(--brand-deep); background: var(--brand-soft); border-color: var(--brand-border); }

/* Stepper */
.order-stepper {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--brand-border);
}

.order-stepper .step {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #cbd5e1;
  transition: color 0.25s ease;
}
.order-stepper .step.done { color: var(--brand-deep); }

.step-line {
  flex: 1;
  height: 2px;
  background: var(--line);
  border-radius: 1px;
  transition: background 0.35s ease;
}
.step-line.done { background: var(--brand); }

/* Actions */
.order-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 14px; }

.locked-note {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 14px 0 0;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--brand-deep);
}
.locked-note svg { width: 14px; height: 14px; }

/* =========================================================
   STATES
   ========================================================= */
.state-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 56px 20px;
  text-align: center;
  color: var(--slate-soft);
}
.state-view p { margin: 0; font-size: 0.9rem; }
.state-view h4 { margin: 0; font-size: 1.05rem; font-weight: 800; color: var(--ink); }

.empty-icon {
  width: 68px;
  height: 68px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand-dark);
  background: var(--brand-soft);
  border: 1.5px solid var(--brand-border);
  margin-bottom: 4px;
}
.empty-icon svg { width: 36px; height: 36px; }

/* =========================================================
   SPINNER
   ========================================================= */
.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
.spinner.tiny { width: 12px; height: 12px; border-width: 2px; }
.spinner.large {
  width: 30px;
  height: 30px;
  border-width: 3px;
  border-color: var(--brand-border);
  border-top-color: var(--brand);
  color: var(--brand);
}
@keyframes spin { to { transform: rotate(360deg); } }

/* =========================================================
   TOASTS
   ========================================================= */
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 380px;
  width: calc(100% - 40px);
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  pointer-events: auto;
  padding: 13px 18px;
  border-radius: 10px;
  color: #fff;
  font-weight: 600;
  font-size: 0.88rem;
  box-shadow: 0 10px 30px -8px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  animation: slideIn 0.3s ease forwards;
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.toast.success { background: var(--brand); }
.toast.error   { background: #ef4444; }
.toast:hover { opacity: 0.92; transform: scale(1.01); }

.toast-icon { width: 18px; height: 18px; flex-shrink: 0; }

@keyframes slideIn {
  from { opacity: 0; transform: translateX(40px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* =========================================================
   FOCUS
   ========================================================= */
a:focus-visible,
button:focus-visible,
input:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}

/* =========================================================
   RESPONSIVE
   ========================================================= */
@media (max-width: 640px) {
  .dash-header { padding: 14px 20px; }
  .workspace-label { display: none; }
  .dash-main { padding: 28px 16px 60px; }
  .form-card, .orders-card { padding: 22px 20px; }
  .form-grid { grid-template-columns: 1fr; }
  .page-intro h1 { font-size: 1.5rem; }
  .orders-header { align-items: stretch; }
  .filter-pills { width: 100%; overflow-x: auto; }
  .order-top { flex-wrap: wrap; }
  .status-badge { margin-left: auto; }
  .order-actions { flex-direction: column-reverse; }
  .order-actions .btn-primary,
  .order-actions .btn-ghost { width: 100%; }
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
</style>