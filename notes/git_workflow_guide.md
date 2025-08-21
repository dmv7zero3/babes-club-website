# Git Workflow Guide - How to Upload Changes

## 🚀 **Standard Workflow for Uploading Code Changes**

### **Step 1: Check What's Changed**
```bash
git status
```
This shows you:
- Modified files (files you've changed)
- Untracked files (new files you've created)
- Files ready to be committed (staged files)

---

### **Step 2: Add Files to Staging Area**

#### **Option A: Add Specific Files (Recommended)**
```bash
# Add individual files
git add postcss.config.cjs
git add tsconfig.json
git add webpack/config/optimization.js
git add src/lib/hooks/useOptimizedCallback.ts
git add src/utils/gsap-setup.ts
git add src/utils/image-optimization.tsx
git add src/utils/motion-configs.ts
git add src/utils/optimized-imports.ts
```

#### **Option B: Add All Changes at Once**
```bash
# Add all modified and new files
git add .

# OR add only modified files (excludes new files)
git add -u
```

#### **Option C: Add by File Type or Directory**
```bash
# Add all TypeScript files
git add src/**/*.ts src/**/*.tsx

# Add all configuration files
git add *.config.*

# Add entire directory
git add src/utils/
```

---

### **Step 3: Commit Your Changes**

#### **Template for Good Commit Messages:**
```bash
git commit -m "type: brief description

Detailed explanation:
- What was changed
- Why it was changed
- What impact it has

Technical details:
- Specific improvements
- Performance gains
- Breaking changes (if any)"
```

#### **Example Commit (Your Optimization):**
```bash
git commit -m "feat: comprehensive project optimization setup

Enhanced PostCSS Configuration:
- Add advanced PurgeCSS with dynamic class extraction
- Safelist for GSAP animations and third-party libraries
- Comprehensive documentation and maintenance instructions

Performance Optimizations:
- Enhanced webpack chunk splitting strategy
- Optimized TypeScript configuration for faster builds
- Created reusable optimization utilities

New Utility Files:
- useOptimizedCallback: memoization hooks for performance
- gsap-setup: optimized GSAP plugin loading
- image-optimization: responsive image component
- motion-configs: reusable Framer Motion variants
- optimized-imports: tree-shaking friendly imports

Expected improvements:
- CSS bundle size reduction: 50-70%
- Faster build times with incremental TypeScript
- Better runtime performance with memoization
- Optimized animation configurations"
```

---

### **Step 4: Push to Remote Repository**
```bash
# Push to main branch
git push origin main

# OR just push to current branch
git push
```

---

## 📋 **Complete Workflow Examples**

### **Example 1: Small Feature Addition**
```bash
# Check status
git status

# Add specific files
git add src/components/NewComponent.tsx
git add src/styles/new-component.css

# Commit with concise message
git commit -m "feat: add NewComponent with responsive design

- Created reusable NewComponent for user interface
- Added responsive CSS with mobile-first approach
- Includes accessibility features and proper TypeScript types"

# Push changes
git push origin main
```

### **Example 2: Bug Fix**
```bash
# Check status
git status

# Add the fixed files
git add src/utils/buggy-function.ts
git add src/components/AffectedComponent.tsx

# Commit with fix description
git commit -m "fix: resolve animation flicker in mobile menu

- Fixed GSAP timeline race condition
- Added proper cleanup in useEffect
- Improved mobile menu performance on iOS Safari

Fixes issue #123"

# Push changes
git push origin main
```

### **Example 3: Configuration Update**
```bash
# Check status
git status

# Add config files
git add webpack.config.js
git add package.json
git add tsconfig.json

# Commit with config changes
git commit -m "chore: update build configuration

- Upgrade webpack to v5.90.1
- Add new TypeScript strict mode settings
- Optimize production build performance

Bundle size reduced by ~15%"

# Push changes
git push origin main
```

---

## 🎯 **Commit Message Types**

Use these prefixes for consistent commit messages:

- **`feat:`** - New features
- **`fix:`** - Bug fixes
- **`docs:`** - Documentation changes
- **`style:`** - Code formatting (no logic changes)
- **`refactor:`** - Code refactoring
- **`perf:`** - Performance improvements
- **`test:`** - Adding or updating tests
- **`chore:`** - Build process, dependencies, tooling
- **`ci:`** - CI/CD configuration changes

---

## 🚨 **Common Scenarios & Solutions**

### **Scenario 1: Forgot to Add a File**
```bash
# If you already committed but forgot a file
git add forgotten-file.ts
git commit --amend --no-edit

# Then force push (only if you haven't shared the commit)
git push --force-with-lease origin main
```

### **Scenario 2: Want to Undo Changes**
```bash
# Undo changes to a specific file (before adding)
git restore postcss.config.cjs

# Unstage a file (after adding but before commit)
git restore --staged postcss.config.cjs

# Undo last commit (keeps changes in working directory)
git reset --soft HEAD~1
```

### **Scenario 3: Made a Typo in Commit Message**
```bash
# Fix the last commit message
git commit --amend -m "corrected commit message"

# Then force push (only if you haven't shared the commit)
git push --force-with-lease origin main
```

### **Scenario 4: Too Many Small Commits**
```bash
# Combine last 3 commits into one
git reset --soft HEAD~3
git commit -m "feat: combined feature implementation"
git push --force-with-lease origin main
```

---

## 🔄 **Alternative: Feature Branch Workflow**

For larger changes, use feature branches:

```bash
# Create and switch to feature branch
git checkout -b feature/new-optimization

# Make your changes, then add and commit
git add .
git commit -m "feat: implement new optimization"

# Push feature branch
git push -u origin feature/new-optimization

# Create Pull Request on GitHub, then merge
# Switch back to main and pull latest
git checkout main
git pull origin main

# Delete feature branch (optional)
git branch -d feature/new-optimization
```

---

## ✅ **Quick Checklist Before Pushing**

- [ ] **`git status`** - Check what's changed
- [ ] **Test your changes** - `npm run build`, `npm run dev`
- [ ] **Add files** - `git add [files]`
- [ ] **Write good commit message** - Clear and descriptive
- [ ] **Push changes** - `git push origin main`

---

## 🎯 **Pro Tips**

1. **Always run `git status` first** - Know what you're committing
2. **Test before committing** - Make sure your changes work
3. **Write descriptive commit messages** - Your future self will thank you
4. **Commit related changes together** - Keep commits focused
5. **Push regularly** - Don't let too many changes accumulate
6. **Use meaningful file names** - Makes `git add` easier

---

## 📱 **One-Liner for Quick Updates**

For small, tested changes:
```bash
git add . && git commit -m "fix: quick update" && git push origin main
```

**⚠️ Warning:** Only use this for minor changes you're confident about!