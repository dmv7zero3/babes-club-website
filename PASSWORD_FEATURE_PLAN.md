# Password Simplification & Visibility Toggle Implementation Plan

## Requirements

- **Password Minimum Length:** 7 characters.
- **Password Content:** Letters (A-Z, a-z) are required. Numbers and special characters are allowed, but not required.
- **Password Visibility Toggle:** Add an eye icon to toggle password visibility in both signup and login forms.
- **Confirm Password Field:** Also gets an eye icon for visibility toggle.
- **Eye Icon Placement:** For best user experience, place the eye icon inside the input field, aligned to the right (commonly used pattern, familiar to users).

---

## Files to Update

- `src/lib/auth/api.ts`  
  _Update password validation logic to require only letters (A-Z, a-z), minimum 7 characters. Numbers/specials allowed but not required._

- `src/components/SignupForm.tsx`  
  _Update password field validation and add eye icon toggle to both password and confirm password fields._

- `src/components/LoginForm.tsx`  
  _Add eye icon toggle to password field._

- `src/lib/types/auth.ts`  
  _Update any shared types or error messages related to password validation, if necessary._

- `src/components/ui/Input.tsx` (or wherever the input component is defined)  
  _If a shared input component is used, update it to support an optional eye icon for password fields._

---

## Notes

- Use an icon from `react-icons` (already installed) for the eye.
- Ensure accessibility: the toggle should be keyboard accessible and have an appropriate aria-label.
- Update any error/help text to reflect the new password requirements.

---

## Summary

This plan covers all necessary file changes and UX recommendations for simplifying password requirements and adding a password visibility toggle to the signup and login forms.
