import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    timeout: 15000,
});

// ─── Menu ───
export const getCategories = () => api.get('/categories').then(r => r.data.data);
export const getPopularItems = () => api.get('/items/popular').then(r => r.data.data);
export const searchItems = (q) => api.get('/items/search', { params: { q } }).then(r => r.data.data);
export const getItem = (id) => api.get(`/items/${id}`).then(r => r.data.data);

// ─── Offices ───
export const getOffices = () => api.get('/offices').then(r => r.data.data);

// ─── Promo ───
export const validatePromo = (code, subtotal) =>
    api.post('/promo/validate', { code, subtotal }).then(r => r.data.data);

// ─── Orders ───
export const createOrder = (data) => api.post('/orders', data).then(r => r.data.data);
export const getOrderStatus = (id) => api.get(`/orders/${id}/status`).then(r => r.data.data);
export const getOrderHistory = (telegramId) => api.get(`/orders/history/${telegramId}`).then(r => r.data.data);

// ─── Users ───
export const getUser = (telegramId) => api.get(`/users/${telegramId}`).then(r => r.data.data);
export const saveUser = (data) => api.post('/users', data).then(r => r.data.data);

// ─── Settings ───
export const getRestaurantSettings = () => api.get('/settings').then(r => r.data.data);

// ─── Favorites ───
export const getFavorites = (telegramId) => api.get(`/favorites/${telegramId}`).then(r => r.data.data);
export const toggleFavorite = (telegram_id, item_id) => api.post('/favorites', { telegram_id, item_id }).then(r => r.data.data);

// ─── Reviews ───
export const submitReview = (data) => api.post('/reviews', data).then(r => r.data.data);
export const getReview = (orderId) => api.get(`/reviews/${orderId}`).then(r => r.data.data);

export default api;