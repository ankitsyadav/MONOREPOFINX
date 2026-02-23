import apiClient from './client.js';

export const getCredential = () => apiClient.get('/credentials');
export const upsertCredential = (data) => apiClient.post('/credentials', data);
