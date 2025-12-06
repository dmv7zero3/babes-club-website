import React, { useLayoutEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { Checkbox, Field, FormStatus, Input } from "@/components/forms";
import {
  FormFieldErrors,
  FormSubmissionState,
  SubscriberFormPayload,
  SubscriberFormValues,
  createInitialFormState,
  createSubmissionContext,
  submitSubscriberForm,
} from "@/components/ContactForm/form.actions";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

const createInitialValues = (): SubscriberFormValues => ({
  email: "",
  firstName: "",
  lastName: "",
  consentToSubscribe: false,
  honeypot: "",
});

type ValidationResult = {
  errors: FormFieldErrors;
  message?: string;
};

const validateSubscriberValues = (
  values: SubscriberFormValues
): ValidationResult => {
  const errors: FormFieldErrors = {};
  const email = values.email.trim();

  if (!email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.consentToSubscribe) {
    errors.consentToSubscribe =
      "Please confirm you'd like to receive emails from us.";
  }

  let message: string | undefined;

  if (values.honeypot && values.honeypot.trim().length > 0) {
    message = "We couldn't verify that submission. Please try again.";
  } else if (Object.keys(errors).length > 0) {
    message = "Please fix the highlighted fields before subscribing.";
  }

  return { errors, message };
};

type SubscriberFormProps = {
  headline?: string;
  description?: string;
  className?: string;
};

const SubscriberForm: React.FC<SubscriberFormProps> = ({
  headline = "Stay in the club",
  description = "Be the first to know about new drops, restocks, pop-ups, and exclusive bundles.",
  className = "",
}) => {
  const [values, setValues] =
    React.useState<SubscriberFormValues>(createInitialValues);
  const [formState, setFormState] = React.useState<FormSubmissionState>(
    createInitialFormState
  );
  const sectionRef = useRef<HTMLElement | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const hasAnimatedRef = useRef(false);

  const isSubmitting = formState.status === "submitting";

  const updateField = <K extends keyof SubscriberFormValues>(
    key: K,
    value: SubscriberFormValues[K]
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
    key: keyof SubscriberFormValues
  ): ((event: React.ChangeEvent<HTMLInputElement>) => void) => {
    return (event) => {
      updateField(key, event.target.value as SubscriberFormValues[typeof key]);
    };
  };

  const handleCheckboxChange = (
    key: keyof SubscriberFormValues
  ): ((event: React.ChangeEvent<HTMLInputElement>) => void) => {
    return (event) => {
      updateField(
        key,
        event.target.checked as SubscriberFormValues[typeof key]
      );
    };
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) return;

    const { errors, message } = validateSubscriberValues(values);

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
          message || "Please fix the highlighted fields before subscribing.",
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

    const payload: SubscriberFormPayload = {
      email: values.email.trim(),
      firstName: values.firstName?.trim() || null,
      lastName: values.lastName?.trim() || null,
      consentToSubscribe: values.consentToSubscribe,
      honeypot: values.honeypot,
      submittedAt,
      metadata,
    };

    const result = await submitSubscriberForm(payload);

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
        "We couldn't add you just yet. Please try again in a moment.",
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
      ? "Something went wrong"
      : formState.isDuplicate
        ? "Already on the list"
        : "You're in";

  const statusMessage =
    formState.message ||
    (formState.status === "error"
      ? "Please try again or refresh the page."
      : formState.isDuplicate
        ? "Looks like you're already subscribed — watch your inbox."
        : "Welcome to The Babes Club — expect your first note soon.");

  const containerClassName = twMerge(
    "relative isolate overflow-hidden rounded-[32px] bg-babe-pink-600/90",
    className
  );

  // FIX: backdrop-blur-xl removed (GPU killer) - replaced with minimal backdrop-blur-sm
  const contentWrapperClassName = twMerge(
    "relative flex flex-col overflow-hidden bg-babe-pink-500/25 backdrop-blur-sm lg:flex-row",
    "before:absolute before:inset-0 before:bg-white/15 before:opacity-50 before:content-['']"
  );

  const imageSrc = "/images/vertical/holly-chronic-8.jpg";

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    if (!section) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const prefersReducedMotion = mediaQuery.matches;

    const ctx = gsap.context(() => {
      const figure = section.querySelector<HTMLElement>(
        "[data-subscriber-figure]"
      );
      const body = section.querySelector<HTMLElement>("[data-subscriber-body]");

      if (!figure || !body) return;

      if (prefersReducedMotion) {
        gsap.set([figure, body], { autoAlpha: 1, x: 0, y: 0 });
        return;
      }

      gsap.set(figure, { autoAlpha: 0, x: -56, y: 0 });
      gsap.set(body, { autoAlpha: 0, x: 56, y: 0 });

      const timeline = gsap
        .timeline({ paused: true })
        .to(figure, {
          autoAlpha: 1,
          x: 0,
          duration: 0.8,
          ease: "power3.out",
        })
        .to(
          body,
          {
            autoAlpha: 1,
            x: 0,
            duration: 0.8,
            ease: "power3.out",
          },
          0.1
        );

      // FIX: Store timeline ref for cleanup
      timelineRef.current = timeline;

      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top 80%",
        // FIX: Added `once: true` - prevents infinite trigger callbacks and memory buildup
        once: true,
        onEnter: () => {
          if (hasAnimatedRef.current) return;
          hasAnimatedRef.current = true;
          timeline.play();
        },
      });

      // FIX: Store trigger ref for cleanup
      triggerRef.current = trigger;

      // FIX: Proper cleanup chain
      return () => {
        // 1. Kill trigger first
        if (triggerRef.current) {
          triggerRef.current.kill();
          triggerRef.current = null;
        }
        // 2. Kill timeline
        if (timelineRef.current) {
          timelineRef.current.kill();
          timelineRef.current = null;
        }
      };
    }, section);

    return () => {
      // 3. Revert context last
      ctx.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} className={containerClassName}>
      {/* FIX: GPU-optimized blur glow - replaced blur-3xl (64px) with 24px max */}
      <div
        className="absolute w-64 h-64 rounded-full -top-24 -left-16 bg-white/30"
        style={{
          filter: "blur(24px)",
          contain: "strict",
          transform: "translateZ(0)",
        }}
        aria-hidden
      />
      {/* FIX: GPU-optimized blur glow - replaced blur-[120px] (480px) with 32px max */}
      <div
        className="absolute bottom-[-20%] right-[-10%] h-72 w-72 rounded-full bg-white/25"
        style={{
          filter: "blur(32px)",
          contain: "strict",
          transform: "translateZ(0)",
        }}
        aria-hidden
      />

      <div className={contentWrapperClassName}>
        <figure
          data-subscriber-figure
          className="relative w-full overflow-hidden h-80 bg-babe-pink-800/40 lg:h-auto lg:w-5/12"
        >
          <img
            src={imageSrc}
            alt="Babes Club model wearing jewelry"
            loading="lazy"
            className="object-cover object-center w-full h-full"
          />
          <div className="absolute inset-0 pointer-events-none bg-white/12 mix-blend-screen" />
        </figure>

        <div
          data-subscriber-body
          className="relative flex flex-col flex-1 gap-8 px-6 py-10 sm:px-10 lg:px-12 lg:py-14"
        >
          <div className="space-y-3">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.6em] text-white/60">
              Join the club list
            </p>
            <h3 className="max-w-3xl text-2xl font-semibold uppercase tracking-[0.25em] text-white sm:text-3xl">
              {headline}
            </h3>
            <p className="max-w-2xl text-base leading-relaxed text-white/75">
              {description}
            </p>
          </div>

          {showStatus ? (
            <div role="status" aria-live="polite" className="relative">
              <FormStatus
                tone={statusTone}
                title={statusTitle}
                message={statusMessage}
              />
            </div>
          ) : null}

          <form
            className="relative space-y-6"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="grid gap-5 sm:grid-cols-2 sm:items-end">
              <Field
                label="First name"
                htmlFor="subscriber-first-name"
                description="Optional"
                className="sm:col-span-1"
              >
                <Input
                  id="subscriber-first-name"
                  name="firstName"
                  autoComplete="given-name"
                  disabled={isSubmitting}
                  value={values.firstName ?? ""}
                  onChange={handleTextChange("firstName")}
                  className="px-5 py-4 text-base text-white border rounded-2xl border-white/30 bg-white/15 placeholder:text-white/60"
                />
              </Field>

              <Field
                label="Email"
                htmlFor="subscriber-email"
                required
                error={formState.fieldErrors.email}
                description=" "
                className="sm:col-span-1"
              >
                <Input
                  id="subscriber-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={isSubmitting}
                  value={values.email}
                  hasError={Boolean(formState.fieldErrors.email)}
                  onChange={handleTextChange("email")}
                  className="px-5 py-4 text-base text-white border rounded-2xl border-white/30 bg-white/15 placeholder:text-white/60"
                />
              </Field>
            </div>

            <div className="space-y-3">
              <Checkbox
                label="Yes, add me to The Babes Club email list."
                checked={values.consentToSubscribe}
                required
                disabled={isSubmitting}
                onChange={handleCheckboxChange("consentToSubscribe")}
                className={
                  formState.fieldErrors.consentToSubscribe
                    ? "border-rose-400/60 focus:ring-rose-400/40"
                    : undefined
                }
              />
              {formState.fieldErrors.consentToSubscribe ? (
                <p className="text-xs font-medium text-rose-200">
                  {formState.fieldErrors.consentToSubscribe}
                </p>
              ) : null}
            </div>

            <div aria-hidden="true" className="hidden">
              <label htmlFor="subscriber-website">Website</label>
              <input
                id="subscriber-website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={values.honeypot}
                onChange={handleTextChange("honeypot")}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">
                No spam. Unsubscribe any time.
              </p>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-babe-pink transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-babe-pink-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span
                  className="absolute inset-0 transition duration-300 ease-out rounded-full bg-white/40 opacity-60 blur-2xl group-hover:opacity-80 group-focus-visible:opacity-80"
                  aria-hidden
                />
                <span className="relative">
                  {isSubmitting ? "Joining…" : "Join the list"}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default SubscriberForm;
