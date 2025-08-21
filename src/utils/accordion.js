// src/core/utils/accordion.js
export function toggleAccordion() {
  const content = this.nextElementSibling;
  const icon = this.querySelector(".accordion-icon-faq");
  const paragraph = content.querySelector("p");
  const anchor = content.querySelector("a"); // New line to select the anchor element
  content.classList.toggle("hidden");
  gsap.killTweensOf(icon);
  const rotation = icon._gsAnimation || { rotation: 0 };
  gsap.to(rotation, {
    rotation: rotation.rotation + 90,
    duration: 0.5,
    onUpdate: function () {
      icon.style.transform = `rotate(${rotation.rotation % 360}deg)`;
    },
  });
  if (!content.classList.contains("hidden")) {
    // Check if accordion is opening
    gsap.fromTo(
      [paragraph, anchor], // Modify this line to include both paragraph and anchor
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.3, delay: 0.2, stagger: 0.4 } // Stagger the animation
    );
  } else {
    gsap.set([paragraph, anchor], { opacity: 0 }); // Hide the paragraph and anchor if accordion is closing
  }
}
