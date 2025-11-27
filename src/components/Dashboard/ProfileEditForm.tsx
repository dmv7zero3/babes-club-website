/**
 * Profile Edit Form for The Babes Club Dashboard
 *
 * Allows users to update their profile information including
 * display name, email, and shipping/billing addresses.
 */

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useDashboardData } from "./DashboardDataProvider";
import { InlineSpinner } from "@/components/LoadingIcon";

// ============================================================================
// Types
// ============================================================================

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
  billingLine1: string;
  billingLine2: string;
  billingCity: string;
  billingState: string;
  billingPostalCode: string;
  billingCountry: string;
  useSameAddress: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

const buildFormState = (
  profile: ReturnType<typeof useDashboardData>["profile"]
): FormState => {
  const shipping = profile?.shippingAddress;
  const billing = profile?.billingAddress;

  // Check if billing is same as shipping
  const same =
    !billing ||
    (billing.line1 === shipping?.line1 &&
      billing.line2 === shipping?.line2 &&
      billing.city === shipping?.city &&
      billing.state === shipping?.state &&
      billing.postalCode === shipping?.postalCode &&
      billing.country === shipping?.country);

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
    billingLine1: billing?.line1 ?? shipping?.line1 ?? "",
    billingLine2: billing?.line2 ?? shipping?.line2 ?? "",
    billingCity: billing?.city ?? shipping?.city ?? "",
    billingState: billing?.state ?? shipping?.state ?? "",
    billingPostalCode: billing?.postalCode ?? shipping?.postalCode ?? "",
    billingCountry: billing?.country ?? shipping?.country ?? "",
    useSameAddress: same,
  };
};

// ============================================================================
// Component
// ============================================================================

