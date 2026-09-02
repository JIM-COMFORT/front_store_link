import { createRouter, createWebHistory } from 'vue-router';
import Login from '../pages/Login.vue';
import Register from '../pages/Register.vue';
import BuyerDashboard from '../pages/buyerDashboard.vue';
import SellerDashboard from '../pages/sellerDashboard.vue';

const routes = [
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  { 
    path: '/buyer-dashboard', 
    name: 'BuyerDashboard', 
    component: BuyerDashboard,
    meta: { requiresAuth: true, role: 'buyer' } 
  },
  { 
    path: '/seller-dashboard', 
    name: 'SellerDashboard', 
    component: SellerDashboard,
    meta: { requiresAuth: true, role: 'seller' } 
  },
  // If user goes to a random URL, send them to login
  { path: '/:pathMatch(.*)*', redirect: '/login' }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// ROUTE SECURITY GUARD
// Change your old router.beforeEach guard to use this clean modern layout:
router.beforeEach((to) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  // If page requires auth and user is missing a token, go to login
  if (to.meta.requiresAuth && !token) {
    return '/login'; 
  }

  // If user attempts to access the wrong role dashboard, cross-route them
  if (to.meta.role && to.meta.role !== userRole) {
    return userRole === 'buyer' ? '/buyer-dashboard' : '/seller-dashboard';
  }
  
  // Return true or nothing to allow normal navigation mapping
  return true; 
});


export default router;
