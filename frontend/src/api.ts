import axios from 'axios';
import type { ChatMessage, SimulationResults, PhotoVerification } from './types';

const API_BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const profileAPI = {
  create: async (profileData: any) => {
    const response = await api.post('/profile', profileData);
    return response.data;
  },

  get: async () => {
    const response = await api.get('/profile');
    return response.data;
  },
};

export const photoAPI = {
  upload: async (files: FileList) => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('photos', file);
    });

    const response = await api.post('/photos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getVerification: async (): Promise<{ success: boolean; verification: PhotoVerification }> => {
    const response = await api.get('/photos/verification');
    return response.data;
  },
};

export const chatAPI = {
  getHistory: async (): Promise<{ success: boolean; messages: ChatMessage[] }> => {
    const response = await api.get('/chat/history');
    return response.data;
  },

  sendMessage: async (content: string): Promise<{ success: boolean; message: ChatMessage }> => {
    const response = await api.post('/chat/message', { content });
    return response.data;
  },
};

export const simulationAPI = {
  run: async (): Promise<{ success: boolean; results: SimulationResults; message: ChatMessage }> => {
    const response = await api.post('/simulations/run');
    return response.data;
  },

  getResults: async (): Promise<{ success: boolean; results: SimulationResults }> => {
    const response = await api.get('/simulations/results');
    return response.data;
  },
};

export default api;
