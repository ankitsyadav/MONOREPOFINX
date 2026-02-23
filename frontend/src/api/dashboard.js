import apiClient from './client.js';

export const getDashboardStats = () => apiClient.get('/dashboard/stats');