const ProfileEditForm = () => {
  const { profile, updateProfile } = useDashboardData();

  // Memoize initial state based on profile
  const initialState = useMemo(() => {
    console.log(
      "[ProfileEditForm] Building initial state from profile:",
      profile
    );
    return buildFormState(profile);
  }, [profile]);

  const [formState, setFormState] = useState<FormState>(initialState);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Update form state when profile changes (e.g., after successful save)
  useEffect(() => {
    console.log("[ProfileEditForm] Profile changed in context:", {
      userId: profile?.userId,
      displayName: profile?.displayName,
      email: profile?.email,
      shippingAddress: profile?.shippingAddress,
      billingAddress: profile?.billingAddress,
      updatedAt: profile?.updatedAt,
    });

    const newFormState = buildFormState(profile);
    console.log("[ProfileEditForm] New form state:", newFormState);

    setFormState(newFormState);
    // Don't clear feedback on profile update - user should see success message
    // setFeedback(null);
    setError(null);
  }, [profile]);

  // Loading state
  if (!profile) {
    return (
      <div className="p-6 text-sm bg-white border rounded-xl border-neutral-200 text-neutral-500">
        Profile data not loaded.
      </div>
    );
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = event.target;

    if (type === "checkbox" && name === "useSameAddress") {
      const checked = (event.target as HTMLInputElement).checked;
      setFormState((previous) => ({
        ...previous,
        useSameAddress: checked,
        // If toggling ON, mirror shipping to billing
        ...(checked
          ? {
              billingLine1: previous.shippingLine1,
              billingLine2: previous.shippingLine2,
              billingCity: previous.shippingCity,
              billingState: previous.shippingState,
              billingPostalCode: previous.shippingPostalCode,
              billingCountry: previous.shippingCountry,
            }
          : {}),
      }));
    } else {
      setFormState((previous) => ({
        ...previous,
        [name]: value,
        // If editing shipping and useSameAddress, mirror to billing
        ...(previous.useSameAddress && name.startsWith("shipping")
          ? {
              ["billing" + name.slice(8)]: value,
            }
          : {}),
      }));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSaving(true);
    setFeedback(null);
    setError(null);

    // Validation for billing if not using same address
    if (!formState.useSameAddress) {
      if (
        !formState.billingLine1 ||
        !formState.billingCity ||
        !formState.billingState ||
        !formState.billingPostalCode ||
        !formState.billingCountry
      ) {
        setError("Please fill in all required billing address fields.");
        setIsSaving(false);
        return;
      }
    }

    try {
      const payload = {
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
        billingAddress: formState.useSameAddress
          ? {
              line1: formState.shippingLine1.trim(),
              line2: formState.shippingLine2.trim() || undefined,
              city: formState.shippingCity.trim(),
              state: formState.shippingState.trim(),
              postalCode: formState.shippingPostalCode.trim(),
              country: formState.shippingCountry.trim(),
            }
          : {
              line1: formState.billingLine1.trim(),
              line2: formState.billingLine2.trim() || undefined,
              city: formState.billingCity.trim(),
              state: formState.billingState.trim(),
              postalCode: formState.billingPostalCode.trim(),
              country: formState.billingCountry.trim(),
            },
      };

      console.log("[ProfileEditForm] Submitting payload:", payload);

      await updateProfile(payload);

      console.log(
        "[ProfileEditForm] Update successful, profile should refresh"
      );

      setFeedback("Profile saved successfully!");
    } catch (err: unknown) {
      console.error("[ProfileEditForm] Update failed:", err);

      // Map backend errors to fields if possible
      if (
        err &&
        typeof err === "object" &&
        "fieldErrors" in err &&
        err.fieldErrors
      ) {
        const fieldErrors = err.fieldErrors as Record<
          string,
          Record<string, string>
        >;
        const summary = Object.entries(fieldErrors)
          .map(([section, fields]) =>
            Object.entries(fields)
              .map(([field, msg]) => `${section}.${field}: ${msg}`)
              .join("; ")
          )
          .join("; ");
        setError(summary);
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to save profile changes right now."
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 space-y-6 bg-white border rounded-xl border-neutral-200"
    >
      <header className="space-y-1">
        <h3 className="text-lg font-semibold text-neutral-900">Edit Profile</h3>
        <p className="text-sm text-neutral-500">
          Update your member information and addresses.
        </p>
      </header>

      {/* Basic Info Section */}
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
            className="px-3 py-2 text-sm border rounded-md border-neutral-300 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
      </section>

      {/* Shipping Address Section */}
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

      {/* Same Address Checkbox */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="useSameAddress"
          name="useSameAddress"
          checked={formState.useSameAddress}
          onChange={handleInputChange}
          className="w-4 h-4 border rounded border-neutral-300 text-babe-pink focus:ring-babe-pink"
        />
        <label
          htmlFor="useSameAddress"
          className="text-sm font-medium text-neutral-700"
        >
          Billing address same as shipping
        </label>
      </div>

      {/* Feedback Messages */}
      {error && (
        <div
          className="p-3 text-sm text-red-700 rounded-md bg-red-50"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}
      {feedback && (
        <div
          className="p-3 text-sm text-green-700 rounded-md bg-green-50"
          role="status"
          aria-live="polite"
        >
          {feedback}
        </div>
      )}

      {/* Billing Address Section */}
      <section className="space-y-4">
        <h4 className="text-sm font-semibold tracking-wide uppercase text-neutral-500">
          Billing Address
        </h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2 md:col-span-2">
            <label
              className="text-sm font-medium text-neutral-700"
              htmlFor="billingLine1"
            >
              Address Line 1
            </label>
            <input
              id="billingLine1"
              name="billingLine1"
              value={formState.billingLine1}
              onChange={handleInputChange}
              required={!formState.useSameAddress}
              disabled={formState.useSameAddress}
              className="px-3 py-2 text-sm border rounded-md border-neutral-300 focus:border-black focus:outline-none focus:ring-1 focus:ring-black disabled:bg-neutral-100 disabled:text-neutral-500"
              aria-disabled={formState.useSameAddress}
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <label
              className="text-sm font-medium text-neutral-700"
              htmlFor="billingLine2"
            >
              Address Line 2 (optional)
            </label>
            <input
              id="billingLine2"
              name="billingLine2"
              value={formState.billingLine2}
              onChange={handleInputChange}
              disabled={formState.useSameAddress}
              className="px-3 py-2 text-sm border rounded-md border-neutral-300 focus:border-black focus:outline-none focus:ring-1 focus:ring-black disabled:bg-neutral-100 disabled:text-neutral-500"
              aria-disabled={formState.useSameAddress}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-medium text-neutral-700"
              htmlFor="billingCity"
            >
              City
            </label>
            <input
              id="billingCity"
              name="billingCity"
              value={formState.billingCity}
              onChange={handleInputChange}
              required={!formState.useSameAddress}
              disabled={formState.useSameAddress}
              className="px-3 py-2 text-sm border rounded-md border-neutral-300 focus:border-black focus:outline-none focus:ring-1 focus:ring-black disabled:bg-neutral-100 disabled:text-neutral-500"
              aria-disabled={formState.useSameAddress}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-medium text-neutral-700"
              htmlFor="billingState"
            >
              State / Province
            </label>
            <input
              id="billingState"
              name="billingState"
              value={formState.billingState}
              onChange={handleInputChange}
              required={!formState.useSameAddress}
              disabled={formState.useSameAddress}
              className="px-3 py-2 text-sm border rounded-md border-neutral-300 focus:border-black focus:outline-none focus:ring-1 focus:ring-black disabled:bg-neutral-100 disabled:text-neutral-500"
              aria-disabled={formState.useSameAddress}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-medium text-neutral-700"
              htmlFor="billingPostalCode"
            >
              Postal Code
            </label>
            <input
              id="billingPostalCode"
              name="billingPostalCode"
              value={formState.billingPostalCode}
              onChange={handleInputChange}
              required={!formState.useSameAddress}
              disabled={formState.useSameAddress}
              className="px-3 py-2 text-sm border rounded-md border-neutral-300 focus:border-black focus:outline-none focus:ring-1 focus:ring-black disabled:bg-neutral-100 disabled:text-neutral-500"
              aria-disabled={formState.useSameAddress}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-medium text-neutral-700"
              htmlFor="billingCountry"
            >
              Country
            </label>
            <input
              id="billingCountry"
              name="billingCountry"
              value={formState.billingCountry}
              onChange={handleInputChange}
              required={!formState.useSameAddress}
              disabled={formState.useSameAddress}
              className="px-3 py-2 text-sm border rounded-md border-neutral-300 focus:border-black focus:outline-none focus:ring-1 focus:ring-black disabled:bg-neutral-100 disabled:text-neutral-500"
              aria-disabled={formState.useSameAddress}
            />
          </div>
        </div>
      </section>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-black rounded-md hover:bg-neutral-800 disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <InlineSpinner size={16} color="#ffffff" />
              Saving…
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </form>
  );
};

export default ProfileEditForm;
