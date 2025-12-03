import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";

import { EMAIL } from "@/businessInfo/business";

const PrivacyPolicyPage: React.FC = () => {
  const contactEmail = EMAIL;

  return (
    <main className="min-h-screen py-20 bg-gradient-to-b from-cotton-candy-100 via-white to-babe-pink-50 text-slate-900">
      <Helmet>
        <title>Privacy Policy | The Babes Club</title>
      </Helmet>
      <div className="w-11/12 max-w-4xl mx-auto space-y-8">
        <header className="space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-babe-pink-500">
            Updated October 6, 2025
          </p>
          <h1 className="text-4xl font-heading text-babe-pink-700">
            Privacy Policy
          </h1>
          <p className="text-base text-slate-700">
            Babes Club is committed to protecting your privacy while delivering
            a modern shopping experience. This policy explains what information
            we collect, how we use it, and the choices you can make.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-babe-pink-700">
            1. Information We Collect
          </h2>
          <p className="text-sm leading-relaxed text-slate-700">
            We collect information directly from you when you browse the site,
            add items to your cart, or complete checkout. Data includes contact
            details (name, email, shipping address), order history, cart
            contents, and any preferences you save. We also gather limited
            technical data (device type, browser, IP address) to keep the site
            secure and performant.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-babe-pink-700">
            2. How We Use Information
          </h2>
          <ul className="pl-6 space-y-2 text-sm list-disc text-slate-700">
            <li>
              Process and deliver your orders, including confirmations and
              receipts.
            </li>
            <li>Provide customer support and respond to your inquiries.</li>
            <li>
              Personalize product recommendations and bundle pricing offers.
            </li>
            <li>
              Improve site performance, security, and reliability using
              analytics and error logging.
            </li>
            <li>
              Comply with legal responsibilities, including fraud prevention and
              tax reporting.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-babe-pink-700">
            3. Infrastructure & Data Storage
          </h2>
          <p className="text-sm leading-relaxed text-slate-700">
            Our storefront runs on a single-page React app delivered via Amazon
            CloudFront and Amazon S3. When you interact with the site, data
            moves through AWS API Gateway and secure AWS Lambda services before
            reaching DynamoDB and Stripe. Sensitive payment details never touch
            our servers—Stripe securely processes all cards and payment methods
            on our behalf.
          </p>
          <p className="text-sm leading-relaxed text-slate-700">
            Cart and checkout data may be temporarily stored in your
            browser&apos;s session storage or local storage so we can recover
            your selections if you refresh or navigate away. You can clear this
            data at any time by resetting your browser storage.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-babe-pink-700">
            4. Sharing With Third Parties
          </h2>
          <p className="text-sm leading-relaxed text-slate-700">
            We share data only with trusted partners who help us deliver the
            Babes Club experience:
          </p>
          <ul className="pl-6 space-y-2 text-sm list-disc text-slate-700">
            <li>
              <strong>Stripe</strong> – payment processing, fraud detection, and
              tax calculation.
            </li>
            <li>
              <strong>AWS</strong> – hosting, encryption, content delivery, and
              infrastructure monitoring.
            </li>
            <li>
              <strong>Email and CRM tools</strong> – order notifications and
              customer support (only when needed to fulfill your request).
            </li>
          </ul>
          <p className="text-sm leading-relaxed text-slate-700">
            We do not sell your personal information or share it with
            advertisers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-babe-pink-700">
            5. Your Controls
          </h2>
          <ul className="pl-6 space-y-2 text-sm list-disc text-slate-700">
            <li>Update your settings by contacting us at {contactEmail}.</li>
            <li>
              Opt out of marketing emails via unsubscribe links in each message.
            </li>
            <li>
              Request a copy or deletion of your data, subject to legal
              obligations.
            </li>
            <li>
              Disable cookies or local storage in your browser (site features
              may be limited).
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-babe-pink-700">
            6. Security
          </h2>
          <p className="text-sm leading-relaxed text-slate-700">
            We protect your data using encrypted connections (HTTPS), strict
            access controls across AWS, and audit trails on our Lambda
            functions. We regularly review our architecture to ensure resilience
            against emerging threats. If we ever detect a breach, we will notify
            impacted users promptly with clear guidance.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-babe-pink-700">
            7. Updates
          </h2>
          <p className="text-sm leading-relaxed text-slate-700">
            We may update this policy as we evolve our products or integrate new
            services. The &ldquo;Updated&rdquo; date above reflects the latest
            revision. Material changes will be announced on this page and, when
            appropriate, via email.
          </p>
        </section>

        <footer className="pt-6 space-y-4 text-sm border-t border-babe-pink-100 text-slate-600">
          <p>
            Questions? Email us at{" "}
            <a
              className="font-medium transition text-babe-pink-600 underline-offset-4 hover:text-babe-pink-700 hover:underline"
              href={`mailto:${contactEmail}`}
            >
              {contactEmail}
            </a>{" "}
            or send mail to Babes Club HQ, Charleston, SC.
          </p>
          <div className="flex flex-wrap gap-3 text-xs">
            <Link
              to="/terms-of-service"
              className="transition text-babe-pink-600 underline-offset-4 hover:text-babe-pink-700 hover:underline"
            >
              Terms of Service
            </Link>
            <Link
              to="/shipping-policy"
              className="transition text-babe-pink-600 underline-offset-4 hover:text-babe-pink-700 hover:underline"
            >
              Shipping Policy
            </Link>
            <Link
              to="/return-policy"
              className="transition text-babe-pink-600 underline-offset-4 hover:text-babe-pink-700 hover:underline"
            >
              Return Policy
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
};

export default PrivacyPolicyPage;
