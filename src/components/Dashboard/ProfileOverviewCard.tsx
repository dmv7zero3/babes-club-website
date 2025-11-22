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
          <p className="inline-flex items-center gap-2 px-3 py-1 mt-1 text-xs font-medium rounded-full bg-neutral-100 text-neutral-700">
            {profile.category}
          </p>
        </div>
        <dl className="grid w-full grid-cols-2 gap-4 text-sm text-left">
          <div>
            <dt className="text-xs tracking-wide uppercase text-neutral-400">
              Orders
            </dt>
            <dd className="text-lg font-semibold text-neutral-900">
              {orders.length}
            </dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide uppercase text-neutral-400">
              NFTs
            </dt>
            <dd className="text-lg font-semibold text-neutral-900">
              {nfts.length}
            </dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide uppercase text-neutral-400">
              Total Spent
            </dt>
            <dd className="text-lg font-semibold text-neutral-900">
              $
              {(totalSpent / 100).toLocaleString(undefined, {
                style: "currency",
                currency: "USD",
              })}
            </dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide uppercase text-neutral-400">
              Last Updated
            </dt>
            <dd className="text-sm text-neutral-600">{formattedDate}</dd>
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
            <dt className="text-xs tracking-wide uppercase text-neutral-400">
              Stripe Customer ID
            </dt>
            <dd className="font-medium text-neutral-800">
              {profile.stripeCustomerId ?? "Not connected"}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs tracking-wide uppercase text-neutral-400">
              Preferred Wallet
            </dt>
            <dd className="font-mono text-xs">
              {profile.preferredWallet ?? "Not provided"}
            </dd>
          </div>
        </dl>
        {/* <div className="mt-6">
          <h4 className="text-sm font-semibold tracking-wide uppercase text-neutral-500">
            Dashboard Settings
          </h4>
          <div className="grid gap-3 mt-3 sm:grid-cols-2">
            {settingsSummary.map((item) => (
              <div
                key={item.key}
                className="p-4 border rounded-lg border-neutral-200 bg-neutral-50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-900">
                    {item.label}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      item.isEnabled
                        ? "bg-green-100 text-green-700"
                        : "bg-neutral-200 text-neutral-600"
                    }`}
                  >
                    {item.isEnabled ? "Enabled" : "Hidden"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-neutral-500">
                  {item.description}
                </p>
                {item.isDefault ? (
                  <p className="mt-2 text-xs text-neutral-400">
                    Using default preference
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div> */}
      </div>
    </section>
  );
};

export default ProfileOverviewCard;
