import React from "react";

// Hero section featuring brand heading and model image with transparent background
const Hero: React.FC = () => {
  return (
    <section className="relative min-h-[100svh] w-full overflow-hidden flex items-center justify-center ">
      {/* Soft radial glow background accent */}
      {/* <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[65vw] max-w-[950px] aspect-square rounded-full bg-[#f5dcee]/10 blur-3xl" />
      </div> */}

      <div className="relative z-10 flex flex-col-reverse items-center justify-center gap-10 px-6 pb-16 md:flex-row pt-28 md:pt-10 md:pb-0">
        {/* Copy */}
        <div className="max-w-xl text-center md:text-left">
          <h1 className="text-[clamp(3.25rem,8vw,4.6rem)] leading-none tracking-wider font-grand-hotel animate-glow-pulse-soft text-cotton-candy">
            The Babes Club
          </h1>
          <p className="mt-5 text-[22px] font-light font-inter text-cotton-candy/90">
            Handcrafted treasures coming soon.
          </p>
        </div>

        {/* Model image */}
        <div className="relative">
          {/* Strong layered halo behind the model */}
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-20 rounded-full bg-white/80 blur-[110px] mix-blend-screen -z-10"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-28 rounded-full bg-babe-pink/60 blur-[140px] mix-blend-screen -z-20"
          />
          <img
            src="/images/models/model-1.png"
            alt="Back pose model with vertical tattoo design"
            className="w-[260px] xs:w-[300px] md:w-[380px] lg:w-[480px] drop-shadow-[0_0_120px_rgba(255,255,255,0.85)] select-none pointer-events-none"
            draggable={false}
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
