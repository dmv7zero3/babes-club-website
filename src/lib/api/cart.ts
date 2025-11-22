import type { AxiosResponse } from "axios";

import { api } from "./apiClient";
import type { CheckoutPayload } from "@/lib/api/cartPayload";

type QuoteRequestItem = {
  collectionId: string;
  variantId: string;
  quantity: number;
  name?: string;
  unitAmount?: number;
  currency?: string;
  stripePriceId?: string;
  imageUrl?: string;
  options?: Record<string, string>;
};

export type CartQuoteRequest = {
  items: QuoteRequestItem[];
  subtotal?: number;
  currency?: string;
};

export type CartQuoteResponse = {
  quoteSignature: string;
  quoteCreatedAt: string;
  normalizedHash: string;
  expiresAt: number;
  pricingSummary: {
    items: number;
    subtotal: number;
    currency: string;
  };
  stripePricing?: {
    subtotal: number;
    currency: string;
    validatedPriceCount: number;
  };
};

export type CheckoutSessionRequest = {
  quoteSignature: string;
  successUrl?: string;
  cancelUrl?: string;
  customerEmail?: string;
  allowPromotionCodes?: boolean;
  automaticTax?: boolean;
  metadata?: Record<string, unknown>;
};

export type CheckoutSessionResponse = {
  sessionId: string;
  quoteSignature: string;
  quote: unknown;
  expiresAt: number;
  checkoutUrl: string;
  clientReturnUrl: string;
  stripeSessionId?: string;
  stripeStatus?: string;
  stripeMode?: string;
  stripePaymentStatus?: string;
  stripeExpiresAt?: number;
};

export class CommerceApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "CommerceApiError";
  }
}

function mapCheckoutPayloadToQuoteRequest(
  payload: CheckoutPayload
): CartQuoteRequest {
  const currency = payload.currency ?? "USD";

  return {
    items: payload.items.map((item) => ({
      collectionId: item.collectionId,
      variantId: item.variantId,
      quantity: item.qty,
      name: item.name,
      unitAmount:
        typeof item.unitPriceCents === "number"
          ? item.unitPriceCents / 100
          : undefined,
      currency,
      options: item.options,
    })),
    subtotal:
      typeof payload.totals?.grandTotalCents === "number"
        ? payload.totals.grandTotalCents / 100
        : undefined,
    currency,
  };
}

function unwrapResponse<T>(response: AxiosResponse<T>): T {
  return response.data;
}

function normalizeError(error: any): never {
  if (error?.response) {
    const { status, data } = error.response;
    const message =
      (typeof data?.error === "string" && data.error) ||
      (typeof data?.message === "string" && data.message) ||
      `Request failed with status ${status}`;
    throw new CommerceApiError(message, status, data);
  }

  if (error instanceof CommerceApiError) {
    throw error;
  }

  throw new CommerceApiError(error?.message ?? "Network request failed");
}

export async function createCartQuote(
  payload: CheckoutPayload,
  options?: { signal?: AbortSignal }
): Promise<CartQuoteResponse> {
  try {
    const request = mapCheckoutPayloadToQuoteRequest(payload);
    const response = await api.post<CartQuoteResponse>("/cart/quote", request, {
      signal: options?.signal,
    });
    return unwrapResponse(response);
  } catch (error) {
    normalizeError(error);
  }
}

export async function createCheckoutSession(
  request: CheckoutSessionRequest,
  options?: { signal?: AbortSignal }
): Promise<CheckoutSessionResponse> {
  try {
    const response = await api.post<CheckoutSessionResponse>(
      "/checkout/create-session",
      request,
      {
        signal: options?.signal,
      }
    );
    return unwrapResponse(response);
  } catch (error) {
    normalizeError(error);
  }
}
