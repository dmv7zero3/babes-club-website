import axios from "axios";

import { api, ENDPOINTS } from "@/lib/api/apiClient";

const MIN_REQUEST_DURATION = 750;

type NullableString = string | null | undefined;

export type ContactReason =
  | "custom-order"
  | "bulk-order"
  | "event"
  | "collaboration"
  | "question";

export const CONTACT_REASON_OPTIONS: Array<{
  value: ContactReason;
  label: string;
  description?: string;
}> = [
  {
    value: "custom-order",
    label: "Custom design request",
    description:
      "Design a one-of-a-kind piece or personalize an existing style.",
  },
  {
    value: "bulk-order",
    label: "Wholesale or bulk order",
    description:
      "Stock your shop, gift a team, or plan an event with matching sets.",
  },
  {
    value: "event",
    label: "Pop-up or event booking",
    description: "Invite The Babes Club to host an on-site pop-up or workshop.",
  },
  {
    value: "collaboration",
    label: "Collaboration inquiry",
    description: "Partner with our team on a creative project or brand drop.",
  },
  {
    value: "question",
    label: "Something else",
    description: "Ask us anything about products, sizing, shipping, or care.",
  },
];

export type FormSubmissionMetadata = {
  pagePath: string;
  pageUrl: string;
  timezone: NullableString;
  locale: NullableString;
  userAgent: NullableString;
  viewport: NullableString;
};

export type ContactFormPayload = {
  firstName: NullableString;
  lastName: NullableString;
  email: string;
  phone: NullableString;
  reason: ContactReason;
  subject: NullableString;
  message: string;
  subscribeToUpdates: boolean;
  consentToContact: boolean;
  honeypot: string;
  submittedAt: string;
  metadata: FormSubmissionMetadata;
};

export type ContactFormValues = Omit<
  ContactFormPayload,
  "submittedAt" | "metadata"
>;

export type SubscriberFormPayload = {
  email: string;
  firstName: NullableString;
  lastName: NullableString;
  consentToSubscribe: boolean;
  honeypot: string;
  submittedAt: string;
  metadata: FormSubmissionMetadata;
};

export type SubscriberFormValues = Omit<
  SubscriberFormPayload,
  "submittedAt" | "metadata"
>;

export type FormFieldErrors = Partial<Record<string, string>>;

export type FormSubmissionResponse = {
  success: boolean;
  message: string;
  formId?: string;
  status?: number;
  fieldErrors?: FormFieldErrors;
  isDuplicate?: boolean;
  emailSent?: boolean;
};

export type FormSubmissionState = {
  status: "idle" | "submitting" | "success" | "error";
  message: string | null;
  fieldErrors: FormFieldErrors;
  isDuplicate: boolean;
};

export const createInitialFormState = (): FormSubmissionState => ({
  status: "idle",
  message: null,
  fieldErrors: {},
  isDuplicate: false,
});

const ensureMinimumDuration = async <T>(
  promise: Promise<T>,
  minimumMs = MIN_REQUEST_DURATION
): Promise<T> => {
  const [result] = await Promise.all([
    promise,
    new Promise((resolve) => setTimeout(resolve, minimumMs)),
  ]);
  return result;
};

const normalizeMetadata = (): FormSubmissionMetadata => {
  if (typeof window === "undefined") {
    let timezone: NullableString = null;
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
    } catch (error) {
      timezone = null;
    }

    return {
      pagePath: "/",
      pageUrl: "",
      timezone,
      locale: null,
      userAgent: null,
      viewport: null,
    };
  }

  const { location, navigator, innerWidth, innerHeight } = window;
  let timezone: NullableString = null;

  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch (error) {
    timezone = null;
  }

  return {
    pagePath: location.pathname,
    pageUrl: location.href,
    timezone,
    locale: navigator.language ?? null,
    userAgent: navigator.userAgent ?? null,
    viewport: `${innerWidth}x${innerHeight}`,
  };
};

export const createSubmissionContext = () => ({
  submittedAt: new Date().toISOString(),
  metadata: normalizeMetadata(),
});

const mapAxiosError = (error: unknown): FormSubmissionResponse => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 400 && data) {
      const fieldErrors: FormFieldErrors | undefined =
        data && typeof data.errors === "object" && data.errors
          ? (data.errors as FormFieldErrors)
          : undefined;

      return {
        success: false,
        message:
          data.message ??
          "Please double-check the highlighted fields and try again.",
        fieldErrors,
        status,
      };
    }

    if (status === 403) {
      return {
        success: false,
        message: "Access denied. Please refresh and try again.",
        status,
      };
    }

    if (status === 409) {
      return {
        success: false,
        message:
          data?.message ??
          "We already received this submission. Thanks for reaching out!",
        isDuplicate: true,
        status,
      };
    }

    if (status === 429) {
      return {
        success: false,
        message:
          data?.message ??
          "We've noticed a few submissions in a row. Please try again later.",
        status,
      };
    }

    if (status && status >= 500) {
      return {
        success: false,
        message: "Our servers are a bit busy. Please try again in a moment.",
        status,
      };
    }

    if (!error.response) {
      return {
        success: false,
        message:
          "We couldn't reach the server. Check your connection and try again.",
      };
    }
  }

  return {
    success: false,
    message: "Something went wrong. Please try again in a few minutes.",
  };
};

const parseFormResponse = (
  raw: any,
  fallbackSuccessMessage: string
): FormSubmissionResponse => {
  if (!raw) {
    return {
      success: false,
      message: "Unexpected response. Please try again shortly.",
    };
  }

  if (raw.success === false) {
    return {
      success: false,
      message: raw.message || fallbackSuccessMessage,
      fieldErrors: raw.errors,
      formId: raw.formId,
      isDuplicate: raw.isDuplicate,
      emailSent: raw.emailSent,
      status: raw.statusCode,
    };
  }

  const message =
    raw.message ||
    (raw.isDuplicate
      ? "Looks like we already have your message on file."
      : fallbackSuccessMessage);

  return {
    success: raw.success !== false,
    message,
    formId: raw.formId,
    isDuplicate: raw.isDuplicate,
    emailSent: raw.emailSent,
    fieldErrors: raw.errors,
    status: raw.statusCode,
  };
};

export const submitContactForm = async (
  payload: ContactFormPayload
): Promise<FormSubmissionResponse> => {
  try {
    const response = await ensureMinimumDuration(
      api.post(ENDPOINTS.FORMS.CONTACT, payload)
    );

    const data =
      typeof response.data === "string"
        ? JSON.parse(response.data)
        : response.data?.body
          ? typeof response.data.body === "string"
            ? JSON.parse(response.data.body)
            : response.data.body
          : response.data;

    return parseFormResponse(
      data,
      "Thank you! Your message is on its way to the Babes Club team."
    );
  } catch (error) {
    return mapAxiosError(error);
  }
};

export const submitSubscriberForm = async (
  payload: SubscriberFormPayload
): Promise<FormSubmissionResponse> => {
  try {
    const response = await ensureMinimumDuration(
      api.post(ENDPOINTS.FORMS.SUBSCRIBER, payload)
    );

    const data =
      typeof response.data === "string"
        ? JSON.parse(response.data)
        : response.data?.body
          ? typeof response.data.body === "string"
            ? JSON.parse(response.data.body)
            : response.data.body
          : response.data;

    return parseFormResponse(
      data,
      "You're in! Expect Babes Club updates soon."
    );
  } catch (error) {
    return mapAxiosError(error);
  }
};
