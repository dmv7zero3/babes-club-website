import React from "react";
import { Link } from "react-router-dom";

import {
  Checkbox,
  Field,
  FormStatus,
  Input,
  Select,
  Textarea,
} from "@/components/forms";
import { EMAIL } from "@/businessInfo/business";

import {
  CONTACT_REASON_OPTIONS,
  ContactFormPayload,
  ContactFormValues,
  ContactReason,
  FormFieldErrors,
  FormSubmissionState,
  createInitialFormState,
  createSubmissionContext,
  submitContactForm,
} from "./form.actions";

type ValidationResult = {
  errors: FormFieldErrors;
  message?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const PHONE_REGEX = /^[0-9()+\-.\s]*$/;
const MIN_MESSAGE_LENGTH = 20;

const fallbackReason: ContactReason =
  CONTACT_REASON_OPTIONS[0]?.value ?? "custom-order";

const CONTACT_EMAIL = EMAIL;

const createInitialValues = (): ContactFormValues => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  reason: fallbackReason,
  subject: "",
  message: "",
  subscribeToUpdates: false,
  consentToContact: false,
  honeypot: "",
});

const toNullable = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const validateContactValues = (values: ContactFormValues): ValidationResult => {
  const errors: FormFieldErrors = {};
  const trimmedEmail = values.email.trim();

  if (!trimmedEmail) {
    errors.email = "Email is required.";
  } else if (!EMAIL_REGEX.test(trimmedEmail)) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.subject || !values.subject.trim()) {
    errors.subject = "Add a quick subject so we can route your note.";
  }

  const messageBody = values.message ? values.message.trim() : "";
  if (!messageBody) {
    errors.message = "Tell us a little about what you have in mind.";
  } else if (messageBody.length < MIN_MESSAGE_LENGTH) {
    errors.message = `Please share at least ${MIN_MESSAGE_LENGTH} characters so we have context.`;
  }

  const phone = values.phone ? values.phone.trim() : "";
  if (phone) {
    const digitsOnly = phone.replace(/\D/g, "");
    if (!PHONE_REGEX.test(phone)) {
      errors.phone = "Use only numbers, spaces, parentheses, +, or dashes.";
    } else if (digitsOnly.length < 7) {
      errors.phone = "Phone numbers should be at least 7 digits.";
    }
  }

  if (!values.consentToContact) {
    errors.consentToContact =
      "Please confirm we can respond using the details you shared.";
  }

  const reasonValid = CONTACT_REASON_OPTIONS.some(
    (option) => option.value === values.reason
  );
  if (!reasonValid) {
    errors.reason = "Choose the option that fits best.";
  }

  let message: string | undefined;
  if (values.honeypot && values.honeypot.trim().length > 0) {
    message = "We couldn't verify that submission. Please try again.";
  } else if (Object.keys(errors).length > 0) {
    message = "Please fix the highlighted fields before submitting.";
  }

  return { errors, message };
};

