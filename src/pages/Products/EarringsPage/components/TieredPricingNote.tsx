import React from "react";

type Tier = {
  minQty: number;
  totalPriceCents: number;
  note?: string;
};

type Props = {
  tier?: Tier;
};

const centsToMoney = (cents: number, currency = "USD") =>
  new Intl.NumberFormat(undefined, { style: "currency", currency }).format(
    cents / 100
  );

const TieredPricingNote: React.FC<Props> = ({ tier }) => {
  if (!tier) return null;
  const perUnit = centsToMoney(Math.round(tier.totalPriceCents / tier.minQty));
  return (
    <div
      className="max-w-3xl px-4 py-5 mx-auto mt-6 text-base font-medium leading-relaxed text-center text-white/95 md:text-lg"
      role="note"
      aria-label="Bundle pricing available"
    >
      {tier.note ? (
        <p>{tier.note}</p>
      ) : (
        <p>
          Bundle deal: Any {tier.minQty} for{" "}
          {centsToMoney(tier.totalPriceCents)} (≈{perUnit} each)
        </p>
      )}
    </div>
  );
};

export default TieredPricingNote;
