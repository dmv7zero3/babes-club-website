/**
 * Frontend Integration Guide: Email Change with Token Refresh
 * ============================================================
 * 
 * This file contains the code changes needed to handle the new Lambda response
 * format when email changes trigger new token issuance.
 * 
 * Files to update:
 * 1. api.ts (or wherever updateProfile is defined)
 * 2. session.ts (add updateSessionTokens helper)
 * 3. AuthContext.tsx (handle emailChanged response)
 */

// =============================================================================
// PART 1: Update your API types (api.ts or types.ts)
// =============================================================================

/**
 * Response from the update-profile endpoint
 */
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
  // Only present when email was changed
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  emailChanged?: boolean;
  // Present if token issuance failed but profile update succeeded
  tokenError?: string;
}


// =============================================================================
// PART 2: Update session.ts - Add helper to update tokens
// =============================================================================

/**
 * Add this function to your session.ts file
 * 
 * Updates only the tokens in the session without clearing other data.
 * Used after email change when new tokens are issued.
 */
export const updateSessionTokens = (
  accessToken: string,
  refreshToken: string,
  expiresAt: number,
  updatedUser?: { email?: string; displayName?: string }
): void => {
  const existing = readStoredSession();
  if (!existing) {
    console.warn('[session.ts] Cannot update tokens - no existing session');
    return;
  }

  const updatedSession = {
    ...existing,
    token: accessToken,
    refreshToken: refreshToken,
    expiresAt: expiresAt,
    user: {
      ...existing.user,
      ...(updatedUser?.email && { email: updatedUser.email }),
      ...(updatedUser?.displayName && { displayName: updatedUser.displayName }),
    },
    storedAt: Date.now(),
  };

  // Save to sessionStorage (and localStorage if remember me was enabled)
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));
  
  // Check if localStorage also has a session (remember me)
  const localSession = localStorage.getItem(SESSION_STORAGE_KEY);
  if (localSession) {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));
  }

  console.log('[session.ts] Session tokens updated', {
    email: updatedSession.user.email,
    expiresAt: new Date(expiresAt * 1000).toISOString(),
  });
};


// =============================================================================
// PART 3: Update your updateProfile function (api.ts or wherever it lives)
// =============================================================================

import { updateSessionTokens } from './session';

/**
 * Update user profile
 * 
 * @param token - Current access token
 * @param updates - Profile fields to update
 * @returns Updated profile and optionally new tokens if email changed
 */
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
  const response = await fetch(
    `${API_BASE_URL}/dashboard/update-profile`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Update failed: ${response.status}`);
  }

  const data: UpdateProfileResponse = await response.json();

  // If email changed and new tokens were issued, update the session
  if (data.emailChanged && data.accessToken && data.refreshToken && data.expiresAt) {
    console.log('[api.ts] Email changed - updating session with new tokens');
    updateSessionTokens(
      data.accessToken,
      data.refreshToken,
      data.expiresAt,
      {
        email: data.profile.email,
        displayName: data.profile.displayName,
      }
    );
  } else if (data.emailChanged && data.tokenError) {
    // Token issuance failed - user needs to re-login
    console.warn('[api.ts] Email changed but token refresh failed:', data.tokenError);
    // You might want to show a toast/alert to the user here
  }

  return data;
};


// =============================================================================
// PART 4: Update AuthContext.tsx - Handle the response in your UI
// =============================================================================

/**
 * Example hook/function for your profile update form
 * 
 * This shows how to handle the response and update local state
 */
const useProfileUpdate = () => {
  const { session, setSession } = useAuth(); // Your auth context
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateProfile = async (updates: {
    displayName?: string;
    email?: string;
    shippingAddress?: any;
  }) => {
    if (!session?.token) {
      setError('Not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await updateProfile(session.token, updates);

      // Update local auth context with new profile data
      setSession((prev) => {
        if (!prev) return prev;
        
        return {
          ...prev,
          // If new tokens were issued, use them
          ...(result.accessToken && { token: result.accessToken }),
          ...(result.refreshToken && { refreshToken: result.refreshToken }),
          ...(result.expiresAt && { expiresAt: result.expiresAt }),
          user: {
            ...prev.user,
            email: result.profile.email,
            displayName: result.profile.displayName,
          },
        };
      });

      // Handle special cases
      if (result.emailChanged) {
        if (result.tokenError) {
          // Token refresh failed - warn user
          alert('Your email was updated, but we could not refresh your session. Please log out and log back in.');
        } else {
          // Success with new tokens
          console.log('Email updated successfully with new session tokens');
        }
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Update failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleUpdateProfile,
    isLoading,
    error,
  };
};


// =============================================================================
// PART 5: Example React Component Usage
// =============================================================================

/**
 * Example profile form component showing how to use the update
 */
const ProfileForm: React.FC = () => {
  const { session } = useAuth();
  const { handleUpdateProfile, isLoading, error } = useProfileUpdate();
  
  const [formData, setFormData] = useState({
    displayName: session?.user?.displayName || '',
    email: session?.user?.email || '',
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    try {
      const result = await handleUpdateProfile(formData);
      
      if (result.emailChanged) {
        setSuccessMessage('Profile and email updated successfully! Your session has been refreshed.');
      } else {
        setSuccessMessage('Profile updated successfully!');
      }
    } catch (err) {
      // Error is handled by the hook
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      {successMessage && <div className="success">{successMessage}</div>}
      
      <input
        type="text"
        value={formData.displayName}
        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
        placeholder="Display Name"
      />
      
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
      />
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
};


// =============================================================================
// SUMMARY OF CHANGES
// =============================================================================

/**
 * 1. Lambda returns new fields when email changes:
 *    - accessToken: New JWT with updated email
 *    - refreshToken: New refresh token
 *    - expiresAt: Token expiration timestamp
 *    - emailChanged: true (flag to indicate email was changed)
 *    - tokenError: (optional) Error message if token issuance failed
 * 
 * 2. Frontend should:
 *    a. Check if `emailChanged` is true in the response
 *    b. If `accessToken` and `refreshToken` are present, update the session
 *    c. If `tokenError` is present, warn the user to re-login
 *    d. Update the local auth context with the new profile data
 * 
 * 3. The session.ts helper `updateSessionTokens` handles:
 *    - Updating both sessionStorage and localStorage (if remember me is enabled)
 *    - Preserving other session data while updating tokens
 *    - Logging for debugging
 */

export {};
