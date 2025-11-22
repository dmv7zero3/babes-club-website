import apiClient from "@/lib/api/apiClient";
import type {
  DashboardAddress,
  DashboardNftAsset,
  DashboardOrder,
  DashboardProfile,
  DashboardUserData,
} from "@/lib/types/dashboard";

export interface AuthLoginResponse {
  token: string;
  expiresAt: number;
  user?: {
    userId?: string;
    email?: string;
    displayName?: string;
    profile?: Partial<DashboardProfile>;
    lastLoginAt?: string;
  };
}

interface DashboardProfileResponse {
  profile?: Partial<DashboardProfile> & { userId?: string };
}

interface DashboardOrdersResponse {
  orders?: Array<Record<string, any>>;
}

interface DashboardNftsResponse {
  nfts?: Array<Record<string, any>>;
}

export interface DashboardSnapshot extends DashboardUserData {}

const buildAuthHeaders = (token: string) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const normalizeAddress = (
  address?: Partial<DashboardAddress>
): DashboardAddress => ({
  line1: address?.line1 ?? "",
  city: address?.city ?? "",
  state: address?.state ?? "",
  postalCode: address?.postalCode ?? "",
  country: address?.country ?? "US",
  line2: address?.line2,
});

const normalizeProfile = (
  profile?: Partial<DashboardProfile>
): DashboardProfile => ({
  userId: profile?.userId ?? "anonymous",
  displayName: profile?.displayName ?? "Babes Club Member",
  email: profile?.email ?? "member@example.com",
  shippingAddress: normalizeAddress(profile?.shippingAddress),
  preferredWallet: profile?.preferredWallet,
  avatarUrl: profile?.avatarUrl,
  stripeCustomerId: profile?.stripeCustomerId,
  dashboardSettings: profile?.dashboardSettings ?? {},
  updatedAt: profile?.updatedAt ?? new Date().toISOString(),
  category: profile?.category ?? "Member",
});

const normalizeOrder = (
  order: Record<string, any> | undefined,
  index: number
): DashboardOrder => ({
  orderId: order?.orderId ?? order?.orderNumber ?? `order-${index}`,
  orderNumber: order?.orderNumber ?? order?.orderId ?? `BC-${index}`,
  status: order?.status ?? "processing",
  amount:
    typeof order?.amount === "number"
      ? order.amount
      : Number(order?.amount ?? 0),
  currency: (order?.currency ?? "usd").toLowerCase(),
  stripePaymentIntentId: order?.stripePaymentIntentId,
  createdAt: order?.createdAt ?? new Date().toISOString(),
  items: Array.isArray(order?.items)
    ? order.items.map((item: Record<string, any>, itemIndex: number) => ({
        sku: item?.sku ?? `sku-${itemIndex}`,
        name: item?.name ?? "Item",
        quantity:
          typeof item?.quantity === "number"
            ? item.quantity
            : Number(item?.quantity ?? 1),
        unitPrice:
          typeof item?.unitPrice === "number"
            ? item.unitPrice
            : Number(item?.unitPrice ?? 0),
      }))
    : [],
});

const normalizeNft = (
  nft: Record<string, any> | undefined,
  index: number
): DashboardNftAsset => ({
  tokenId: nft?.tokenId ?? `token-${index}`,
  collectionId: nft?.collectionId ?? "collection",
  tokenName: nft?.tokenName ?? nft?.name ?? "NFT",
  thumbnailUrl: nft?.thumbnailUrl ?? nft?.image,
  metadata: nft?.metadata ?? {},
  lastSyncedAt: nft?.lastSyncedAt ?? new Date().toISOString(),
});

export const login = async (
  email: string,
  password: string
): Promise<AuthLoginResponse> => {
  const { data } = await apiClient.post<AuthLoginResponse>("/auth/login", {
    email,
    password,
  });

  return data;
};

export const signup = async (
  email: string,
  password: string,
  displayName?: string
): Promise<AuthLoginResponse> => {
  const { data } = await apiClient.post<AuthLoginResponse>("/auth/signup", {
    email,
    password,
    displayName,
  });

  return data;
};
export const fetchDashboardSnapshot = async (
  token: string
): Promise<DashboardSnapshot> => {
  const [profileResponse, ordersResponse, nftsResponse] = await Promise.all([
    apiClient.get<DashboardProfileResponse>(
      "/dashboard/profile",
      buildAuthHeaders(token)
    ),
    apiClient.get<DashboardOrdersResponse>(
      "/dashboard/orders",
      buildAuthHeaders(token)
    ),
    apiClient.get<DashboardNftsResponse>(
      "/dashboard/nfts",
      buildAuthHeaders(token)
    ),
  ]);

  const profile = normalizeProfile(profileResponse.data.profile);
  const orders = (ordersResponse.data.orders ?? []).map(normalizeOrder);
  const nfts = (nftsResponse.data.nfts ?? []).map(normalizeNft);

  return {
    profile,
    orders,
    nfts,
  };
};

export const updateDashboardProfile = async (
  token: string,
  fields: Partial<DashboardProfile>
): Promise<DashboardProfile> => {
  const { data } = await apiClient.post<DashboardProfileResponse>(
    "/dashboard/update-profile",
    fields,
    buildAuthHeaders(token)
  );

  return normalizeProfile(data.profile);
};
