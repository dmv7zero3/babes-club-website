import React from "react";
import { Link } from "react-router-dom";

import { EMAIL } from "@/businessInfo/business";

const TermsOfServicePage: React.FC = () => {
  const contactEmail = EMAIL;

  return (
    <main className="min-h-screen bg-gradient-to-b from-cotton-candy-100 via-white to-babe-pink-50 py-20 text-slate-900">
      <div className="mx-auto w-11/12 max-w-4xl space-y-8">
        <header className="space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-babe-pink-500">
            Updated October 6, 2025
          </p>
          <h1 className="text-4xl font-heading text-babe-pink-700">
            Terms of Service
          </h1>
          <p className="text-base text-slate-700">
            Welcome to Babes Club. These terms govern your access to our site
            and services. By using babesclub.co or placing an order, you agree
            to the sections below.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-babe-pink-700">
            1. Eligibility
          </h2>
          <p className="text-sm leading-relaxed text-slate-700">
            You must be at least 18 years old, or the age of majority in your
            jurisdiction, to purchase from Babes Club. By placing an order you
            confirm that all information you submit is accurate and complete.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-babe-pink-700">
            2. Orders & Payment
          </h2>
          <ul className="list-disc space-y-2 pl-6 text-sm text-slate-700">
            <li>
              Orders are accepted when you receive an email confirmation from
              us.
            </li>
            <li>
              All transactions are processed securely by Stripe via AWS API
              Gateway and Lambda. We never store full card details on our
              servers.
            </li>
            <li>
              Prices are shown in USD unless otherwise noted. Taxes and shipping
              rates surface during Stripe Checkout based on your destination.
            </li>
            <li>
              We reserve the right to cancel or refuse orders for suspected
              fraud, inventory errors, or violations of these terms.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-babe-pink-700">
            3. Fulfillment & Delivery
          </h2>
          <p className="text-sm leading-relaxed text-slate-700">
            Once an order is confirmed, our fulfillment team prepares your items
            for shipment. Tracking information is emailed when your order leaves
            our studio. Delivery windows depend on the carrier and destination.
            Refer to our Shipping Policy for details.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-babe-pink-700">
            4. Returns & Exchanges
          </h2>
          <p className="text-sm leading-relaxed text-slate-700">
            We want you to love your jewelry. If your order isn&apos;t the right
            fit, review our Return Policy for eligibility, timelines, and
            packing instructions. Items returned without prior authorization may
            be refused.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-babe-pink-700">
            5. Site Usage
          </h2>
          <ul className="list-disc space-y-2 pl-6 text-sm text-slate-700">
            <li>
              You agree not to disrupt or attempt unauthorized access to our AWS
              infrastructure, including CloudFront, S3, and Lambda endpoints.
            </li>
            <li>
              Automated scraping, reverse engineering, or reselling content from
              babesclub.co without permission is prohibited.
            </li>
            <li>
              We may suspend accounts or block access for abusive behaviour,
              security threats, or other violations.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-babe-pink-700">
            6. Intellectual Property
          </h2>
          <p className="text-sm leading-relaxed text-slate-700">
            All site content—including product photography, copy, logos, and
            custom code—is owned by Babes Club or our partners. You may not use
            it without express written permission.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-babe-pink-700">
            7. Service Availability
          </h2>
          <p className="text-sm leading-relaxed text-slate-700">
            While we strive for 24/7 uptime via global CDNs and observability on
            our Lambda stack, outages may occur. We are not liable for losses
            caused by downtime, maintenance windows, or Force Majeure events.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-babe-pink-700">
            8. Limitation of Liability
          </h2>
          <p className="text-sm leading-relaxed text-slate-700">
            To the maximum extent permitted by law, Babes Club and its team are
            not liable for indirect, incidental, or consequential damages
            arising from your use of the site or products purchased. Our total
            liability is limited to the amount you paid for the applicable
            order.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-babe-pink-700">
            9. Changes to These Terms
          </h2>
          <p className="text-sm leading-relaxed text-slate-700">
            We may update these terms to reflect new features or legal
            requirements. Material changes will be posted here with a new
            "Updated" date and may be communicated via email.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-babe-pink-700">
            10. Contact
          </h2>
          <p className="text-sm leading-relaxed text-slate-700">
            Questions or concerns? Reach us at{" "}
            <a
              className="font-medium text-babe-pink-600 underline-offset-4 transition hover:text-babe-pink-700 hover:underline"
              href={`mailto:${contactEmail}`}
            >
              {contactEmail}
            </a>{" "}
            or mail Babes Club HQ, Charleston, SC.
          </p>
        </section>

        <footer className="space-y-4 border-t border-babe-pink-100 pt-6 text-sm text-slate-600">
          <div className="flex flex-wrap gap-3 text-xs">
            <Link
              to="/privacy-policy"
              className="text-babe-pink-600 underline-offset-4 transition hover:text-babe-pink-700 hover:underline"
            >
              Privacy Policy
            </Link>
            <Link
              to="/shipping-policy"
              className="text-babe-pink-600 underline-offset-4 transition hover:text-babe-pink-700 hover:underline"
            >
              Shipping Policy
            </Link>
            <Link
              to="/return-policy"
              className="text-babe-pink-600 underline-offset-4 transition hover:text-babe-pink-700 hover:underline"
            >
              Return Policy
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
};

export default TermsOfServicePage;
