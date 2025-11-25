import { useDashboardData } from "./DashboardDataProvider";

const parseBooleanSetting = (value: unknown): boolean | undefined => {
  return typeof value === "boolean" ? value : undefined;
};

const formatAddress = (address?: {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}) => {
  if (!address) {
    return "No shipping address on file";
  }

  const parts = [address.line1];

  if (address.line2) {
    parts.push(address.line2);
  }

  parts.push(`${address.city}, ${address.state} ${address.postalCode}`);
  parts.push(address.country);

  return parts.filter(Boolean).join("\n");
};

const ProfileOverviewCard = () => {
  const { profile, orders, nfts } = useDashboardData();

  if (!profile) {
    return (
      <div className="p-6 text-sm bg-white border rounded-xl border-neutral-200 text-neutral-500">
        No profile data available.
      </div>
    );
  }

  // Stripe Customer ID display logic
  let stripeCustomerIdDisplay: string;
  if (
    profile.stripeCustomerId === undefined ||
    profile.stripeCustomerId === null
  ) {
    stripeCustomerIdDisplay = "Pending (created after first purchase)";
  } else if (
    typeof profile.stripeCustomerId === "string" &&
    profile.stripeCustomerId.trim()
  ) {
    stripeCustomerIdDisplay = profile.stripeCustomerId;
  } else {
    stripeCustomerIdDisplay = "Unavailable (contact support)";
  }
  const totalSpent = orders.reduce((sum, order) => sum + order.amount, 0);
  const updatedAt = new Date(profile.updatedAt);
  const formattedDate = Number.isNaN(updatedAt.getTime())
    ? profile.updatedAt
    : new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(updatedAt);
  const settingsRaw = (profile.dashboardSettings ?? {}) as Record<
    string,
    unknown
  >;
  const orderHistorySetting = parseBooleanSetting(
    settingsRaw["showOrderHistory"]
  );
  const nftHoldingsSetting = parseBooleanSetting(
    settingsRaw["showNftHoldings"]
  );
  const settingsSummary = [
    {
      key: "orderHistory",
      label: "Order history",
      description: "Members can review their previous purchases.",
      isEnabled: orderHistorySetting ?? true,
      isDefault: orderHistorySetting === undefined,
    },
    {
      key: "nftHoldings",
      label: "NFT holdings",
      description: "Display connected NFT collections inside the dashboard.",
      isEnabled: nftHoldingsSetting ?? true,
      isDefault: nftHoldingsSetting === undefined,
    },
  ];

  return (
    <section className="grid gap-6 md:grid-cols-[260px,1fr]">
      <div className="flex flex-col items-center gap-4 p-6 text-center bg-white border rounded-xl border-neutral-200">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">
            {profile.displayName}
          </h3>
          <p className="text-sm text-neutral-500">{profile.email}</p>
        </div>
        <dl className="grid w-full grid-cols-2 gap-4 text-sm text-left">
          <div>
            <dt className="text-xs tracking-wide uppercase text-neutral-400">
              Orders
            </dt>
            <dd className="font-semibold text-neutral-900">{orders.length}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide uppercase text-neutral-400">
              NFTs
            </dt>
            <dd className="font-semibold text-neutral-900">{nfts.length}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide uppercase text-neutral-400">
              Total Spent
            </dt>
            <dd className="font-semibold text-neutral-900">
              {totalSpent > 0 ? `$${totalSpent.toFixed(2)}` : "$0.00"}
            </dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide uppercase text-neutral-400">
              Last Updated
            </dt>
            <dd className="text-neutral-700">{formattedDate}</dd>
          </div>
        </dl>
      </div>
      <div className="p-6 bg-white border rounded-xl border-neutral-200">
        <h4 className="text-sm font-semibold tracking-wide uppercase text-neutral-500">
          Shipping Address
        </h4>
        <pre className="mt-2 text-sm whitespace-pre-line text-neutral-700">
          {formatAddress(profile.shippingAddress)}
        </pre>
        <dl className="grid grid-cols-1 gap-4 mt-6 text-sm text-neutral-600 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs tracking-wide uppercase text-neutral-400">
              Stripe Customer ID
            </span>
            <span className="font-mono text-sm text-neutral-700">
              {stripeCustomerIdDisplay}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs tracking-wide uppercase text-neutral-400">
              Preferred Wallet
            </span>
            <span className="font-mono text-xs">
              {profile.preferredWallet ?? "Not provided"}
            </span>
          </div>
        </dl>
        {/* ...existing code... */}
      </div>
    </section>
  );
};

export default ProfileOverviewCard;
