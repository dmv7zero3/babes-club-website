# types/

This folder contains shared TypeScript type definitions and interfaces for your application.

## How to use

- Add new files for related types (e.g., `user.ts`, `api.ts`, `business.ts`).
- Import these types wherever you need type safety and code completion.

## Example

```ts
// src/lib/types/user.ts
export interface User {
  id: string;
  name: string;
  email: string;
}
```

Use in a component or function:

```ts
import { User } from "../types/user";

function greet(user: User) {
  return `Hello, ${user.name}!`;
}
```
