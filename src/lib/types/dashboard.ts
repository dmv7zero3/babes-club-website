export type DashboardUserCategory = "Member" | "VIP" | "Staff";

export interface DashboardAddress {
  line1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  line2?: string;
}

export interface DashboardProfile {
  userId: string;
  displayName: string;
  email: string;
  shippingAddress: DashboardAddress;
  billingAddress?: DashboardAddress;
  preferredWallet?: string;
  avatarUrl?: string;
  stripeCustomerId?: string;
  dashboardSettings?: Record<string, unknown>;
  updatedAt: string;
  category: DashboardUserCategory;
}

export interface ProfileUpdatePayload {
  displayName?: string;
  email?: string;
  phone?: string;
  shippingAddress?: DashboardAddress;
  billingAddress?: DashboardAddress;
  dashboardSettings?: Record<string, unknown>;
  preferredWallet?: string;
}

export interface DashboardOrderItem {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface DashboardOrder {
  orderId: string;
  orderNumber: string;
  status: string;
  amount: number;
  currency: string;
  stripePaymentIntentId?: string;
  createdAt: string;
  items: DashboardOrderItem[];
}

export interface DashboardNftAsset {
  tokenId: string;
  collectionId: string;
  tokenName: string;
  thumbnailUrl?: string;
  metadata?: Record<string, unknown>;
  lastSyncedAt: string;
}

export interface DashboardUserData {
  profile: DashboardProfile;
  orders: DashboardOrder[];
  nfts: DashboardNftAsset[];
}
