import apiClient from './client.js';

export const signup = (data) => apiClient.post('/auth/signup', data);
export const login = (data) => apiClient.post('/auth/login', data);