const ContactForm: React.FC = () => {
  const [values, setValues] =
    React.useState<ContactFormValues>(createInitialValues);
  const [formState, setFormState] = React.useState<FormSubmissionState>(
    createInitialFormState
  );

  const isSubmitting = formState.status === "submitting";

  const updateField = <K extends keyof ContactFormValues>(
    key: K,
    value: ContactFormValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));

    if (formState.status === "error" && formState.fieldErrors[key]) {
      setFormState((prev) => ({
        ...prev,
        fieldErrors: { ...prev.fieldErrors, [key]: undefined },
      }));
    }
  };

  const handleTextChange = (
    key: keyof ContactFormValues
  ): ((
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void) => {
    return (event) => {
      updateField(key, event.target.value as ContactFormValues[typeof key]);
    };
  };

  const handleCheckboxChange = (
    key: keyof ContactFormValues
  ): ((event: React.ChangeEvent<HTMLInputElement>) => void) => {
    return (event) => {
      updateField(key, event.target.checked as ContactFormValues[typeof key]);
    };
  };

  const handleReasonChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextValue = event.target.value as ContactReason;
    const isValid = CONTACT_REASON_OPTIONS.some(
      (option) => option.value === nextValue
    );
    updateField("reason", isValid ? nextValue : fallbackReason);
  };

  const selectedReason = React.useMemo(
    () =>
      CONTACT_REASON_OPTIONS.find((option) => option.value === values.reason),
    [values.reason]
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) return;

    const { errors, message } = validateContactValues(values);

    if (values.honeypot && values.honeypot.trim().length > 0) {
      setFormState({
        status: "error",
        message:
          message || "We couldn't verify that submission. Please try again.",
        fieldErrors: {},
        isDuplicate: false,
      });
      return;
    }

    if (Object.keys(errors).length > 0) {
      setFormState({
        status: "error",
        message:
          message || "Please fix the highlighted fields before submitting.",
        fieldErrors: errors,
        isDuplicate: false,
      });
      return;
    }

    setFormState({
      status: "submitting",
      message: null,
      fieldErrors: {},
      isDuplicate: false,
    });

    const { submittedAt, metadata } = createSubmissionContext();
    const trimmedEmail = values.email.trim();

    const payload: ContactFormPayload = {
      firstName: toNullable(values.firstName),
      lastName: toNullable(values.lastName),
      email: trimmedEmail,
      phone: toNullable(values.phone),
      reason: values.reason,
      subject: toNullable(values.subject),
      message: values.message.trim(),
      subscribeToUpdates: values.subscribeToUpdates,
      consentToContact: values.consentToContact,
      honeypot: values.honeypot,
      submittedAt,
      metadata,
    };

    const result = await submitContactForm(payload);

    if (result.success) {
      setValues(createInitialValues());
      setFormState({
        status: "success",
        message: result.message ?? null,
        fieldErrors: {},
        isDuplicate: Boolean(result.isDuplicate),
      });
      return;
    }

    setFormState({
      status: "error",
      message:
        result.message ||
        "We couldn't send that just yet. Please try again in a moment.",
      fieldErrors: result.fieldErrors || {},
      isDuplicate: Boolean(result.isDuplicate),
    });
  };

  const showStatus =
    formState.status === "success" || formState.status === "error";

  const statusTone: "success" | "error" | "info" =
    formState.status === "error"
      ? "error"
      : formState.isDuplicate
        ? "info"
        : "success";

  const statusTitle =
    formState.status === "error"
      ? "Let's double-check"
      : formState.isDuplicate
        ? "We've already got you"
        : "Message sent";

  const statusMessage =
    formState.message ||
    (formState.status === "error"
      ? "We couldn't send that just yet. Please try again or reach out directly."
      : formState.isDuplicate
        ? "Looks like we've already received this note. We'll circle back shortly."
        : "Thanks so much! We'll reply within one business day.");

  const statusAction =
    formState.status === "error" ? (
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
        Prefer email? Reach us at{" "}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="font-semibold text-babe-pink-600 underline-offset-4 transition hover:text-babe-pink-700 hover:underline"
        >
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    ) : null;

  return (
    <form
      onSubmit={handleSubmit}
      className="relative space-y-8 rounded-3xl border border-babe-pink-100 bg-white/95 p-8 text-slate-900 shadow-[0_25px_60px_rgba(254,59,161,0.18)]"
      noValidate
    >
      {showStatus ? (
        <div role="status" aria-live="polite">
          <FormStatus
            tone={statusTone}
            title={statusTitle}
            message={statusMessage}
            action={statusAction}
          />
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <Field
          label="First name"
          htmlFor="contact-first-name"
          description="Optional"
          variant="light"
        >
          <Input
            id="contact-first-name"
            name="firstName"
            autoComplete="given-name"
            disabled={isSubmitting}
            value={values.firstName ?? ""}
            hasError={Boolean(formState.fieldErrors.firstName)}
            onChange={handleTextChange("firstName")}
            variant="light"
          />
        </Field>

        <Field
          label="Last name"
          htmlFor="contact-last-name"
          description="Optional"
          variant="light"
        >
          <Input
            id="contact-last-name"
            name="lastName"
            autoComplete="family-name"
            disabled={isSubmitting}
            value={values.lastName ?? ""}
            hasError={Boolean(formState.fieldErrors.lastName)}
            onChange={handleTextChange("lastName")}
            variant="light"
          />
        </Field>
      </div>

      <Field
        label="Email"
        htmlFor="contact-email"
        required
        description="We'll send our reply here."
        error={formState.fieldErrors.email}
        variant="light"
      >
        <Input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={isSubmitting}
          value={values.email}
          hasError={Boolean(formState.fieldErrors.email)}
          onChange={handleTextChange("email")}
          variant="light"
        />
      </Field>

      <Field
        label="Phone"
        htmlFor="contact-phone"
        description="Optional, but helpful for urgent projects."
        error={formState.fieldErrors.phone}
        variant="light"
      >
        <Input
          id="contact-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          disabled={isSubmitting}
          value={values.phone ?? ""}
          hasError={Boolean(formState.fieldErrors.phone)}
          onChange={handleTextChange("phone")}
          variant="light"
        />
      </Field>

      <Field
        label="What can we help with?"
        htmlFor="contact-reason"
        required
        description={selectedReason?.description}
        error={formState.fieldErrors.reason}
        variant="light"
      >
        <Select
          id="contact-reason"
          name="reason"
          value={values.reason}
          required
          disabled={isSubmitting}
          hasError={Boolean(formState.fieldErrors.reason)}
          onChange={handleReasonChange}
          variant="light"
        >
          {CONTACT_REASON_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Subject"
        htmlFor="contact-subject"
        required
        error={formState.fieldErrors.subject}
        variant="light"
      >
        <Input
          id="contact-subject"
          name="subject"
          disabled={isSubmitting}
          value={values.subject ?? ""}
          hasError={Boolean(formState.fieldErrors.subject)}
          onChange={handleTextChange("subject")}
          variant="light"
        />
      </Field>

      <Field
        label="Project details"
        htmlFor="contact-message"
        required
        description="Share product names, quantities, timelines, or any inspiration."
        error={formState.fieldErrors.message}
        variant="light"
      >
        <Textarea
          id="contact-message"
          name="message"
          required
          disabled={isSubmitting}
          value={values.message}
          hasError={Boolean(formState.fieldErrors.message)}
          onChange={handleTextChange("message")}
          variant="light"
        />
      </Field>

      <div className="space-y-4 text-slate-700">
        <Checkbox
          label={
            <>
              Keep me in the loop on new drops, pop-ups, and exclusive offers.
              <span className="block text-xs text-slate-500">
                1–2 emails each month, no spam.
              </span>
            </>
          }
          checked={values.subscribeToUpdates}
          disabled={isSubmitting}
          onChange={handleCheckboxChange("subscribeToUpdates")}
          variant="light"
        />

        <div className="space-y-2">
          <Checkbox
            label={
              <>
                I consent to The Babes Club contacting me about this inquiry.
                <span className="block text-xs text-slate-500">
                  We handle your details per our{" "}
                  <Link
                    to="/privacy-policy"
                    className="text-babe-pink-600 underline decoration-babe-pink-300 transition hover:text-babe-pink-700"
                  >
                    Privacy Policy
                  </Link>
                  .
                </span>
              </>
            }
            checked={values.consentToContact}
            required
            disabled={isSubmitting}
            onChange={handleCheckboxChange("consentToContact")}
            className={
              formState.fieldErrors.consentToContact
                ? "border-rose-400 focus:ring-rose-300/40"
                : undefined
            }
            variant="light"
          />
          {formState.fieldErrors.consentToContact ? (
            <p className="text-xs font-medium text-rose-500">
              {formState.fieldErrors.consentToContact}
            </p>
          ) : null}
        </div>
      </div>

      <div aria-hidden="true" className="hidden">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.honeypot}
          onChange={handleTextChange("honeypot")}
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-full bg-babe-pink px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-[0_20px_35px_rgba(254,59,161,0.35)] transition hover:bg-babe-pink-400 focus:outline-none focus:ring-2 focus:ring-babe-pink/40 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
};

export default ContactForm;
