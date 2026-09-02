<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api.js'; 

const router = useRouter();
const email = ref('');
const password = ref('');
const role = ref('buyer'); // Defaults to buyer selection choice
const successMessage = ref('');
const errorMessage = ref('');

const handleRegister = async () => {
  successMessage.value = '';
  errorMessage.value = '';

  try {
    const response = await api.post('/auth/register', {
      email: email.value,
      password: password.value,
      role: role.value // Send the role to backend!
    });
    
    successMessage.value = response.data.message + " Redirecting to login...";
    
    // Smoothly send them to the login screen after 2 seconds
    setTimeout(() => {
      router.push('/login');
    }, 2000);

  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Registration failed.';
  }
};
</script>

<template>
  <div class="auth-box">
    <h2>Create StoreLink Account</h2>
    
    <div class="input-group">
      <label>Email Address</label>
      <input type="email" v-model="email" placeholder="name@example.com" />
    </div>

    <div class="input-group">
      <label>Password</label>
      <input type="password" v-model="password" placeholder="••••••••" />
    </div>

    <!-- NEW ROLE DROPDOWN FIELD -->
    <div class="input-group">
      <label>Account Type</label>
      <select v-model="role" class="role-select">
        <option value="buyer">I am a Buyer (Shop Owner)</option>
        <option value="seller">I am a Seller (Factory Supplier)</option>
      </select>
    </div>

    <button @click="handleRegister">Sign Up</button>

    <p v-if="successMessage" class="success">{{ successMessage }}</p>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <p class="switch-text">
      Already have an account? <router-link to="/login">Login here</router-link>
    </p>
  </div>
</template>

<style scoped>
/* Reuses existing styles, adding class helper styling for select layout */
.auth-box { max-width: 400px; margin: 50px auto; padding: 30px; border: 1px solid #ddd; border-radius: 8px; font-family: sans-serif; }
.input-group { margin-bottom: 15px; }
label { display: block; margin-bottom: 5px; font-weight: bold; }
input, .role-select { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; background: white;}
button { width: 100%; padding: 12px; background-color: #42b883; color: white; border: none; border-radius: 4px; font-size: 16px; cursor: pointer; margin-top: 10px;}
button:hover { background-color: #33a06f; }
.success { color: green; font-weight: bold; margin-top: 15px; }
.error { color: red; font-weight: bold; margin-top: 15px; }
.switch-text { margin-top: 15px; text-align: center; font-size: 14px; }
</style>
