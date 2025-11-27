# 🔄 Migration Guide: Loading Components

## Files to Replace

Replace these files in your project with the updated versions:

| File                      | Location                    | Changes              |
| ------------------------- | --------------------------- | -------------------- |
| `ProtectedRoute.tsx`      | `src/components/`           | Uses ChronicLeafIcon |
| `DashboardRouteGuard.tsx` | `src/components/Dashboard/` | Uses ChronicLeafIcon |
| `DashboardLayout.tsx`     | `src/components/Dashboard/` | Uses ChronicLeafIcon |
| `DashboardPage.tsx`       | `src/pages/Dashboard/`      | Uses ChronicLeafIcon |
| `DashboardLoginPage.tsx`  | `src/pages/Dashboard/`      | Uses ChronicLeafIcon |
| `LoginForm.tsx`           | `src/components/`           | Uses InlineSpinner   |
| `SignupForm.tsx`          | `src/components/`           | Uses InlineSpinner   |
| `index.ts`                | `src/components/`           | Exports LoadingIcon  |

## Migration Steps

1. **Copy LoadingIcon folder** to `src/components/LoadingIcon/`

2. **Replace each file** with the updated version

3. **Update imports** if needed:

```tsx
import { ChronicLeafIcon, InlineSpinner } from "@/components/LoadingIcon";
```

## What Changed

### LoginForm & SignupForm

- Removed `styles.spinner` inline CSS
- Removed `spinnerKeyframes` constant
- Added `<InlineSpinner />` component

### ProtectedRoute

- `LoadingSpinner` now uses `ChronicLeafIcon`
- Added dark gradient background
- Added customizable message prop

### Dashboard Components

- All loading states use `ChronicLeafIcon`
- Phase-specific loading messages
- Branded error fallback screens
