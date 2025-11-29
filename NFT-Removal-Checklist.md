# Babes Club Website – NFT Removal Checklist

## Overview

This checklist guides the removal of all NFT-related code, data, and documentation from the Babes Club website project. Complete each item and check it off as you go.

---

## **Frontend (React/TypeScript)**

- [x] **Delete** `src/components/Dashboard/NFTHoldingsGrid.tsx`
- [x] **Update** `src/components/Dashboard/DashboardLayout.tsx`
  - Remove NFT tab/panel, navigation label, and panel mapping
- [x] **Update** `src/pages/Dashboard/DashboardPage.tsx`
  - Remove `NFTHoldingsGrid` import/usage and `nftsPanel` prop
- [x] **Update** `src/components/Dashboard/DashboardDataProvider.tsx`
  - Remove `nfts` from context/state
- [x] **Update** `src/components/Dashboard/ProfileOverviewCard.tsx`
  - Remove NFT count and “NFT holdings” summary
- [x] **Update** `src/components/Dashboard/ProfileEditForm.tsx`
  - Remove NFT-related comments/code
- [x] **Update** `src/pages/Auth/SignupScreen.tsx` & `src/pages/Dashboard/DashboardLoginScreen.tsx`
  - Remove NFT references from copy
- [x] **Update** `.vscode/launch.json`
  - Remove NFT lambda debug configs

---

## **API Layer & Types**

- [x] **Update** `src/lib/types/dashboard.ts`
  - Remove `DashboardNftAsset` and `nfts` from `DashboardUserData`
- [x] **Update** `src/lib/dashboard/api.ts`
  - Remove `/dashboard/nfts` call, `normalizeNft`, and related types
- [ ] **Update** any separate `DashboardSettings` type/interface
  - Remove `showNftHoldings` and update references
- [x] **Update** any `DashboardPanelKey` union/type
  - Remove NFT-related keys and update usages

---

## **Mock Data & Fixtures**

- [x] **Update** `public/mock-data/sample-user-data.json`
  - Remove `nfts` arrays and `dashboardSettings.showNftHoldings`
- [x] **Update** `update-profile-output.json`
  - Remove `showNftHoldings`

---

## **Backend Lambdas**

- [x] **Delete** `AWS_Lambda_Functions/babes-website-dashboard-list-nfts` (NFT dashboard listing)
- [x] **Delete** `AWS_Lambda_Functions/babes-website-nft-refresh` (NFT refresh job)
- [x] **Delete** `AWS_Lambda_Functions/babes-website-internal-sync-nfts` (internal NFT sync)
- [x] **Update** `AWS_Lambda_Functions/babes-website-auth-signup/lambda_function.py`
  - Remove default `dashboardSettings.showNftHoldings`

### **API Gateway Endpoints**

- [x] Remove `/dashboard/nfts` endpoint (resource id: `jb4whj`)
- [x] Remove `/nft/refresh` endpoint (resource id: `64xv0n`)
- [x] Remove `/nft` endpoint (resource id: `b2hoof`)
- [x] Remove `/internal/sync/nfts` endpoint (resource id: `eax52o`)

---

## **Documentation & Plans**

- [ ] **Update** `notes/UserDashboardBackendPlan.md` & `notes/user-dashboard-backend-plan.md`
  - Remove NFT table/endpoint sections
- [ ] **Update** `notes/backend/dynamodb-production-checklist.md`
  - Remove NFT seeding tasks
- [ ] **Update** other README/note files
  - Remove stray NFT references

---

## **Environment & Infrastructure**

- [ ] Remove environment variables or deployment scripts referencing `NFTOwnership` or NFT endpoints
- [ ] Remove cloud resources related to NFT tables/endpoints

---

## **Imports & References**

- [ ] Search for and remove any remaining imports of `NFTHoldingsGrid`, `normalizeNft`, `DashboardNftAsset`, etc.

---

## **Testing & Docs**

- [ ] Update automated tests, API docs, and mock files to remove references to `nfts` or `showNftHoldings`

---

## **Other**

- [ ] Update any API schema/example files
  - Remove `showNftHoldings` and NFT endpoint documentation

---

## **Validation**

- [ ] Run `npm run build` and `npm run type-check` to confirm successful build
- [ ] Test dashboard UI to ensure fallback to orders/profile features
- [ ] Review for any remaining “NFT” references in codebase

---

**Tip:** Check off each item as you complete it. This will help ensure a thorough and error-free removal of NFT functionality.
