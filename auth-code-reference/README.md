# 🎀 Babes Club Authentication System

A complete, production-ready JWT authentication system for The Babes Club ecommerce website. Built with React, TypeScript, and designed to integrate seamlessly with the existing AWS Lambda backend.

## ✨ Features

- **Pure JWT Authentication** - No refresh tokens, clean token-based auth
- **Automatic Token Management** - Expiration checking, auto-logout on expiry
- **Session Persistence** - Optional "remember me" with localStorage
- **Protected Routes** - Easy route guarding with role-based access
- **Polished UI Components** - Branded login/signup forms with validation
- **TypeScript First** - Full type safety throughout
- **Zero Dependencies** - Only requires React and axios

## 📁 Project Structure

```
src/
├── lib/
│   ├── auth/
│   │   ├── index.ts          # Main exports
│   │   ├── AuthContext.tsx   # React context provider
│   │   ├── api.ts            # API client functions
│   │   ├── session.ts        # Session storage utilities
│   │   └── jwt.ts            # JWT decode/validation helpers
│   └── types/
│       └── auth.ts           # TypeScript type definitions
├── components/
│   ├── index.ts              # Component exports
│   ├── LoginForm.tsx         # Branded login form
│   ├── SignupForm.tsx        # Branded signup form
│   ├── AuthPage.tsx          # Combined auth page
│   └── ProtectedRoute.tsx    # Route guards
└── App.example.tsx           # Integration example
```

## 🚀 Quick Start

### 1. Installation

Copy the auth files to your project:

```bash
# Copy lib/auth to your project
cp -r src/lib/auth your-project/src/lib/

# Copy components
cp -r src/components your-project/src/components/auth/
```

### 2. Environment Setup

Create or update your `.env` file:

```env
VITE_API_BASE_URL=https://api.thebabesclub.com
```

### 3. Wrap Your App

```tsx
// src/main.tsx or src/App.tsx
import { AuthProvider } from './lib/auth';

function App() {
  return (
    <AuthProvider>
      <YourApp />
    </AuthProvider>
  );
}
```

### 4. Use the Hook

```tsx
import { useAuth } from './lib/auth';

function MyComponent() {
  const { user, isAuthenticated, login, logout, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <button onClick={() => login('user@example.com', 'password')}>
        Login
      </button>
    );
  }

  return (
    <div>
      Welcome, {user.displayName}!
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## 🔐 Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   User      │────▶│  Frontend   │────▶│  Backend    │
│  (Browser)  │◀────│  (React)    │◀────│  (Lambda)   │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │
      │  1. Enter creds   │                   │
      │──────────────────▶│                   │
      │                   │  2. POST /login   │
      │                   │──────────────────▶│
      │                   │                   │  3. Validate
      │                   │                   │     & sign JWT
      │                   │  4. Return JWT    │
      │                   │◀──────────────────│
      │                   │                   │
      │  5. Store token   │                   │
      │  (sessionStorage) │                   │
      │                   │                   │
      │  6. Redirect to   │                   │
      │     dashboard     │                   │
      │◀──────────────────│                   │
```

## 📖 API Reference

### AuthProvider

Wrap your app to provide authentication context.

```tsx
<AuthProvider
  onAuthChange={(authenticated) => {
    console.log('Auth changed:', authenticated);
  }}
>
  {children}
</AuthProvider>
```

### useAuth Hook

Access authentication state and actions.

```tsx
const {
  // State
  status,        // 'idle' | 'loading' | 'authenticated' | 'unauthenticated'
  user,          // AuthUser | null
  token,         // string | null
  error,         // Error | null
  
  // Computed
  isAuthenticated,  // boolean
  isLoading,        // boolean
  
  // Actions
  login,         // (email: string, password: string) => Promise<void>
  signup,        // (email: string, password: string, displayName?: string) => Promise<void>
  logout,        // () => void
  clearError,    // () => void
} = useAuth();
```

### ProtectedRoute

Guard routes that require authentication.

```tsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute
      redirectTo="/login"
      loadingMessage="Checking access..."
      requiredRoles={['member']}  // Optional role requirement
    >
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

### PublicOnlyRoute

Redirect authenticated users away from auth pages.

```tsx
<Route
  path="/login"
  element={
    <PublicOnlyRoute redirectTo="/dashboard">
      <LoginPage />
    </PublicOnlyRoute>
  }
/>
```

### LoginForm & SignupForm

Ready-to-use branded form components.

```tsx
<LoginForm
  onSuccess={() => navigate('/dashboard')}
  onSwitchToSignup={() => navigate('/signup')}
  onForgotPassword={() => navigate('/forgot-password')}
/>

<SignupForm
  onSuccess={() => navigate('/dashboard')}
  onSwitchToLogin={() => navigate('/login')}
  requireTerms={true}
  termsUrl="/terms"
  privacyUrl="/privacy"
/>
```

## 🔧 JWT Utilities

Helper functions for working with tokens:

```tsx
import {
  decodeJWT,           // Decode without verification
  isTokenExpired,      // Check if expired (with buffer)
  getTokenTimeRemaining,  // Seconds until expiry
  willTokenExpireSoon,    // Check if expiring within window
  getUserClaimsFromToken, // Extract user info
  formatTokenExpiration,  // Human-readable expiry
} from './lib/auth';

// Example
const token = getStoredToken();
if (token && !isTokenExpired(token)) {
  const claims = getUserClaimsFromToken(token);
  console.log(`Token for ${claims.email} expires in ${formatTokenExpiration(token)}`);
}
```

## 🗄️ Session Storage

Manage session persistence:

```tsx
import {
  persistSession,      // Store new session
  readStoredSession,   // Get current session
  clearSession,        // Remove session (logout)
  hasValidSession,     // Check if session exists
  getStoredToken,      // Get just the token
  getStoredUser,       // Get just user data
  updateStoredUser,    // Update user info
} from './lib/auth';

// Store with "remember me"
persistSession(token, expiresAt, user, true);

// Read session
const session = readStoredSession();
if (session) {
  console.log(`Logged in as ${session.user.email}`);
}
```

## 🎨 Styling

The components use inline styles with The Babes Club brand colors:

- **Primary Pink**: `#FFB6C1` (Cotton Candy)
- **Background**: Dark gradient (`#0a0a0a` to `#1a1a1a`)
- **Cards**: Glass morphism effect with blur
- **Accents**: Subtle white borders and shadows

To customize styles, you can:

1. Override with `className` prop
2. Wrap components with styled containers
3. Fork the components and modify directly

## 🔒 Security Considerations

1. **Token Storage**: Uses `sessionStorage` by default (cleared on browser close)
2. **Token Expiry**: Automatic logout when token expires
3. **Expiry Buffer**: 60-second buffer prevents race conditions
4. **No Refresh Tokens**: Users must re-authenticate on expiry
5. **Secure Transmission**: Always use HTTPS in production

## 🧪 Testing

```bash
# Run tests (if you have a test setup)
npm test

# Manual testing endpoints
curl -X POST https://api.thebabesclub.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 📝 Backend API Contract

The auth system expects these endpoints:

### POST /auth/login

Request:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

Response (200):
```json
{
  "accessToken": "eyJhbG...",
  "expiresAt": 1763913755,
  "user": {
    "userId": "uuid-here",
    "email": "user@example.com",
    "displayName": "John Doe"
  }
}
```

### POST /auth/signup

Request:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "displayName": "John Doe"
}
```

Response (201):
```json
{
  "accessToken": "eyJhbG...",
  "expiresAt": 1763913755,
  "user": {
    "userId": "uuid-here",
    "email": "user@example.com",
    "displayName": "John Doe"
  }
}
```

### GET /dashboard/profile

Headers:
```
Authorization: Bearer eyJhbG...
```

Response (200):
```json
{
  "profile": {
    "userId": "uuid-here",
    "email": "user@example.com",
    "displayName": "John Doe",
    "roles": ["member"],
    "status": "active"
  }
}
```

## 🤝 Contributing

1. Follow the existing code style
2. Add TypeScript types for new features
3. Update this README for API changes
4. Test with the actual backend

## 📄 License

Proprietary - The Babes Club © 2025
