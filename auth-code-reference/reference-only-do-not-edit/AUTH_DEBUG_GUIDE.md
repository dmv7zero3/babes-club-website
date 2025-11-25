# JWT Authentication Debug Guide - The Babes Club

## Quick Diagnosis Checklist

### 1. Check Storage Key Consistency

**CRITICAL**: The storage key MUST be identical in all files:

```typescript
// session.ts
export const SESSION_STORAGE_KEY = "babes.dashboard.session";

// DashboardRouteGuard.tsx
const SESSION_STORAGE_KEY = "babes.dashboard.session";
```

Open browser DevTools → Application → Session Storage and verify the key name matches.

### 2. Verify Session Write (Login Flow)

Add this debug log to your login handler:

```typescript
// In DashboardLoginScreen.tsx or wherever login is called
const handleLogin = async () => {
  const { token, expiresAt, user } = await login(email, password);
  
  console.log('[LOGIN] API response:', { token: token?.slice(0, 8) + '...', expiresAt, user });
  
  persistSession(token, expiresAt, {
    userId: user.userId || '',
    email: user.email || email.trim(),
    displayName: user.displayName || 'User'
  });
  
  // Verify write immediately
  const stored = sessionStorage.getItem('babes.dashboard.session');
  console.log('[LOGIN] Session after persist:', stored ? 'WRITTEN' : 'NOT WRITTEN');
  console.log('[LOGIN] Full stored value:', stored);
  
  navigate('/dashboard');
};
```

### 3. Verify Session Read (Guard)

The guard should show these logs:

```
[DashboardRouteGuard] Auth effect triggered { reloadFlag: 0, pathname: '/dashboard' }
[session.ts] readStoredSession called
[session.ts] sessionStorage read { found: true }
[session.ts] Valid session found { userId: '...', expiresIn: 43199 }
[DashboardRouteGuard] Session read result { hasSession: true, hasToken: true }
```

If you see:
```
[session.ts] sessionStorage read { found: false }
[session.ts] No session found in storage
```

The session was NOT persisted correctly.

### 4. Common Fixes

#### Fix A: Storage Key Mismatch

Check ALL files that use session storage:

```bash
# In your project directory
grep -r "babes.*session" src/
```

All occurrences should use the same key.

#### Fix B: Import Path Issues

Make sure both files import from the same module:

```typescript
// DashboardRouteGuard.tsx - CORRECT
import { readStoredSession, clearSession } from "../../lib/dashboard/session";

// NOT from two different files
import { readStoredSession } from "../../lib/auth/session";  // WRONG if using dashboard
import { persistSession } from "../../lib/dashboard/session";  // Different file!
```

#### Fix C: Race Condition

If the session IS written but the guard doesn't see it, add this to the login flow:

```typescript
// After persistSession, wait for event dispatch
await new Promise(resolve => setTimeout(resolve, 50));
navigate('/dashboard');
```

Or use the fixed guard which retries reading the session.

## Browser DevTools Commands

Paste these in the Console to debug:

```javascript
// Check current session
JSON.parse(sessionStorage.getItem('babes.dashboard.session'))

// Manually set a test session
sessionStorage.setItem('babes.dashboard.session', JSON.stringify({
  token: 'test123',
  expiresAt: Math.floor(Date.now()/1000) + 3600,
  user: { userId: 'test', email: 'test@test.com', displayName: 'Test' }
}))

// Clear session
sessionStorage.removeItem('babes.dashboard.session')

// Trigger custom event (simulates login)
window.dispatchEvent(new CustomEvent('session-updated'))
```

## Files Modified

1. **session.ts** - Added:
   - Unified `SESSION_STORAGE_KEY` constant
   - `dispatchSessionUpdate()` helper
   - Debug logging

2. **DashboardRouteGuard.tsx** - Added:
   - `readSessionWithRetry()` - retries session read up to 3 times
   - Storage event listener for cross-tab sync
   - Custom event listener for same-tab session updates
   - Dependency on `location.pathname` to re-check after navigation

## Testing the Fix

1. Clear all storage: `sessionStorage.clear(); localStorage.clear()`
2. Navigate to `/login`
3. Login with valid credentials
4. Watch console for debug logs
5. Should see:
   - `[LOGIN] Session after persist: WRITTEN`
   - `[DashboardRouteGuard] Session read result { hasSession: true }`
   - `[DashboardRouteGuard] User authenticated successfully`
