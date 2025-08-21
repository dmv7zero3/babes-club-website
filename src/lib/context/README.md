# context/

This folder contains React context providers and related logic for sharing state or functionality across your application.

## How to use

1. **Create a context:**
   - Add a new file (e.g., `AuthContext.tsx`) that exports a React context and provider component.
2. **Wrap your app:**
   - Import the provider in your `App.tsx` or `main.tsx` and wrap your component tree to provide context values.
3. **Consume context:**
   - Use `useContext` in any component to access the shared state or functions.

## Example

```tsx
// src/lib/context/AuthContext.tsx
import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

Now wrap your app:

```tsx
// src/App.tsx
import { AuthProvider } from "../lib/context/AuthContext";

function App() {
  return <AuthProvider>{/* ...rest of your app */}</AuthProvider>;
}
```
