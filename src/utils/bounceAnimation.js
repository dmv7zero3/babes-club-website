import { gsap } from "gsap";

export function initializeBounceAnimation() {
  let animEvent;
  const screenWidth = window.screen.width;
  if (screenWidth > 992) {
    animEvent = "mouseenter";
  } else {
    animEvent = "click";
  }

  const cards = document.querySelectorAll(".bounce-card-wrapper");

  cards.forEach((card, index) => {
    card.addEventListener(animEvent, function () {
      const bounceTimeLine = gsap.timeline({});
      bounceTimeLine.to(card, {
        duration: 0.3,
        scale: 0.6,
      });
      bounceTimeLine.to(card, {
        duration: 0.8,
        ease: "elastic.out(1, 0.5)",
        scale: 1,
      });
    });
  });
}
