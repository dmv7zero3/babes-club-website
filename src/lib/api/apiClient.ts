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

// Add request logging
apiClient.interceptors.request.use(
  (config) => {
    console.log("[apiClient] Request", {
      method: config.method,
      url: config.url,
      headers: config.headers,
      data: config.data,
    });
    return config;
  },
  (error) => {
    console.error("[apiClient] Request error", error);
    return Promise.reject(error);
  }
);

// Add response logging
apiClient.interceptors.response.use(
  (response) => {
    console.log("[apiClient] Response", {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  async (error) => {
    console.error("[apiClient] Response error", {
      message: error.message,
      code: error.code,
      response: error.response,
      config: error.config,
    });
    const originalRequest = error.config;

    // Network/CORS error: error.response is undefined
    if (!error.response) {
      // Only log and propagate network/CORS errors, do NOT clear session
      if (error.code === "ERR_NETWORK") {
        console.error(
          "[apiClient] Network error - possible CORS issue:",
          error.message
        );
      }
      return Promise.reject(error);
    }

    // On 401/403, try to refresh token before logging out
    if (error.response.status === 401 || error.response.status === 403) {
      try {
        const {
          getStoredRefreshToken,
          persistSession,
          readStoredSession,
          clearSession,
        } = await import("@/lib/auth/session");
        const refreshToken = getStoredRefreshToken();
        if (refreshToken) {
          // Attempt to refresh the access token
          const refreshResp = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            { refresh_token: refreshToken },
            { headers: { "Content-Type": "application/json" } }
          );
          const { access_token, user } = refreshResp.data;
          if (access_token) {
            // Update session with new access token
            const payload = await import("@/lib/auth/jwt").then((m) =>
              m.decodeJWT(access_token)
            );
            const expiresAt =
              payload?.exp || Math.floor(Date.now() / 1000) + 3600;
            persistSession(access_token, expiresAt, user, true, refreshToken);
            // Retry the original request with new token
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers["Authorization"] = `Bearer ${access_token}`;
            return apiClient(originalRequest);
          }
        }
        // If refresh fails, clear session and log out
        clearSession();
      } catch (e) {
        console.error("[apiClient] Token refresh failed, clearing session", e);
        const { clearSession } = await import("@/lib/auth/session");
        clearSession();
      }
    }

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
