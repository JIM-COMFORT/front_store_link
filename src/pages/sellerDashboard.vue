<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <h2>Seller Dashboard (Factory Supplier Interface)</h2>
      <button @click="handleLogout" class="logout-btn">Log Out</button>
    </header>

    <section class="orders-section">
      <h3>Global Order Marketplace</h3>
      <p v-if="orders.length === 0" class="empty-state">No buyer orders are active right now.</p>
      
      <div v-else class="order-list">
        <div v-for="order in orders" :key="order._id" class="order-card" :class="order.status">
          <div class="order-info">
            <h4>{{ order.itemName }}</h4>
            <p><strong>Quantity:</strong> {{ order.quantity }} items needed</p>
            <p><strong>Current Active Quote:</strong> {{ order.price > 0 ? '$' + order.price : 'Unpriced' }}</p>
            <p><strong>Order Status:</strong> <span class="status-badge">{{ order.status.toUpperCase() }}</span></p>
          </div>

          <div class="order-actions">
            <!-- Quote pricing Form: Only if order is not locked down -->
            <div v-if="order.status !== 'locked'" class="price-input-box">
              <input 
                type="number" 
                v-model.number="priceInputs[order._id]" 
                placeholder="Enter total price ($)" 
                min="1" 
              />
              <button @click="submitQuote(order._id)" class="quote-btn">
                {{ order.status === 'priced' ? 'Update Price' : 'Submit Price' }}
              </button>
            </div>

            <!-- Static Closed state message if Locked -->
            <div v-else class="locked-msg">
              🔒 Deal Finalized
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api.js';

const router = useRouter();
const orders = ref([]);

// We track inputs for each individual order inside an object keyed by order ID
const priceInputs = ref({});

// Read: Fetch all marketplace orders globally
const fetchMarketplace = async () => {
  try {
    const response = await api.get('/orders');
    orders.value = response.data;
    
    // Prefill price input boxes with current values if they exist
    orders.value.forEach(order => {
      if(order.price > 0) {
        priceInputs.value[order._id] = order.price;
      }
    });
  } catch (error) {
    alert('Error connecting to marketplace data.');
  }
};

// Update: Add a price quote to an order
const submitQuote = async (orderId) => {
  const quoteValue = priceInputs.value[orderId];
  if (!quoteValue || quoteValue <= 0) {
    alert('Please enter a valid wholesale total amount.');
    return;
  }

  try {
    await api.put(`/orders/${orderId}`, { price: quoteValue });
    alert('Your pricing offer has been sent to the buyer!');
    await fetchMarketplace(); // Refresh layout updates
  } catch (error) {
    alert(error.response?.data?.message || 'Could not save pricing update.');
  }
};

const handleLogout = () => {
  localStorage.clear();
  router.push('/login');
};

onMounted(fetchMarketplace);
</script>

<style scoped>
.dashboard-container { max-width: 800px; margin: 30px auto; padding: 20px; font-family: sans-serif; }
.dashboard-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 20px; padding-bottom: 10px; margin-bottom: 30px; border-bottom: 2px solid #eee; }
.logout-btn { padding: 8px 15px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; }
.empty-state { text-align: center; color: #777; margin: 40px 0; }
.order-card { background: white; padding: 20px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; border-left: 5px solid #ccc; }
.order-card.pending { border-left-color: #f39c12; }
.order-card.priced { border-left-color: #3498db; }
.order-card.locked { border-left-color: #2ecc71; background: #fdfdfd; opacity: 0.85; }
.order-info h4 { margin: 0 0 10px 0; font-size: 18px; }
.status-badge { font-weight: bold; font-size: 12px; padding: 2px 6px; background: #eee; border-radius: 4px; }
.price-input-box { display: flex; gap: 10px; }
.price-input-box input { width: 140px; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
.quote-btn { padding: 8px 15px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
.quote-btn:hover { background: #2980b9; }
.locked-msg { color: #2ecc71; font-weight: bold; font-size: 14px; }
</style>
