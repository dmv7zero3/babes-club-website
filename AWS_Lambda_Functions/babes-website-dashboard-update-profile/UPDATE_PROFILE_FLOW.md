# Babes Club Update Profile Flow (2025)

## Overview

The Babes Club profile update flow allows authenticated users to update their profile information—including email changes—via a secure, atomic, and CORS-compliant API. The backend is powered by an AWS Lambda function behind API Gateway, with DynamoDB for storage and JWT-based authentication.

---

## Key Features

- **Atomic profile updates**: All allowed fields (displayName, phone, shippingAddress, dashboardSettings, preferredWallet) can be updated in one request.
- **Email change support**: Changing the email triggers a uniqueness check, updates lookup records, and issues new tokens.
- **JWT session refresh**: When email changes, new access and refresh tokens are issued and returned to the frontend.
- **CORS compliance**: All responses include proper CORS headers for browser compatibility.
- **Robust error handling**: All errors are logged and returned in a consistent JSON format.
- **Frontend session update**: The frontend updates session tokens and user info atomically when email changes.

---

## Backend: Lambda Handler Contract

- **Endpoint**: `/dashboard/update-profile` (POST)
- **Auth**: JWT authorizer (userId in request context)
- **Request Body**:
  ```json
  {
    "displayName": "Jane Doe",          // optional
    "email": "newemail@example.com",    // optional (triggers email change)
    "shippingAddress": { ... },          // optional
    "dashboardSettings": { ... },        // optional
    "phone": "+1234567890",            // optional
    "preferredWallet": "0x..."          // optional
  }
  ```
- **Response (normal update)**:
  ```json
  {
    "profile": { ... }
  }
  ```
- **Response (email changed)**:
  ```json
  {
    "profile": { ... },
    "accessToken": "new-jwt",
    "refreshToken": "new-refresh-token",
    "expiresAt": 1234567890,
    "emailChanged": true
  }
  ```
- **Response (token issuance error)**:
  ```json
  {
    "profile": { ... },
    "emailChanged": true,
    "tokenError": "Profile updated but failed to issue new tokens. Please log out and log back in."
  }
  ```

---

## Backend: Email Change Logic

1. **Uniqueness Check**: When a new email is provided, the Lambda checks if the email is already in use (via DynamoDB lookup record).
2. **Atomic Transaction**: If available, the Lambda updates the user's profile, creates a new EMAIL# lookup record, and deletes the old one in a single DynamoDB transaction.
3. **Token Issuance**: If the email changed, new JWT access and refresh tokens are generated and returned in the response.
4. **Error Handling**: If the email is already in use, a 409 Conflict is returned. If token issuance fails, a `tokenError` is included in the response.

---

## Frontend: Integration Steps

### 1. API Call

Use the `updateProfile` function to POST profile changes:

```typescript
const result = await updateProfile(token, updates);
```

### 2. Session Update

If the response includes new tokens (after email change), update the session:

```typescript
if (
  result.emailChanged &&
  result.accessToken &&
  result.refreshToken &&
  result.expiresAt
) {
  updateSessionTokens(
    result.accessToken,
    result.refreshToken,
    result.expiresAt,
    {
      email: result.profile.email,
      displayName: result.profile.displayName,
    }
  );
}
```

If `tokenError` is present, prompt the user to re-login.

### 3. UI Update

Update local state/context with the new profile data. Example:

```typescript
setSession((prev) => ({
  ...prev,
  token: result.accessToken ?? prev.token,
  refreshToken: result.refreshToken ?? prev.refreshToken,
  expiresAt: result.expiresAt ?? prev.expiresAt,
  user: {
    ...prev.user,
    email: result.profile.email,
    displayName: result.profile.displayName,
  },
}));
```

### 4. Example React Hook

```typescript
const { handleUpdateProfile, isLoading, error } = useProfileUpdate();

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const result = await handleUpdateProfile(formData);
  // ...handle success or error
};
```

---

## Error Handling & Edge Cases

- **Email already in use**: Returns 409 Conflict, frontend should show a user-friendly error.
- **Token issuance fails**: Returns `tokenError`, frontend should prompt user to log out and log back in.
- **No fields to update**: Returns 400 Bad Request.
- **Missing/expired token**: Returns 401 Unauthorized.

---

## Testing & Verification

- Change email and verify new tokens are received and session is updated.
- Check that only the new EMAIL# lookup exists in DynamoDB.
- Ensure the old EMAIL# record is deleted.
- Confirm the user remains authenticated after email change.
- Validate CORS headers are present in all responses.
- Monitor CloudWatch logs for full execution trace.

---

## Environment Variables

- `COMMERCE_TABLE`: DynamoDB table name
- `CORS_ALLOW_ORIGIN`: Allowed CORS origins
- `JWT_SECRET`: JWT signing secret
- `REFRESH_SECRET`: Refresh token secret

---

## Reference Files

- `lambda_function.py`: Main Lambda code
- `updateProfile.ts`: Frontend API function
- `session.ts`: Session management helpers
- `AuthContext.tsx`: React context and hooks
- `frontend_integration_guide.ts.md`: Full integration example

---

## Summary

The Babes Club update profile flow is now robust, secure, and user-friendly. Email changes are atomic, session tokens are refreshed, and the frontend is fully integrated to handle all edge cases. For full code examples, see the integration guide and updated source files.
