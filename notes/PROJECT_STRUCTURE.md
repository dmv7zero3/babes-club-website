# Project Structure & Overview

This document explains the folder structure and conventions used in this project. It will help you understand where to find and place code, assets, and configuration files.

---

## Root Directory

- `.env` — Environment variables for local development.
- `package.json` — Project dependencies and scripts.
- `tailwind.config.js` — Tailwind CSS configuration.
- `tsconfig.json` — TypeScript configuration.
- `.eslintrc.cjs`, `.prettierrc` — Linting and formatting rules.
- `postcss.config.cjs`, `babel.config.js` — Build tool configs.
- `.github/`, `.vscode/` — GitHub workflows and VS Code settings.

---

## Key Folders

### `/src`

Main application source code. Contains the core logic, entry points, and feature modules.

### `/components`

Reusable UI components (buttons, cards, form fields, etc.) that can be shared across pages and features.

### `/app`

Application-level files (used by frameworks like Next.js for routing, layouts, and providers).

### `/pages`

Page components, each representing a route in the application.

### `/layouts`

Layout components that define the structure for pages (e.g., main layout, admin layout).

### `/lib`

Utility code and logic shared across the app:

- Utility functions (formatting, validation, etc.)
- Custom hooks
- API clients
- Context providers (logic only)
- Data models/types

### `/styles`

CSS files, including Tailwind’s `@apply` usage and any custom styles.

### `/public`

Static assets served directly (images, favicon, `index.html`, etc.).

### `/scripts`

Custom scripts for development, build, or deployment tasks.

### `/notes`

Documentation, guides, and project notes.

### `/AWS_Lambda_Functions`

Serverless function code for AWS Lambda (if used).

### `/webpack`

Webpack configuration and related files (if used).

### `/shine-venv`

Python virtual environment (for backend or scripting needs).

---

## How Tailwind CSS Works Here

- The `tailwind.config.js` file specifies which folders Tailwind should scan for class names.
- Only files in `src`, `components`, `app`, `pages`, `layouts`, `lib`, and `styles` are scanned.
- This keeps the final CSS bundle small and fast.

---

## Adding New Code

- **UI components:** Place in `/components`.
- **Pages/routes:** Place in `/pages`.
- **Layout wrappers:** Place in `/layouts`.
- **Utilities, hooks, API logic:** Place in `/lib`.
- **Custom styles:** Place in `/styles`.
- **Static files:** Place in `/public`.

---

## Notes

- Do not put presentational components in `/lib`.
- Keep `/lib` focused on logic and utilities.
- Use `/notes` for documentation and onboarding guides.

---

For more details, see the comments
