const ScrollIndicator = () => {
  return (
    <div
      className="absolute flex items-center justify-center transform -translate-x-1/2 left-1/2 bottom-8"
      style={{ zIndex: 20 }}
    >
      <svg
        className="w-6 h-12 text-white"
        viewBox="0 0 32 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block" }}
      >
        {/* Mouse outline */}
        <rect
          x="2"
          y="2"
          width="28"
          height="52"
          rx="14"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
        />
        {/* Animated dot */}
        <circle className="scroll-dot" cx="16" r="3" fill="currentColor" />
      </svg>
      <style>{`
        .scroll-dot {
          cy: 12;
          opacity: 0;
          animation: scroll-dot-move 1.6s cubic-bezier(0.4,0,0.2,1) infinite;
        }
        @keyframes scroll-dot-move {
          0% {
            cy: 12;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          50% {
            cy: 28;
            opacity: 1;
          }
          90% {
            opacity: 0;
          }
          100% {
            cy: 44;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ScrollIndicator;
