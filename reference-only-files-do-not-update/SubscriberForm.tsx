import React, { useLayoutEffect, useRef, useState, useCallback } from "react";
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
  className,
}) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const hasAnimatedRef = useRef(false);

  const [values, setValues] = useState(createInitialValues);
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
  const [formState, setFormState] = useState<FormSubmissionState>(
    createInitialFormState()
  );

  const showStatus =
    formState.status === "success" || formState.status === "error";

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = e.target;
      setValues((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
      // Clear field error on change
      if (fieldErrors[name]) {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      }
    },
    [fieldErrors]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormState({ status: "submitting", message: undefined });

      const validation = validateSubscriberValues(values);
      if (Object.keys(validation.errors).length > 0) {
        setFieldErrors(validation.errors);
        setFormState({
          status: "error",
          message: validation.message,
        });
        return;
      }

      const payload: SubscriberFormPayload = {
        email: values.email.trim(),
        firstName: values.firstName.trim() || undefined,
        lastName: values.lastName.trim() || undefined,
        source: "subscriber_form",
      };

      const ctx = createSubmissionContext();
      const result = await submitSubscriberForm(payload, ctx);

      setFormState({
        status: result.success ? "success" : "error",
        message: result.message,
        isDuplicate: result.isDuplicate,
      });

      if (result.success) {
        setValues(createInitialValues());
        setFieldErrors({});
      }
    },
    [values]
  );

  const statusVariant =
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

  const contentWrapperClassName = twMerge(
    "relative flex flex-col overflow-hidden bg-babe-pink-500/25 backdrop-blur-xl lg:flex-row",
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

    // Create GSAP context for proper cleanup
    const ctx = gsap.context(() => {
      const figure = section.querySelector<HTMLElement>(
        "[data-subscriber-figure]"
      );
      const body = section.querySelector<HTMLElement>("[data-subscriber-body]");

      if (!figure || !body) return;

      // Early exit for reduced motion - set final state immediately
      if (prefersReducedMotion) {
        gsap.set([figure, body], { autoAlpha: 1, x: 0, y: 0 });
        return;
      }

      // Set initial hidden state
      gsap.set(figure, { autoAlpha: 0, x: -56, y: 0 });
      gsap.set(body, { autoAlpha: 0, x: 56, y: 0 });

      // Create a paused timeline for the reveal animation
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

      timelineRef.current = timeline;

      // FIX #1: Use `once: true` to prevent repeated triggers and memory buildup
      // FIX #2: Simplified trigger logic - animate once and stay visible
      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top 80%", // Trigger earlier for better UX
        // FIX #3: Remove `end` - we only need a single trigger point
        once: true, // FIX #4: CRITICAL - Only fire once, then self-destruct
        onEnter: () => {
          if (hasAnimatedRef.current) return;
          hasAnimatedRef.current = true;
          timeline.play();
        },
      });

      triggerRef.current = trigger;
    }, section);

    // Cleanup function
    return () => {
      // Kill the timeline first
      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
      }
      // Kill the trigger
      if (triggerRef.current) {
        triggerRef.current.kill();
        triggerRef.current = null;
      }
      // Revert the GSAP context (kills all animations and ScrollTriggers within)
      ctx.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} className={containerClassName}>
      {/* 
        FIX #5: CRITICAL PERFORMANCE FIX
        
        PROBLEM: blur-3xl (64px) and blur-[120px] cause extreme GPU strain.
        These blur effects are re-rendered on EVERY scroll frame when the 
        section is in view, causing browser crashes.
        
        SOLUTION: 
        1. Reduce blur radii significantly (3xl → xl, 120px → 48px)
        2. Add `will-change: transform` and `contain: strict` for GPU optimization
        3. Use `pointer-events-none` to ensure no interaction overhead
        4. The visual effect remains beautiful but GPU-friendly
      */}
      <div
        className="absolute w-64 h-64 rounded-full -top-24 -left-16 bg-white/20 blur-xl"
        aria-hidden="true"
        style={{
          willChange: "transform",
          contain: "strict",
          transform: "translateZ(0)", // Force GPU layer
        }}
      />
      <div
        className="absolute bottom-[-20%] right-[-10%] h-72 w-72 rounded-full bg-white/15 blur-2xl"
        aria-hidden="true"
        style={{
          willChange: "transform",
          contain: "strict",
          transform: "translateZ(0)", // Force GPU layer
        }}
      />

      <div className={contentWrapperClassName}>
        <figure
          data-subscriber-figure
          className="relative w-full overflow-hidden h-80 bg-babe-pink-800/40 lg:h-auto lg:w-5/12"
          style={{
            // FIX #6: Add containment to prevent layout thrashing
            contain: "layout paint",
          }}
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
          style={{
            // FIX #7: Add containment to prevent layout thrashing
            contain: "layout",
          }}
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
            <FormStatus
              variant={statusVariant}
              title={statusTitle}
              message={statusMessage}
            />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Honeypot - hidden from users, visible to bots */}
              <div className="sr-only" aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input
                  type="text"
                  id="website"
                  name="honeypot"
                  value={values.honeypot}
                  onChange={handleChange}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="First name"
                  htmlFor="subscriber-firstName"
                  optional
                >
                  <Input
                    id="subscriber-firstName"
                    name="firstName"
                    type="text"
                    value={values.firstName}
                    onChange={handleChange}
                    autoComplete="given-name"
                    placeholder="Jane"
                  />
                </Field>

                <Field label="Last name" htmlFor="subscriber-lastName" optional>
                  <Input
                    id="subscriber-lastName"
                    name="lastName"
                    type="text"
                    value={values.lastName}
                    onChange={handleChange}
                    autoComplete="family-name"
                    placeholder="Doe"
                  />
                </Field>
              </div>

              <Field
                label="Email"
                htmlFor="subscriber-email"
                error={fieldErrors.email}
              >
                <Input
                  id="subscriber-email"
                  name="email"
                  type="email"
                  value={values.email}
                  onChange={handleChange}
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  aria-invalid={!!fieldErrors.email}
                />
              </Field>

              <Field error={fieldErrors.consentToSubscribe}>
                <Checkbox
                  id="subscriber-consent"
                  name="consentToSubscribe"
                  checked={values.consentToSubscribe}
                  onChange={handleChange}
                  label="I'd like to receive emails about new products, exclusive offers, and updates."
                />
              </Field>

              <button
                type="submit"
                disabled={formState.status === "submitting"}
                className={twMerge(
                  "w-full rounded-xl bg-white/95 px-6 py-3.5 text-sm font-semibold uppercase tracking-widest text-babe-pink-700 shadow-lg transition-all duration-200",
                  "hover:bg-white hover:shadow-xl hover:scale-[1.02]",
                  "focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-babe-pink-600",
                  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                )}
              >
                {formState.status === "submitting"
                  ? "Subscribing..."
                  : "Subscribe"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default SubscriberForm;
