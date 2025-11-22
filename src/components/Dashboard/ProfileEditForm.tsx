import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useDashboardData } from "./DashboardDataProvider";

interface FormState {
  displayName: string;
  email: string;
  preferredWallet: string;
  shippingLine1: string;
  shippingLine2: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;
  showOrderHistory: boolean;
  showNftHoldings: boolean;
}

const booleanSetting = (value: unknown, fallback = true): boolean => {
  if (typeof value === "boolean") {
    return value;
  }

  return fallback;
};

const stringSetting = (value: unknown, fallback = ""): string => {
  if (typeof value === "string") {
    return value;
  }

  return fallback;
};

const buildFormState = (
  profile: ReturnType<typeof useDashboardData>["profile"]
): FormState => {
  const shipping = profile?.shippingAddress;
  const settings = profile?.dashboardSettings ?? {};

  return {
    displayName: profile?.displayName ?? "",
    email: profile?.email ?? "",
    preferredWallet: profile?.preferredWallet ?? "",
    shippingLine1: shipping?.line1 ?? "",
    shippingLine2: shipping?.line2 ?? "",
    shippingCity: shipping?.city ?? "",
    shippingState: shipping?.state ?? "",
    shippingPostalCode: shipping?.postalCode ?? "",
    shippingCountry: shipping?.country ?? "",
    showOrderHistory: booleanSetting(
      (settings as Record<string, unknown>).showOrderHistory
    ),
    showNftHoldings: booleanSetting(
      (settings as Record<string, unknown>).showNftHoldings
    ),
  };
};

