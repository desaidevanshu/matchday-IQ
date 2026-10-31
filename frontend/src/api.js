import axios from 'axios';

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD
    ? 'https://matchday-iq-dckp.vercel.app/api'
    : '/api');

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 18000,
});

export async function fetchMatches() {
  const { data } = await api.get('/matches');
  return data;
}

export async function fetchMatchDetail(id) {
  const { data } = await api.get(`/match/${id}`);
  return data;
}

export async function fetchAnalysis(id) {
  const { data } = await api.get(`/analysis/${id}`);
  return data;
}

export async function fetchMatchmate(payload) {
  const { data } = await api.post('/matchmate', payload);
  return data;
}

export async function fetchOverthink(payload) {
  const { data } = await api.post('/overthink', payload);
  return data;
}

export async function fetchTactical(payload) {
  const { data } = await api.post('/tactical', payload);
  return data;
}

export async function fetchReport(payload) {
  const { data } = await api.post('/report', payload);
  return data;
}

export async function fetchSimulate(payload) {
  const { data } = await api.post('/simulate', payload);
  return data;
}

export async function fetchHealth() {
  const { data } = await api.get('/health');
  return data;
}
