// src/lib/api/apiClient.ts
import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from "axios";
import { API_BASE_URL as ENV_API_BASE_URL } from "../../env/env";

const DEFAULT_TIMEOUT = 30000;
const MAX_RETRIES = 1;

// API Gateway base URL (use .env / build-time value — no fallback)
const API_BASE_URL = ENV_API_BASE_URL;

// Define all available endpoints
export const ENDPOINTS = {
  // Form endpoints
  FORMS: {
    SUBSCRIBER: "/forms/subscriber",
    CONTACT: "/forms/contact",
  },
} as const;

// API Client setup
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for handling retries
let retries = 0;
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only retry if we haven't reached MAX_RETRIES
    if (retries < MAX_RETRIES && error.response?.status >= 500) {
      retries++;
      // Exponential backoff
      const delay = 1000 * Math.pow(2, retries - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return apiClient(originalRequest);
    }

    // Reset retries for next request
    retries = 0;

    return Promise.reject(error);
  }
);

// Helper functions for common API operations
export const api = {
  /**
   * Send a POST request to the specified endpoint
   * @param endpoint The API endpoint
   * @param data The request data
   * @returns Promise resolving to the API response
   */
  post: async <TResponse = any, TData = any>(
    endpoint: string,
    data: TData,
    config?: AxiosRequestConfig<TData>
  ): Promise<AxiosResponse<TResponse>> => {
    return apiClient.post<TResponse>(endpoint, data, config);
  },

  /**
   * Send a GET request to the specified endpoint
   * @param endpoint The API endpoint
   * @param params Optional query parameters
   * @returns Promise resolving to the API response
   */
  get: async <TResponse = any>(
    endpoint: string,
    params?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<TResponse>> => {
    return apiClient.get<TResponse>(endpoint, { ...(config ?? {}), params });
  },
};

export default apiClient;
