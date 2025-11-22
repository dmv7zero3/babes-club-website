// learn what all this code means at
// https://www.creativecodingclub.com/bundles/creative-coding-club
// unlock over 250 GSAP lessons today

const details = gsap.utils.toArray(".desktopContentSection:not(:first-child)")
const photos = gsap.utils.toArray(".desktopPhoto:not(:first-child)")

gsap.set(photos, {yPercent:101})

const allPhotos = gsap.utils.toArray(".desktopPhoto")

// create
let mm = gsap.matchMedia();

// add a media query. When it matches, the associated function will run
mm.add("(min-width: 600px)", () => {

// this setup code only runs when viewport is at least 600px wide
console.log("desktop")

ScrollTrigger.create({
trigger:".gallery",
start:"top top",
end:"bottom bottom",
pin:".right"
})

//create scrolltrigger for each details section
//trigger photo animation when headline of each details section
//reaches 80% of window height
details.forEach((detail, index)=> {

let headline = detail.querySelector("h1")
let animation = gsap.timeline()
.to(photos[index], {yPercent:0})
.set(allPhotos[index], {autoAlpha:0})
ScrollTrigger.create({
trigger:headline,
start:"top 80%",
end:"top 50%",
animation:animation,
scrub:true,
markers:false
})
})

return () => { // optional
// custom cleanup code here (runs when it STOPS matching)
console.log("mobile")
};
});

/\* ScrollTrigger Docs

https://greensock.com/docs/v3/Plugins/ScrollTrigger

\*/

/\*

---

body {
background:#EEF4FF;
margin:0;
font-family:sans-serif;
color:#333;
}

.spacer {
width:100%;
height:50vh;
background:#ddd;
}

.gallery h1 {
font-size:clamp(2em, 4vw, 6em);
}

.gallery p {
font-size:clamp(1.4em, 2.5vw, 3.5em);
line-height:1.4;
}

.gallery {
display:flex;
/_ outline:1px solid red; _/
}

.left {
width:50%;
}

.right {
height:100vh;
/_ outline:1px solid purple; _/
width:50%;
display:flex;
flex-direction:column;
justify-content:center;
}

.desktopContent {
margin:auto;
width:80%;
}

.desktopContentSection {
min-height:100vh;
/_ outline:1px solid green; _/
display:flex;
flex-direction:column;
justify-content:center;
}

.desktopPhotos {
width:40vw;
height:40vw;
border-radius:20px;
position:relative;
overflow:hidden;
box-shadow:4px 4px 4px rgba(0, 0, 0, 0.4);
}

.desktopPhoto {
position:absolute;
width:100%;
height:100%;
}

.red {
background: crimson;
}

.green {
background:MediumSeaGreen;
}

.blue {
background:dodgerblue;
}

.pink{
background:deepPink;
}

/_ small screen / mobile layout _/
.mobileContent {
display:none;
width:80vw;
}

.mobilePhoto {
width:80vw;
height:80vw;
margin-top:5em;
border-radius:6vw;
}

/_ defines styles for screens up to 599px wide _/
@media screen and (max-width: 599px) {
.left {
display:none;
}

.right {
height:auto;
width:100%;
align-items:center;
}

.desktopPhotos {
display:none;
}

.mobileContent {
display:block;
}

}

---

<div class="spacer"></div>

<div class="gallery">
  <div class="left">
    <div class="desktopContent">
      <div class="desktopContentSection">
        <h1>Red</h1>
        <p>Red is a color often associated with strong emotions such as passion, love, and anger. It's a bold and attention-grabbing color that can evoke feelings of excitement, warmth, and energy.</p>
      </div>
      <div class="desktopContentSection">
        <h1>Green</h1>
        <p>Green is a color that is often associated with nature, growth, and harmony. It is a calming and relaxing color that can evoke feelings of balance, stability, and freshness. In color psychology, green is said to represent balance and stability, making it a popular choice for branding and marketing in the health and wellness industry. </p>
      </div>
      <div class="desktopContentSection">
        <h1>Pink</h1>
        <p>Pink is a color that is often associated with femininity, romance, and sweetness. It is a softer and more delicate shade of red that can evoke feelings of warmth, love, and nurturing.</p>
        <p>In the world of branding and marketing, pink is often used to target a female audience or to promote products that are associated with beauty, love, or romance.</p>
        <p>Pink is also used in the food industry, as it is associated with sweetness and desserts. Pink is often used in breast cancer awareness campaigns, as it has become the signature color of the movement. </p><p>Pink is also commonly used in baby showers and weddings, as it symbolizes love, innocence, and new beginnings.</p>
      </div>
      <div class="desktopContentSection">
        <h1>Blue</h1>
        <p>Blue is a color that is often associated with calmness, trust, and reliability. It is a peaceful and serene color that can evoke feelings of stability, security, and professionalism. In color psychology, blue is said to represent loyalty and trust, making it a popular choice for branding and marketing in the finance and technology industries.</p>
      </div>

    </div>

  </div>

  <div class="right">

    <!-- mobile content -->
    <div class="mobileContent">
      <div class="mobilePhoto red"></div>
      <h1>Red</h1>
      <p>Red is a color often associated with strong emotions such as passion, love, and anger. It's a bold and attention-grabbing color that can evoke feelings of excitement, warmth, and energy.</p>

      <div class="mobilePhoto green"></div>
      <h1>Green</h1>
      <p>Green is a color that is often associated with nature, growth, and harmony. It is a calming and relaxing color that can evoke feelings of balance, stability, and freshness. In color psychology, green is said to represent balance and stability, making it a popular choice for branding and marketing in the health and wellness industry. </p>

      <div class="mobilePhoto pink"></div>
      <h1>Pink</h1>
      <p>Pink is a color that is often associated with femininity, romance, and sweetness. It is a softer and more delicate shade of red that can evoke feelings of warmth, love, and nurturing. In the world of branding and marketing, pink is often used to target a female audience or to promote products that are associated with beauty, love, or romance.</p>

      <div class="mobilePhoto blue"></div>
      <h1>Blue</h1>
      <p>Blue is a color that is often associated with calmness, trust, and reliability. It is a peaceful and serene color that can evoke feelings of stability, security, and professionalism. In color psychology, blue is said to represent loyalty and trust, making it a popular choice for branding and marketing in the finance and technology industries.</p>
    </div>

    <!-- desktop content -->

    <div class="desktopPhotos">
      <div class="desktopPhoto red"></div>
      <div class="desktopPhoto green"></div>
      <div class="desktopPhoto pink"></div>
      <div class="desktopPhoto blue"></div>
    </div>

  </div>
</div>

<div class="spacer"></div>
<div class="spacer"></div>
<div class="spacer"></div>
