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
  dashboardSettings?: Record<string, unknown>; // NFT logic removed, generic settings only
  updatedAt: string;
  category: DashboardUserCategory;
}

export interface DashboardSnapshot {
  profile: DashboardProfile;
  orders: DashboardOrder[];
}

export interface DashboardDataContextValue {
  status: "idle" | "loading" | "error";
  profile?: DashboardProfile;
  orders: DashboardOrder[];
  error?: Error;
  refresh: () => void;
  updateProfile: (fields: Partial<DashboardProfile>) => Promise<void>;
  activeOrderId: string | null;
  setActiveOrderId: (orderId: string | null) => void;
  activeOrder?: DashboardOrder | null;
}
export interface ProfileUpdatePayload {
  displayName?: string;
  email?: string;
  phone?: string;
  shippingAddress?: DashboardAddress;
  billingAddress?: DashboardAddress;
  dashboardSettings?: Record<string, unknown>; // NFT logic removed, generic settings only
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
  stripePaymentIntentId?: string;
  createdAt: string;
  items: DashboardOrderItem[];
  status: string;
  amount: number;
  currency: string;
}
