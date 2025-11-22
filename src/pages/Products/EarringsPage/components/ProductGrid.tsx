import React from "react";

type Props = {
  children: React.ReactNode;
  ariaLabel?: string;
};

const ProductGrid: React.FC<Props> = ({ children, ariaLabel = "Products" }) => (
  <section className="max-w-[1920px] mx-auto w-11/12" aria-label={ariaLabel}>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  </section>
);

export default ProductGrid;
