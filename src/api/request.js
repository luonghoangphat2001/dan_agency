import axios from 'axios';
import { translate } from '@/lang';

function resolveApiBase() {
  const rawApiUrl = import.meta.env.VITE_API_URL;
  if (!rawApiUrl || typeof rawApiUrl !== 'string' || rawApiUrl.trim().length === 0) {
    throw new Error('[dan-learning] Missing required environment variable: VITE_API_URL');
  }
  return rawApiUrl.trim();
}

export const API_BASE = resolveApiBase();

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

const PUBLIC_PATHS = ['/login', '/logout'];

api.interceptors.request.use(
  (requestConfig) => {
    const authenticationToken = localStorage.getItem('auth_token');
    const isPublicEndpoint = PUBLIC_PATHS.some((publicPath) => requestConfig.url?.startsWith(publicPath));
    if (!authenticationToken && !isPublicEndpoint) {
      return Promise.reject(new Error('Unauthorized'));
    }
    if (authenticationToken) {
      requestConfig.headers.Authorization = `Bearer ${authenticationToken}`;
    }
    return requestConfig;
  },
  (requestError) => Promise.reject(requestError)
);

api.interceptors.response.use(
  (responsePayload) => responsePayload.data,
  (responseError) => {
    if (responseError?.response?.status === 401) {
      localStorage.removeItem('auth_token');
    }
    let errorFeedbackMessage = translate('common.status.network_error');
    if (responseError?.response?.data?.error) {
      errorFeedbackMessage = responseError.response.data.error;
    }
    return Promise.reject(new Error(errorFeedbackMessage));
  }
);
