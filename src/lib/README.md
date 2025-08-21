# lib/

This folder contains core logic, utilities, and shared modules that are not UI components.

## Structure

- **api/**: API clients and data-fetching logic
- **hooks/**: Custom React hooks for reusable logic
- **context/**: React context providers and related logic
- **types/**: Shared TypeScript types and interfaces

## Guidelines

- Place non-UI, reusable logic here to keep your codebase organized and maintainable.
- Do not put presentational or layout components in `lib`—those belong in `components` or `layouts`.

## Example Usage

- Import a custom hook: `import { useDebounce } from "../lib/hooks/useDebounce";`
- Use a shared type: `import { User } from "../lib/types/user";`
- Use an API client: `import { fetchUser } from "../lib/api/userApi";`
