<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <h2>Buyer Dashboard (Shop Interface)</h2>
      <button @click="handleLogout" class="logout-btn">Log Out</button>
    </header>

    <!-- Create New Order Section -->
    <section class="form-section">
      <h3>Submit New Order Request</h3>
      <form @submit.prevent="submitOrder">
        <div class="form-group">
          <label>Item Name</label>
          <input type="text" v-model="form.itemName" placeholder="e.g., Red Cotton Hoodies" required />
        </div>
        <div class="form-group">
          <label>Quantity</label>
          <input type="number" v-model.number="form.quantity" min="1" required />
        </div>
        <button type="submit" class="submit-btn">Send Order Request</button>
      </form>
    </section>

    <!-- Existing Orders Section -->
    <section class="orders-section">
      <h3>Your Orders</h3>
      <p v-if="orders.length === 0" class="empty-state">You have not submitted any orders yet.</p>
      
      <div v-else class="order-list">
        <div v-for="order in orders" :key="order._id" class="order-card" :class="order.status">
          <div class="order-info">
            <h4>{{ order.itemName }}</h4>
            <p><strong>Quantity:</strong> {{ order.quantity }} units</p>
            <p><strong>Price Quote:</strong> {{ order.price > 0 ? '$' + order.price : 'Waiting for Seller...' }}</p>
            <p><strong>Status:</strong> <span class="status-badge">{{ order.status.toUpperCase() }}</span></p>
          </div>

          <div class="order-actions">
            <!-- Accept/Lock Button: Only visible if a seller added a price -->
            <button 
              v-if="order.status === 'priced'" 
              @click="lockOrder(order._id)" 
              class="lock-btn"
            >
              Accept Price & Lock
            </button>

            <!-- Delete Button: Only visible if the order is still pending -->
            <button 
              v-if="order.status === 'pending'" 
              @click="deleteOrder(order._id)" 
              class="delete-btn"
            >
              Cancel Order
            </button>
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
const form = ref({ itemName: '', quantity: 1 });

// Read: Fetch only this buyer's orders
const fetchOrders = async () => {
  try {
    const response = await api.get('/orders');
    orders.value = response.data;
  } catch (error) {
    alert('Error fetching your orders.');
  }
};

// Create: Submit a new order to the backend
const submitOrder = async () => {
  try {
    await api.post('/orders', form.value);
    form.value = { itemName: '', quantity: 1 }; // Clear the form
    await fetchOrders(); // Refresh the list
  } catch (error) {
    alert(error.response?.data?.message || 'Failed to submit order.');
  }
};

// Update: Change status to 'locked'
const lockOrder = async (orderId) => {
  if (!confirm('Are you sure you want to accept this price and lock the order?')) return;
  try {
    await api.put(`/orders/${orderId}`, { status: 'locked' });
    await fetchOrders();
  } catch (error) {
    alert(error.response?.data?.message || 'Failed to lock order.');
  }
};

// Delete: Remove order completely
const deleteOrder = async (orderId) => {
  if (!confirm('Are you sure you want to cancel this order request?')) return;
  try {
    await api.delete(`/orders/${orderId}`);
    await fetchOrders();
  } catch (error) {
    alert(error.response?.data?.message || 'Failed to cancel order.');
  }
};

const handleLogout = () => {
  localStorage.clear();
  router.push('/login');
};

onMounted(fetchOrders);
</script>

<style scoped>
.dashboard-container { max-width: 800px; margin: 30px auto; padding: 20px; font-family: sans-serif; }
.dashboard-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 20px; padding-bottom: 10px; margin-bottom: 30px; border-bottom: 2px solid #eee; }
.logout-btn { padding: 8px 15px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; }
.form-section { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 30px; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
.form-group input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
.submit-btn { padding: 10px 20px; background: #42b883; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
.empty-state { text-align: center; color: #777; margin: 40px 0; }
.order-card { background: white; padding: 20px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; border-left: 5px solid #ccc; }
.order-card.pending { border-left-color: #f39c12; }
.order-card.priced { border-left-color: #3498db; }
.order-card.locked { border-left-color: #2ecc71; background: #fafffa; }
.order-info h4 { margin: 0 0 10px 0; font-size: 18px; }
.status-badge { font-weight: bold; font-size: 12px; padding: 2px 6px; background: #eee; border-radius: 4px; }
.order-actions button { padding: 8px 15px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
.lock-btn { background: #2ecc71; color: white; margin-right: 10px; }
.delete-btn { background: #eee; color: #333; }
.delete-btn:hover { background: #dcdcdc; }
</style>
