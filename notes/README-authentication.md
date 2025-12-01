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
    // ...
  );
}
```

### 4. Use the Hook

```tsx
import { useAuth } from "./lib/auth";

function MyComponent() {
  const { user, isAuthenticated, login, logout, isLoading } = useAuth();
  // ...
}
```

## 🔐 Authentication Flow

// ...existing content from README.md attachment...
