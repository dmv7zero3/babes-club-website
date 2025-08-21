# How to Reset VS Code and Fix TypeScript/Node Issues

If you encounter persistent TypeScript or build errors, try the following steps:

1. **Delete node_modules and reinstall dependencies:**

   ```sh
   rm -rf node_modules package-lock.json && npm install
   ```

2. **Reload the VS Code window:**

   - Open the Command Palette (`Cmd+Shift+P`)
   - Type and select: `Developer: Reload Window`

3. **Reset the TypeScript server:**

   - Open the Command Palette (`Cmd+Shift+P`)
   - Type and select: `TypeScript: Restart TS server`

4. **Restart VS Code:**
   - Fully close and reopen VS Code if issues persist.

These steps resolve most editor and TypeScript issues.
