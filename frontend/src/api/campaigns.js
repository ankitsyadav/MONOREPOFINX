import apiClient from './client.js';

export const getCampaigns = () => apiClient.get('/campaigns');
export const getCampaignById = (id) => apiClient.get(`/campaigns/${id}`);
export const createCampaign = (data) => apiClient.post('/campaigns', data);
export const deleteCampaign = (id) => apiClient.delete(`/campaigns/${id}`);
