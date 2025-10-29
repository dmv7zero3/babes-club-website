import React from "react";

// Typed blob shapes and helpers for use across the app

export type BlobName = "BlobA" | "BlobB" | "BlobC";

export const BLOB_SHAPES: Record<BlobName, { d: string; viewBox: string }> = {
  BlobA: {
    viewBox: "0 0 100 100",
    d: "M49.8,9.4c11.1.2,21.8,3.1,30.4,10,9.7,7.9,18.2,18,19.5,30.4,1.4,13.6-1.7,29.1-12.6,37.3-10.4,7.7-24.4.4-37.3,0-12.1-.4-25.1,4.8-34.8-2.4C4.5,76.8-.6,63,0,49.9c.6-12.6,8.4-23.6,18.2-31.6,8.8-7.2,20.2-9.1,31.6-8.9Z",
  },
  BlobB: {
    viewBox: "0 0 100 100",
    d: "M48.7,2.2c11.7.7,17.6,13.4,26.2,21.4,9.2,8.5,23.4,13.8,25,26.2,1.6,13-8.2,24.5-17.7,33.4-9.2,8.6-20.8,14.3-33.4,14.5-12.8.2-25.2-4.7-34.2-13.7C5.3,75.1-.9,62.7.1,49.8c.9-12.1,10.5-20.9,19.2-29.4C27.9,12.1,36.7,1.6,48.7,2.2Z",
  },
  BlobC: {
    viewBox: "0 0 100 100",
    d: "M57.3,1.4c12.6-.4,28.1-2.3,35.6,7.8,7.4,10,7.5,22.8,6.8,35.2-.7,10.9-5.3,22.5-10.9,31.9-6.8,11.6-18.1,22.2-31.5,22.8-13.7.5-24.1-10.7-34.1-20.2C12.9,69-.2,59.1,0,44.8.2,30.5,12.7,20,24,11.5,33.7,4.2,45.3,1.8,57.3,1.4Z",
  },
};

export const blobNames = Object.keys(BLOB_SHAPES) as BlobName[];

export const BlobSvg: React.FC<{
  name: BlobName;
  size?: number;
  color?: string;
  className?: string;
}> = ({ name, size = 64, color = "currentColor", className }) => {
  const shape = BLOB_SHAPES[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox={shape.viewBox}
      className={className}
      aria-hidden="true"
    >
      <path d={shape.d} fill={color} />
    </svg>
  );
};

export default BLOB_SHAPES;
// Note: Removed stray raw <svg> samples that were accidentally appended.
