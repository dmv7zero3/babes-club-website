// src/lib/api/updateProfile.ts
import apiClient from "./apiClient";
import { updateSessionTokens } from "@/lib/auth/session";

export interface UpdateProfileResponse {
  profile: {
    userId: string;
    email: string;
    emailLower: string;
    displayName: string;
    phone?: string;
    shippingAddress?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    dashboardSettings?: {
      showOrderHistory: boolean;
      showNftHoldings: boolean;
      emailNotifications: boolean;
    };
    preferredWallet?: string;
    updatedAt: string;
    emailChangedAt?: string;
  };
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  emailChanged?: boolean;
  tokenError?: string;
}

export const updateProfile = async (
  token: string,
  updates: {
    displayName?: string;
    email?: string;
    phone?: string;
    shippingAddress?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    dashboardSettings?: Record<string, boolean>;
    preferredWallet?: string;
  }
): Promise<UpdateProfileResponse> => {
  const response = await apiClient.post<UpdateProfileResponse>(
    "/dashboard/update-profile",
    updates,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = response.data;

  if (
    data.emailChanged &&
    data.accessToken &&
    data.refreshToken &&
    data.expiresAt
  ) {
    updateSessionTokens(data.accessToken, data.refreshToken, data.expiresAt, {
      email: data.profile.email,
      displayName: data.profile.displayName,
    });
  } else if (data.emailChanged && data.tokenError) {
    // Token issuance failed - user needs to re-login
    console.warn("Email changed but token refresh failed:", data.tokenError);
    // Optionally show a toast/alert to the user
  }

  return data;
};