const ProfileEditForm = () => {
  const { profile, updateProfile } = useDashboardData();
  const initialState = useMemo(() => buildFormState(profile), [profile]);

  const [formState, setFormState] = useState<FormState>(initialState);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormState(buildFormState(profile));
    setFeedback(null);
    setError(null);
  }, [profile]);

  if (!profile) {
    return (
      <div className="p-6 text-sm bg-white border rounded-xl border-neutral-200 text-neutral-500">
        Profile data not loaded.
      </div>
    );
  }

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setFormState((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    setFormState((previous) => ({
      ...previous,
      [name]: checked,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSaving(true);
    setFeedback(null);
    setError(null);

    try {
      await updateProfile({
        displayName: formState.displayName.trim(),
        email: formState.email.trim(),
        preferredWallet: formState.preferredWallet.trim() || undefined,
        shippingAddress: {
          line1: formState.shippingLine1.trim(),
          line2: formState.shippingLine2.trim() || undefined,
          city: formState.shippingCity.trim(),
          state: formState.shippingState.trim(),
          postalCode: formState.shippingPostalCode.trim(),
          country: formState.shippingCountry.trim(),
        },
        dashboardSettings: {
          ...(profile.dashboardSettings ?? {}),
          showOrderHistory: formState.showOrderHistory,
          showNftHoldings: formState.showNftHoldings,
        },
      });

      setFeedback(
        "Profile saved. Changes are stored locally until the API is ready."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save profile changes right now."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 space-y-6 bg-white border rounded-xl border-neutral-200"
    >
      <header className="space-y-1">
        <h3 className="text-lg font-semibold text-neutral-900">Edit Profile</h3>
        <p className="text-sm text-neutral-500">
          Update member information. Submissions are currently stored in-memory
          while the backend is under construction.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label
            className="text-sm font-medium text-neutral-700"
            htmlFor="displayName"
          >
            Display Name
          </label>
          <input
            id="displayName"
            name="displayName"
            value={formState.displayName}
            onChange={handleInputChange}
            required
            className="px-3 py-2 text-sm border rounded-md border-neutral-300 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label
            className="text-sm font-medium text-neutral-700"
            htmlFor="email"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formState.email}
            onChange={handleInputChange}
            required
            className="px-3 py-2 text-sm border rounded-md border-neutral-300 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label
            className="text-sm font-medium text-neutral-700"
            htmlFor="preferredWallet"
          >
            Preferred Wallet
          </label>
          <input
            id="preferredWallet"
            name="preferredWallet"
            value={formState.preferredWallet}
            onChange={handleInputChange}
            placeholder="0x..."
            className="px-3 py-2 font-mono text-sm border rounded-md border-neutral-300 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h4 className="text-sm font-semibold tracking-wide uppercase text-neutral-500">
          Shipping Address
        </h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2 md:col-span-2">
            <label
              className="text-sm font-medium text-neutral-700"
              htmlFor="shippingLine1"
            >
              Address Line 1
            </label>
            <input
              id="shippingLine1"
              name="shippingLine1"
              value={formState.shippingLine1}
              onChange={handleInputChange}
              required
              className="px-3 py-2 text-sm border rounded-md border-neutral-300 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <label
              className="text-sm font-medium text-neutral-700"
              htmlFor="shippingLine2"
            >
              Address Line 2 (optional)
            </label>
            <input
              id="shippingLine2"
              name="shippingLine2"
              value={formState.shippingLine2}
              onChange={handleInputChange}
              className="px-3 py-2 text-sm border rounded-md border-neutral-300 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-medium text-neutral-700"
              htmlFor="shippingCity"
            >
              City
            </label>
            <input
              id="shippingCity"
              name="shippingCity"
              value={formState.shippingCity}
              onChange={handleInputChange}
              required
              className="px-3 py-2 text-sm border rounded-md border-neutral-300 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-medium text-neutral-700"
              htmlFor="shippingState"
            >
              State / Province
            </label>
            <input
              id="shippingState"
              name="shippingState"
              value={formState.shippingState}
              onChange={handleInputChange}
              required
              className="px-3 py-2 text-sm border rounded-md border-neutral-300 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-medium text-neutral-700"
              htmlFor="shippingPostalCode"
            >
              Postal Code
            </label>
            <input
              id="shippingPostalCode"
              name="shippingPostalCode"
              value={formState.shippingPostalCode}
              onChange={handleInputChange}
              required
              className="px-3 py-2 text-sm border rounded-md border-neutral-300 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-medium text-neutral-700"
              htmlFor="shippingCountry"
            >
              Country
            </label>
            <input
              id="shippingCountry"
              name="shippingCountry"
              value={formState.shippingCountry}
              onChange={handleInputChange}
              required
              className="px-3 py-2 text-sm border rounded-md border-neutral-300 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="flex items-center justify-between p-4 border rounded-lg border-neutral-200 bg-neutral-100">
          <div>
            <h5 className="text-sm font-medium text-neutral-800">
              Show Order History
            </h5>
            <p className="text-xs text-neutral-500">
              Toggle visibility of the orders panel for this member.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="showOrderHistory"
              checked={formState.showOrderHistory}
              onChange={handleCheckboxChange}
              className="sr-only peer"
            />
            <span className="w-10 h-6 transition rounded-full bg-neutral-300 peer-checked:bg-black"></span>
            <span className="absolute w-4 h-4 transition bg-white rounded-full left-1 top-1 peer-checked:translate-x-4"></span>
          </label>
        </div>
        <div className="flex items-center justify-between p-4 border rounded-lg border-neutral-200 bg-neutral-100">
          <div>
            <h5 className="text-sm font-medium text-neutral-800">
              Show NFT Holdings
            </h5>
            <p className="text-xs text-neutral-500">
              Allow access to the NFTs gallery inside the dashboard.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="showNftHoldings"
              checked={formState.showNftHoldings}
              onChange={handleCheckboxChange}
              className="sr-only peer"
            />
            <span className="w-10 h-6 transition rounded-full bg-neutral-300 peer-checked:bg-black"></span>
            <span className="absolute w-4 h-4 transition bg-white rounded-full left-1 top-1 peer-checked:translate-x-4"></span>
          </label>
        </div>
        {/* Theme preference removed — no theme option currently */}
      </section>

      {feedback ? (
        <div className="p-3 text-sm text-green-700 rounded-md bg-green-50">
          {feedback}
        </div>
      ) : null}
      {error ? (
        <div className="p-3 text-sm text-red-700 rounded-md bg-red-50">
          {error}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => setFormState(initialState)}
          className="px-4 py-2 text-sm font-medium border rounded-md border-neutral-300 text-neutral-700 hover:bg-neutral-100"
          disabled={isSaving}
        >
          Reset
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-semibold text-white bg-black rounded-md hover:bg-neutral-800 disabled:opacity-60"
          disabled={isSaving}
        >
          {isSaving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
};

export default ProfileEditForm;
